import { z } from "zod";

export const signUpSchema = z.object({

    // name: z.string().min(1, { message: "Name is required." }).optional,

    email: z.string().email({ message: "Invalid email address." }).optional(),
    
    phoneNumber: z.string()
    .length(10, { message: "Phone number must be exactly 10 digits." })
    .regex(/^[0-9]{10}$/, "Phone number must contain only digits"),
});