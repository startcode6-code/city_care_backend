import { eq } from "drizzle-orm";
import { db } from "../../db";
import { doctors } from "../../db/schema/doctor";
import { AppError } from "../../lib/error";
import { randomBytes } from "node:crypto";


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