import { z } from "zod";

export const userSchema = z.object({
  userId: z.number().optional(),
  username: z
    .string()
    .nonempty("Username is required")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.string().nonempty("Email is required").email("Invalid email format"),
  password: z
    .string()
    .nonempty("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  firstName: z.string().nonempty("First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().nonempty("Last name is required"),
  phoneNumber: z
    .string()
    .regex(
      /^\+?\d{10,15}$/,
      "Phone number must be valid and can include country code"
    )
    .optional(),
  createdAt: z
    .string()
    .optional()
    .refine(
      (date) => date === undefined || !isNaN(new Date(date).getTime()),
      "Invalid creation date"
    ), // Optional but must be valid
  updatedAt: z
    .string()
    .optional()
    .refine(
      (date) => date === undefined || !isNaN(new Date(date).getTime()),
      "Invalid update date"
    ), // Optional but must be valid
});

export type UserSchema = z.infer<typeof userSchema>;