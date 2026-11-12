
import type { Request, Response, NextFunction } from "express";
import { createBlog, updateBlog, deleteBlog, uploadServicePhoto, getBlog } from "../../services/blog/blog.service";
import { AppError } from "../../lib/error";
import { uploadImageToCloudinary } from "../../services/cloudinary/cloudinary.service";


// CREATE BLOG
export async function createBlogController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as Request & { user?: { id: string } }).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Admin ID not found.",
            });
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

// UPDATE BLOG
export async function updateBlogController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = req.params.id;

        if (typeof id !== "string" || !id.trim()) {
            return res.status(400).json({
                success: false,
                message: "Valid blog ID is required.",
            });
        }

        console.log("BLOG UPDATE BODY:", req.body);

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide blog fields to update.",
            });
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

// DELETE BLOG
export async function deleteBlogController(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (typeof id !== "string" || !id.trim()) {
            return res.status(400).json({
                success: false,
                message: "Valid blog ID is required.",
            });
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


export async function uploadBlogPhotoOnly(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.file) {
            throw new AppError("Please select a photo.", 400);
        }

        const uploadedImage = await uploadImageToCloudinary({ buffer: req.file.buffer, folderName: "blog" });

        return res.status(200).json({
            success: true,
            message: "Photo uploaded successfully.",
            data: {
                photoUrl: uploadedImage.secure_url,
                photoPublicId: uploadedImage.public_id,
            },
        });
    } catch (error) {
        next(error);
    }
}


export async function updateBlogPhoto(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string" || !id.trim()) {
            throw new AppError("Invalid blog ID.", 400);
        }

        if (!req.file) {
            throw new AppError("Please select a photo.", 400);
        }

        const doctor = await uploadServicePhoto(id, req.file);

        return res.status(200).json({
            success: true,
            message: "Blog photo updated successfully.",
            data: doctor,
        });

    } catch (error) {
        next(error);
    }
}

export async function getBlogController(req: Request, res: Response) {
    try {
        const userId = req.user?.id;



        const doctorsList = await getBlog();

        return res.status(200).json({
            success: true,
            message: "Blog fetched successfully.",
            results: doctorsList.length,
            data: doctorsList,
        });
    } catch (error: unknown) {
        console.error("Fetch blog error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching blog.",
        });
    }
}