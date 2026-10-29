import { eq } from "drizzle-orm";
import { db } from "../../db";
import { doctors } from "../../db/schema/doctor";
import { AppError } from "../../lib/error";
import { randomBytes } from "node:crypto";
import { desc } from "drizzle-orm";


interface CreateDoctorInput {
    userId: string;
    slug: string;
    name: string;
    department: string;
    role: string;
    years: number;
    days: string;
    languages: (
        | "ENGLISH"
        | "HINDI"
        | "MANDARIN"
        | "SPANISH"
        | "FRENCH"
        | "GERMAN"
        | "ARABIC"
        | "BENGALI"
        | "URDU"
        | "TAMIL"
        | "TELUGU"
        | "MARATHI"
        | "PUNJABI"
        | "GUJARATI"
        | "JAPANESE"
    )[];
    bio: string;
}

export async function createDoctorService(data: CreateDoctorInput) {
    const slug = generateSlug(data.name);

    const [existingDoctor] = await db.select({ id: doctors.id })
        .from(doctors)
        .where(eq(doctors.slug, slug))
        .limit(1);

    if (existingDoctor) {
        const error = new AppError("A doctor with this slug already exists.", 409);
        Object.assign(error, { statusCode: 409 });
        throw error;
    }

    const [doctor] = await db
        .insert(doctors)
        .values({
            userId: data.userId,
            slug,
            name: data.name.trim(),
            department: data.department.trim(),
            role: data.role.trim(),
            years: data.years,
            days: data.days.trim(),
            languages: data.languages,
            bio: data.bio.trim(),
        })
        .returning();

    return doctor;
}

export async function updateDoctorService(doctorId: string, data: Partial<CreateDoctorInput>) {

    const [existingDoctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.id, doctorId))
        .limit(1);

    if (!existingDoctor) {
        throw new AppError("Doctor not found.", 404);
    }

    const updateData: Partial<typeof doctors.$inferInsert> = {};

    if (data.name !== undefined) {
        const name = data.name.trim();

        updateData.name = name;
        updateData.slug = generateSlug(name);

        const [duplicateDoctor] = await db
            .select({ id: doctors.id })
            .from(doctors)
            .where(eq(doctors.slug, updateData.slug))
            .limit(1);

        if (duplicateDoctor && duplicateDoctor.id !== doctorId) {
            throw new AppError("A doctor with this slug already exists.", 409);
        }
    }

    if (data.department !== undefined) {
        updateData.department = data.department.trim();
    }

    if (data.role !== undefined) {
        updateData.role = data.role.trim();
    }

    if (data.years !== undefined) {
        updateData.years = data.years;
    }

    if (data.days !== undefined) {
        updateData.days = data.days.trim();
    }

    if (data.languages !== undefined) {
        updateData.languages = data.languages;
    }

    if (data.bio !== undefined) {
        updateData.bio = data.bio.trim();
    }

    const [updatedDoctor] = await db
        .update(doctors)
        .set(updateData)
        .where(eq(doctors.id, doctorId))
        .returning();

    return updatedDoctor;
}


export async function getDoctorsService() {
    const allDoctors = await db
        .select()
        .from(doctors);

    return allDoctors;
}

export async function deleteDoctorService(doctorId: string) {
    const [existingDoctor] = await db
        .select({ id: doctors.id })
        .from(doctors)
        .where(eq(doctors.id, doctorId))
        .limit(1);

    if (!existingDoctor) {
        throw new AppError("Doctor not found.", 404);
    }

    const [deletedDoctor] = await db
        .delete(doctors)
        .where(eq(doctors.id, doctorId))
        .returning();

    return deletedDoctor;
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