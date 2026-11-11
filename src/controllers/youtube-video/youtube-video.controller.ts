
import type { Request, Response, NextFunction } from "express";
import { createYoutubeVideo, updateYoutubeVideo, getAllYoutubeVideos, deleteYoutubeVideo } from "../../services/youtube-video/youtube-video.service";
import { AppError } from "../../lib/error";

export async function createYoutubeVideoController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { title, category, videoUrl } = req.body;

        // Validate required fields
        if (!title || !category || !videoUrl) {
            return res.status(400).json({
                success: false,
                message: "Title, category and video URL are required.",
            });
        }

        // Validate YouTube URL
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(videoUrl);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid YouTube URL.",
            });
        }

        const isYoutubeUrl = parsedUrl.hostname === "youtube.com" || parsedUrl.hostname === "www.youtube.com" || parsedUrl.hostname === "youtu.be" || parsedUrl.hostname === "www.youtube.com";

        if (!isYoutubeUrl) {
            return res.status(400).json({
                success: false,
                message: "Only YouTube video URLs are allowed.",
            });
        }

        // Get authenticated admin ID
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login first.",
            });
        }

        const newVideo = await createYoutubeVideo(userId, {
            title: title.trim(),
            category: category.trim(),
            videoUrl: videoUrl.trim(),
        });

        return res.status(201).json({
            success: true,
            message: "YouTube video created successfully.",
            data: newVideo,
        });
    } catch (error) {
        next(error);
    }
}


export async function updateyoutubeVideoController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const { title, category, videoUrl } = req.body;

        const userId = req.user?.id;

        if (!id || Array.isArray(id)) {
            throw new AppError("Invalid video ID.", 400);
        }

        // Check authentication
        if (!userId) {
            throw new AppError(
                "Unauthorized. Please login first.",
                401
            );
        }

        // Check video ID
        if (!id) {
            throw new AppError("Video ID is required.", 400);
        }

        // Check empty body
        if (
            title === undefined &&
            category === undefined &&
            videoUrl === undefined
        ) {
            throw new AppError(
                "Please provide at least one field to update.",
                400
            );
        }

        // Validate fields
        if ((title !== undefined && (typeof title !== "string" || !title.trim())) ||
            (category !== undefined && (typeof category !== "string" || !category.trim())) ||
            (videoUrl !== undefined && (typeof videoUrl !== "string" || !videoUrl.trim()))) {
            throw new AppError("Provided fields must contain valid non-empty strings.", 400);
        }

        // Validate YouTube URL
        if (videoUrl !== undefined) {
            let parsedUrl: URL;

            try {
                parsedUrl = new URL(videoUrl.trim());
            } catch {
                throw new AppError(
                    "Please provide a valid YouTube URL.",
                    400
                );
            }

            const allowedHosts = [
                "youtube.com",
                "www.youtube.com",
                "m.youtube.com",
                "youtu.be",
                "www.youtu.be",
            ];

            if (
                parsedUrl.protocol !== "https:" ||
                !allowedHosts.includes(parsedUrl.hostname)
            ) {
                throw new AppError(
                    "Only valid HTTPS YouTube URLs are allowed.",
                    400
                );
            }
        }

        // Update video
        const updatedVideo = await updateYoutubeVideo(id, userId, {
            ...(title !== undefined && { title: title.trim() }),
            ...(category !== undefined && { category: category.trim() }),
            ...(videoUrl !== undefined && { videoUrl: videoUrl.trim() }),
        });

        return res.status(200).json({
            success: true,
            message: "YouTube video updated successfully.",
            data: updatedVideo,
        });

    } catch (error) {
        next(error);
    }
}


export async function getAllYoutubeVideosController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const videos = await getAllYoutubeVideos();

        return res.status(200).json({
            success: true,
            message: "YouTube videos fetched successfully.",
            results: videos.length,
            data: videos,
        });
    } catch (error) {
        next(error);
    }
}


export async function deleteYoutubeVideoController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = req.params.id;
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError(
                "Unauthorized. Please login first.",
                401
            );
        }

        if (typeof id !== "string" || !id.trim()) {
            throw new AppError("Valid video ID is required.", 400);
        }

        const deletedVideo = await deleteYoutubeVideo(id, userId);

        return res.status(200).json({
            success: true,
            message: "YouTube video deleted successfully.",
            data: deletedVideo,
        });

    } catch (error) {
        next(error);
    }
}


