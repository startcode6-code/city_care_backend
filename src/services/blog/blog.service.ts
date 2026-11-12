
import { db } from "../../db";
import { blog } from "../../db/schema/blog";
import { eq, and, ne } from "drizzle-orm";
import { AppError } from "../../lib/error";

import {
    uploadImageToCloudinary,
    deleteImageFromCloudinary,
} from "../cloudinary/cloudinary.service";

type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface CreateBlogInput {
    title: string;
    slug?: string;
    category: string;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    imageAlt?: string | null;

    author: string;
    readTime?: string | null;
    summary: string;
    content: string;

    tags?: string[];

    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string[];

    status?: BlogStatus;
    isFeatured?: boolean;
}

type UpdateBlogInput = Partial<CreateBlogInput>;

function createError(message: string, statusCode: number) {
    return Object.assign(new Error(message), { statusCode });
}

function generateSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// CREATE BLOG
export async function createBlog(userId: string, data: CreateBlogInput) {
    const {
        title,
        category,
        author,
        summary,
        content,
    } = data;

    if (!title || !category || !author || !summary || !content) {
        throw createError(
            "Title, category, author, summary and content are required.",
            400
        );
    }

    const slug = generateSlug(data.slug || title);

    if (!slug) {
        throw createError("Invalid blog slug.", 400);
    }

    const [existingBlog] = await db
        .select({ id: blog.id })
        .from(blog)
        .where(eq(blog.slug, slug))
        .limit(1);

    if (existingBlog) {
        throw createError("Blog slug already exists.", 409);
    }

    const status = data.status ?? "DRAFT";

    const [newBlog] = await db
        .insert(blog)
        .values({
            userId,
            title,
            slug,
            category,
            author,

            imageUrl: data.imageUrl ?? null,
            imagePublicId: data.imagePublicId ?? null,
            imageAlt: data.imageAlt ?? null,

            readTime: data.readTime ?? null,
            summary,
            content,

            tags: data.tags ?? [],

            metaTitle: data.metaTitle ?? null,
            metaDescription: data.metaDescription ?? null,
            metaKeywords: data.metaKeywords ?? [],

            status,
            isFeatured: data.isFeatured ?? false,
            publishedAt: status === "PUBLISHED" ? new Date() : null,
        })
        .returning();

    return newBlog;
}

// UPDATE BLOG
export async function updateBlog(blogId: string, data: UpdateBlogInput) {
    const [existingBlog] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    if (!existingBlog) {
        throw createError("Blog not found.", 404);
    }

    const updateData: Partial<typeof blog.$inferInsert> = {};

    if (data.title !== undefined) {
        updateData.title = data.title;
    }

    if (data.slug !== undefined || data.title !== undefined) {
        const newSlug = generateSlug(data.slug ?? data.title!);

        if (!newSlug) {
            throw createError("Invalid blog slug.", 400);
        }

        const [duplicateSlug] = await db
            .select({ id: blog.id })
            .from(blog)
            .where(
                and(
                    eq(blog.slug, newSlug),
                    ne(blog.id, blogId)
                )
            )
            .limit(1);

        if (duplicateSlug) {
            throw createError("Blog slug already exists.", 409);
        }

        updateData.slug = newSlug;
    }

    if (data.category !== undefined) updateData.category = data.category;
    if (data.author !== undefined) updateData.author = data.author;

    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imagePublicId !== undefined) updateData.imagePublicId = data.imagePublicId;
    if (data.imageAlt !== undefined) updateData.imageAlt = data.imageAlt;

    if (data.readTime !== undefined) updateData.readTime = data.readTime;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.content !== undefined) updateData.content = data.content;

    if (data.tags !== undefined) updateData.tags = data.tags;

    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.metaKeywords !== undefined) updateData.metaKeywords = data.metaKeywords;

    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    if (data.status !== undefined) {
        updateData.status = data.status;

        if (data.status === "PUBLISHED" && existingBlog.status !== "PUBLISHED") {
            updateData.publishedAt = new Date();
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw createError("Please provide at least one field to update.", 400);
    }

    updateData.updatedAt = new Date();

    const [updatedBlog] = await db
        .update(blog)
        .set(updateData)
        .where(eq(blog.id, blogId))
        .returning();

    return updatedBlog;
}

// DELETE BLOG
export async function deleteBlog(blogId: string) {
    const [existingBlog] = await db
        .select({ id: blog.id, imagePublicId: blog.imagePublicId })
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    if (!existingBlog) {
        throw createError("Blog not found.", 404);
    }

    await db
        .delete(blog)
        .where(eq(blog.id, blogId));

    if (existingBlog.imagePublicId) {
        await deleteImageFromCloudinary(existingBlog.imagePublicId)
            .catch((error) => console.error("Blog image deletion failed:", error));
    }

    return {
        id: blogId,
        message: "Blog deleted successfully.",
    };
}

// UPLOAD BLOG PHOTO
export async function uploadBlogPhoto(blogId: string, file: Express.Multer.File) {
    const [existingBlog] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    if (!existingBlog) {
        throw new AppError("Blog not found.", 404);
    }

    if (!file || !file.buffer) {
        throw new AppError("Invalid image file.", 400);
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError("Only JPG, JPEG, PNG and WEBP images are allowed.", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new AppError("Image size must not exceed 5MB.", 400);
    }

    const uploadedImage = await uploadImageToCloudinary({
        buffer: file.buffer,
        folderName: "kp-hospital/blogs",
    });

    let updatedBlog;

    try {
        const [result] = await db
            .update(blog)
            .set({
                imageUrl: uploadedImage.secure_url,
                imagePublicId: uploadedImage.public_id,
                updatedAt: new Date(),
            })
            .where(eq(blog.id, blogId))
            .returning();

        if (!result) {
            throw new AppError("Failed to update blog photo.", 500);
        }

        updatedBlog = result;
    } catch (error) {
        await deleteImageFromCloudinary(uploadedImage.public_id)
            .catch((cleanupError) => {
                console.error("New image cleanup failed:", cleanupError);
            });

        throw error;
    }

    if (
        existingBlog.imagePublicId &&
        existingBlog.imagePublicId !== uploadedImage.public_id
    ) {
        try {
            await deleteImageFromCloudinary(existingBlog.imagePublicId);
        } catch (error) {
            console.error("Old blog image deletion failed:", error);
        }
    }

    return updatedBlog;
}

// DELETE BLOG PHOTO
export async function deleteBlogPhoto(blogId: string) {
    const [existingBlog] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    if (!existingBlog) {
        throw new AppError("Blog not found.", 404);
    }

    if (!existingBlog.imagePublicId) {
        throw new AppError("Blog image not found.", 404);
    }

    const [updatedBlog] = await db
        .update(blog)
        .set({
            imageUrl: null,
            imagePublicId: null,
            imageAlt: null,
            updatedAt: new Date(),
        })
        .where(eq(blog.id, blogId))
        .returning();

    await deleteImageFromCloudinary(existingBlog.imagePublicId)
        .catch((error) => {
            console.error("Blog image deletion failed:", error);
        });

    return updatedBlog;
}

// GET ALL BLOGS
export async function getBlog() {
    const allBlog = await db
        .select()
        .from(blog);

    return allBlog;
}

// GET SINGLE BLOG
export async function getBlogById(blogId: string) {
    const [result] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    if (!result) {
        throw createError("Blog not found.", 404);
    }

    return result;
}
