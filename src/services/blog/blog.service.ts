
import { db } from "../../db";
import { blog } from "../../db/schema/blog";
import { eq, and, ne } from "drizzle-orm";
import { AppError } from "../../lib/error";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../cloudinary/cloudinary.service";

type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface CreateBlogInput {
    title: string;
    slug?: string;
    category: string;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    author: string;
    readTime?: string | null;
    summary: string;
    content: string;
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
            imageUrl: data.imageUrl ?? null,
            imagePublicId: data.imagePublicId ?? null,
            readTime: data.readTime ?? null,
            summary,
            content,
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

    const updateData: Record<string, unknown> = {};

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
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imagePublicId !== undefined) updateData.imagePublicId = data.imagePublicId;
    if (data.readTime !== undefined) updateData.readTime = data.readTime;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.content !== undefined) updateData.content = data.content;
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
        .set(updateData as Partial<typeof blog.$inferInsert>)
        .where(eq(blog.id, blogId))
        .returning();

    return updatedBlog;
}

// DELETE BLOG
export async function deleteBlog(blogId: string) {
    const [existingBlog] = await db
        .select({ id: blog.id })
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    if (!existingBlog) {
        throw createError("Blog not found.", 404);
    }

    await db
        .delete(blog)
        .where(eq(blog.id, blogId));

    return {
        id: blogId,
        message: "Blog deleted successfully.",
    };
}

export async function uploadServicePhoto(blogId: string, file: Express.Multer.File) {
    const [existingService] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    if (!existingService) {
        throw new AppError("Doctor not found.", 404);
    }

    if (!file || !file.buffer) {
        throw new AppError("Invalid image file.", 400);
    }

    // Upload new image to Cloudinary
    const uploadedImage = await uploadImageToCloudinary({ buffer: file.buffer, folderName: "service" });

    let updatedDoctor;

    try {
        const [result] = await db
            .update(blog)
            .set({ imageUrl: uploadedImage.secure_url, imagePublicId: uploadedImage.public_id })
            .where(eq(blog.id, blogId))
            .returning();

        if (!result) {
            throw new AppError("Failed to update doctor photo.", 500);
        }

        updatedDoctor = result;
    } catch (error) {

        await deleteImageFromCloudinary(uploadedImage.public_id
        ).catch((cleanupError) => {
            console.error("New image cleanup failed:", cleanupError);
        });

        throw error;
    }

    // Delete old image only after successful DB update
    if (existingService.imageUrl && existingService.imagePublicId !== uploadedImage.public_id) {
        try {
            await deleteImageFromCloudinary(existingService.imagePublicId!);
        } catch (error) {
            console.error("Old doctor photo deletion failed:", error);
        }
    }

    return updatedDoctor;
}

export async function deleteServicePhoto(blogId: string) {
    const [existingService] = await db
        .select()
        .from(blog)
        .where(eq(blog.id, blogId))
        .limit(1);

    if (!existingService) {
        throw new AppError("Doctor not found.", 404);
    }

    if (!existingService.imagePublicId) {
        throw new AppError("Doctor photo not found.", 404);
    }

    const [updatedDoctor] = await db
        .update(blog)
        .set({ imageUrl: null, imagePublicId: null })
        .where(eq(blog.id, blogId))
        .returning();

    await deleteImageFromCloudinary(existingService.imagePublicId);
    return updatedDoctor;
}

export async function getBlog() {
    const allBlog = await db
        .select()
        .from(blog);

    return allBlog;
}