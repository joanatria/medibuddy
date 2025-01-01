import { z } from "zod";
import { pharmacySchema } from "./pharmacy";

export const pharmMedSchema = z.object({
  pmedId: z.number().optional(), // Optional since it might not exist on creation
  name: z.string().nonempty("Name is required"), // Required name field
  details: z.string().optional(), // Optional details field
  qty: z
    .number()
    .int("Quantity must be an integer")
    .nonnegative("Quantity cannot be negative")
    .optional(), // Optional quantity field
  avail: z.boolean().optional(), // Optional availability field
  pharmId: z.number().nonnegative("Pharmacy ID must be a non-negative number"),
  pharmacy: pharmacySchema.optional(), // Optional nested pharmacy schema
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

export type PharmMedSchema = z.infer<typeof pharmMedSchema>;
