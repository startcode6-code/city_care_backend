import { db } from "../../db";
import { youtubeVideo } from "../../db/schema/youtube-video"
import { eq } from "drizzle-orm";
import { AppError } from "../../lib/error";
import { and, ne, desc } from "drizzle-orm";

interface CreateVideoInput {
    title: string;
    category: string;
    videoUrl: string;
}

export async function createYoutubeVideo(userId: string, data: CreateVideoInput) {
    const slug = generateSlug(data.title);

    const [existingVideo] = await db.select({ id: youtubeVideo.id }).from(youtubeVideo)
        .where(eq(youtubeVideo.slug, slug))
        .limit(1);

    if (existingVideo) {
        throw new AppError("A video with this title already exists.", 409);
    }

    const [newVideo] = await db.insert(youtubeVideo)
        .values({
            userId,
            slug,
            title: data.title,
            category: data.category,
            videoUrl: data.videoUrl,
        })
        .returning();
    return newVideo;
}


export async function updateYoutubeVideo(
    videoId: string,
    userId: string,
    data: Partial<CreateVideoInput>
) {
    const [existingVideo] = await db
        .select()
        .from(youtubeVideo)
        .where(
            and(
                eq(youtubeVideo.id, videoId),
                eq(youtubeVideo.userId, userId)
            )
        )
        .limit(1);

    if (!existingVideo) {
        throw new AppError("Video not found.", 404);
    }

    const updateData: Partial<typeof youtubeVideo.$inferInsert> = {};

    if (data.title !== undefined) {
        const title = data.title.trim();

        updateData.title = title;
        updateData.slug = generateSlug(title);

        const [duplicateVideo] = await db
            .select({ id: youtubeVideo.id })
            .from(youtubeVideo)
            .where(
                and(
                    eq(youtubeVideo.slug, updateData.slug),
                    ne(youtubeVideo.id, videoId)
                )
            )
            .limit(1);

        if (duplicateVideo) {
            throw new AppError(
                "A video with this slug already exists.",
                409
            );
        }
    }

    if (data.category !== undefined) {
        updateData.category = data.category.trim();
    }

    if (data.videoUrl !== undefined) {
        updateData.videoUrl = data.videoUrl.trim();
    }

    if (Object.keys(updateData).length === 0) {
        throw new AppError(
            "Please provide at least one field to update.",
            400
        );
    }

    const [updatedVideo] = await db
        .update(youtubeVideo)
        .set(updateData)
        .where(
            and(
                eq(youtubeVideo.id, videoId),
                eq(youtubeVideo.userId, userId)
            )
        )
        .returning();

    return updatedVideo;
}


export async function getAllYoutubeVideos() {
    const videos = await db
        .select()
        .from(youtubeVideo)
        .orderBy(desc(youtubeVideo.createdAt));

    return videos;
}

export async function deleteYoutubeVideo(
    videoId: string,
    userId: string
) {
    const [existingVideo] = await db
        .select()
        .from(youtubeVideo)
        .where(
            and(
                eq(youtubeVideo.id, videoId),
                eq(youtubeVideo.userId, userId)
            )
        )
        .limit(1);

    if (!existingVideo) {
        throw new AppError("Video not found.", 404);
    }

    const [deletedVideo] = await db
        .delete(youtubeVideo)
        .where(
            and(
                eq(youtubeVideo.id, videoId),
                eq(youtubeVideo.userId, userId)
            )
        )
        .returning();

    return deletedVideo;
}


function generateSlug(title: string) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}