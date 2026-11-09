import { randomBytes } from "node:crypto"
import { AppError } from "../../lib/error"
import { service } from "../../db/schema/service"
import { db } from "../../db"
import { eq } from "drizzle-orm"
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../cloudinary/cloudinary.service"


interface CreateServiceInput {
    userId: string,
    slug?: string,
    serviceName: string,
    summary: string,
    photoUrl?: string | null,
    photoPublicId?: string | null,
    service: string[]
}

export async function CreateServiceInput(data: CreateServiceInput) {
    const slug = generateSlug(data.serviceName);

    const [existingService] = await db.select({ id: service.id })
        .from(service)
        .where(eq(service.slug, slug))
        .limit(1)

    if (existingService) {
        const error = new AppError("A service with this slug alreday exitsts.", 409);
        Object.assign(error, { statusCode: 409 });
        throw error;
    }

    const [services] = await db
        .insert(service)
        .values({
            userId: data.userId,
            slug,
            serviceName: data.serviceName.trim(),
            photoUrl: data.photoUrl,
            photoPubliceId: data.photoPublicId,
            service: data.service,
            summary: data.summary.trim(),
        }).returning();

    return services;

}


export async function updateService(serviceId: string, data: Partial<CreateServiceInput>) {

    const [existingDoctor] = await db
        .select()
        .from(service)
        .where(eq(service.id, serviceId))
        .limit(1);

    if (!existingDoctor) {
        throw new AppError("Service not found.", 404);
    }

    const updateData: Partial<typeof service.$inferInsert> = {};

    if (data.serviceName !== undefined) {
        const name = data.serviceName.trim();

        updateData.serviceName = name;
        updateData.slug = generateSlug(name);

        const [duplicateDoctor] = await db
            .select({ id: service.id })
            .from(service)
            .where(eq(service.slug, updateData.slug))
            .limit(1);

        if (duplicateDoctor && duplicateDoctor.id !== serviceId) {
            throw new AppError("A doctor with this slug already exists.", 409);
        }
    }

    if (data.serviceName !== undefined) {
        updateData.serviceName = data.serviceName.trim();
    }

    if (data.summary !== undefined) {
        updateData.summary = data.summary.trim();
    }

    if (data.service !== undefined) {
        updateData.service = data.service;
    }



    const [updatedService] = await db
        .update(service)
        .set(updateData)
        .where(eq(service.id, serviceId))
        .returning();

    return updatedService;
}

export async function deleteService(serviceId: string) {
    const [existingService] = await db
        .select({ id: service.id })
        .from(service)
        .where(eq(service.id, serviceId))
        .limit(1);

    if (!existingService) {
        throw new AppError("Service not found.", 404);
    }

    const [deletedService] = await db
        .delete(service)
        .where(eq(service.id, serviceId))
        .returning();



    return deletedService;
}

export async function deleteServicePhoto(doctorId: string) {
    const [existingService] = await db
        .select()
        .from(service)
        .where(eq(service.id, doctorId))
        .limit(1);

    if (!existingService) {
        throw new AppError("Doctor not found.", 404);
    }

    if (!existingService.photoPubliceId) {
        throw new AppError("Doctor photo not found.", 404);
    }

    const [updatedDoctor] = await db
        .update(service)
        .set({ photoUrl: null, photoPubliceId: null })
        .where(eq(service.id, doctorId))
        .returning();

    await deleteImageFromCloudinary(existingService.photoPubliceId);
    return updatedDoctor;
}

export async function getService() {
    const allService = await db
        .select()
        .from(service);

    return allService;
}



function generateSlug(name: string): string {
    const nameSlug = name
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);

    const randomSuffix = randomBytes(4).toString("hex");

    return `${nameSlug || "doctor"}-${randomSuffix}`;
}



export async function uploadServicePhoto(doctorId: string, file: Express.Multer.File) {
    const [existingService] = await db
        .select()
        .from(service)
        .where(eq(service.id, doctorId))
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
            .update(service)
            .set({
                photoUrl: uploadedImage.secure_url,
                photoPubliceId: uploadedImage.public_id,
            })
            .where(eq(service.id, doctorId))
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
    if (
        existingService.photoPubliceId &&
        existingService.photoPubliceId !== uploadedImage.public_id
    ) {
        try {
            await deleteImageFromCloudinary(
                existingService.photoPubliceId
            );
        } catch (error) {
            console.error("Old doctor photo deletion failed:", error);
        }
    }

    return updatedDoctor;
}
