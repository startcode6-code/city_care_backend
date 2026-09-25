import { z } from "zod";

export const signUpSchema = z.object({

    name: z.string().min(1, { message: "Name is required." }),

    email: z.string().email({ message: "Invalid email address." }).optional(),

    password: z.string().min(6, { message: "Password must be at least 6 characters long." }),

    phoneNumber: z.string()
    .length(10, { message: "Phone number must be exactly 10 digits." })
    .regex(/^[0-9]{10}$/, "Phone number must contain only digits"),
});