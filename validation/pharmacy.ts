import { z } from "zod";

export const pharmacySchema = z.object({
  pharmId: z.number().optional(), // Optional since it might not exist on creation
  name: z.string().nonempty("Name is required"), // Required name field
  address: z.string().nonempty("Address is required"), // Required address field
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

export type PharmacySchema = z.infer<typeof pharmacySchema>;
