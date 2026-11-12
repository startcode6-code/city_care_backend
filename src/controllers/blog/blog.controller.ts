
import type { Request, Response, NextFunction } from "express";

import {
    createBlog,
    updateBlog,
    deleteBlog,
    uploadBlogPhoto,
    getBlog,
} from "../../services/blog/blog.service";

import { AppError } from "../../lib/error";

import { uploadImageToCloudinary } from "../../services/cloudinary/cloudinary.service";

// ==========================================
// CREATE BLOG
// ==========================================

export async function createBlogController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = (
            req as Request & { user?: { id: string } }
        ).user?.id;

        if (!userId) {
            throw new AppError(
                "Unauthorized. Admin ID not found.",
                401
            );
        }

        const newBlog = await createBlog(userId, req.body);

        return res.status(201).json({
            success: true,
            message: "Blog created successfully.",
            data: newBlog,
        });
    } catch (error) {
        next(error);
    }
}

// ==========================================
// UPDATE BLOG
// ==========================================

export async function updateBlogController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;

        if (typeof id !== "string" || !id.trim()) {
            throw new AppError("Valid blog ID is required.", 400);
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            throw new AppError(
                "Please provide blog fields to update.",
                400
            );
        }

        const updatedBlog = await updateBlog(id, req.body);

        return res.status(200).json({
            success: true,
            message: "Blog updated successfully.",
            data: updatedBlog,
        });
    } catch (error) {
        next(error);
    }
}

// ==========================================
// DELETE BLOG
// ==========================================

export async function deleteBlogController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;

        if (typeof id !== "string" || !id.trim()) {
            throw new AppError("Valid blog ID is required.", 400);
        }

        const result = await deleteBlog(id);

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                id: result.id,
            },
        });
    } catch (error) {
        next(error);
    }
}

// ==========================================
// UPLOAD BLOG PHOTO ONLY
// ==========================================

export async function uploadBlogPhotoOnly(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.file || !req.file.buffer) {
            throw new AppError("Please select a photo.", 400);
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(req.file.mimetype)) {
            throw new AppError(
                "Only JPG, JPEG, PNG and WEBP images are allowed.",
                400
            );
        }

        if (req.file.size > 5 * 1024 * 1024) {
            throw new AppError(
                "Image size must not exceed 5MB.",
                400
            );
        }

        const uploadedImage = await uploadImageToCloudinary({
            buffer: req.file.buffer,
            folderName: "kp-hospital/blogs",
        });

        return res.status(200).json({
            success: true,
            message: "Blog photo uploaded successfully.",
            data: {
                imageUrl: uploadedImage.secure_url,
                imagePublicId: uploadedImage.public_id,
            },
        });
    } catch (error) {
        next(error);
    }
}

// ==========================================
// UPDATE BLOG PHOTO
// ==========================================

export async function updateBlogPhoto(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;

        if (typeof id !== "string" || !id.trim()) {
            throw new AppError("Invalid blog ID.", 400);
        }

        if (!req.file || !req.file.buffer) {
            throw new AppError("Please select a photo.", 400);
        }

        const updatedBlog = await uploadBlogPhoto(id, req.file);

        return res.status(200).json({
            success: true,
            message: "Blog photo updated successfully.",
            data: updatedBlog,
        });
    } catch (error) {
        next(error);
    }
}

// ==========================================
// GET ALL BLOGS
// ==========================================

export async function getBlogController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const blogs = await getBlog();

        return res.status(200).json({
            success: true,
            message: "Blog fetched successfully.",
            results: blogs.length,
            data: blogs,
        });
    } catch (error) {
        next(error);
    }
}
