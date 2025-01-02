import { z } from "zod";
import { medicineSchema } from "./medicine";

export const medSchedSchema = z.object({
  schedId: z.number().optional(), // Optional since it might not exist on creation
  medId: z.number().nonnegative("Medicine ID must be a non-negative number"),
  medicine: medicineSchema.optional(),
  day: z
    .string()
    .optional()
    .refine(
      (date) => date === undefined || !isNaN(new Date(date).getTime()),
      "Invalid day format"
    ), // Validates as a date string
  time: z.string().optional(),
  timeTaken: z
    .string()
    .optional()
    .refine(
      (datetime) =>
        datetime === undefined || !isNaN(new Date(datetime).getTime()),
      "Invalid timeTaken format"
    ), // Validates as an ISO datetime string
  taken: z.boolean().optional(), // Optional boolean for medication taken status
  qtyTaken: z.string().optional(), // Optional quantity as a string
  action: z.string().optional(), // Optional action as a string
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

export type MedSchedSchema = z.infer<typeof medSchedSchema>;
