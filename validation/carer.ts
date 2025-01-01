import { z } from "zod";
import { userSchema } from "./user";

export const carerSchema = z.object({
  carerId: z.number().optional(), // Optional since it might not exist on creation
  userId: z.number().nonnegative("User ID must be a non-negative number"),
  user: userSchema.optional(), // Optional nested user schema
  email: z.string().email("Invalid email format").nonempty("Email is required"),
  firstName: z.string().nonempty("First name is required"),
  middleName: z.string().optional(), // Middle name is optional
  lastName: z.string().nonempty("Last name is required"),
  relationship: z.string().optional(), // Optional string
  notify: z.boolean().optional(), // Optional boolean
  createdAt: z
    .string()
    .optional()
    .refine(
      (date) => date === undefined || !isNaN(new Date(date).getTime()),
      "Invalid creation date"
    ), // Validates as an ISO datetime string
  updatedAt: z
    .string()
    .optional()
    .refine(
      (date) => date === undefined || !isNaN(new Date(date).getTime()),
      "Invalid update date"
    ), // Validates as an ISO datetime string
});

export type CarerSchema = z.infer<typeof carerSchema>;
