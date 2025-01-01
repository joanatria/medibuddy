import { z } from "zod";
import { userSchema } from "./user";

export const medicineSchema = z.object({
  medId: z.number().optional(), // Optional since it might not exist on creation
  userId: z.number().nonnegative("User ID must be a non-negative number"),
  user: userSchema.optional(),
  name: z.string().nonempty("Name is required"),
  description: z.string().optional(), // Optional since it’s not marked nullable in the model
  instructions: z.string().optional(),
  dose: z.string().optional(),
  requiredQty: z.string().optional(),
  initialQty: z.string().optional(),
  currentQty: z.string().optional(),
  unit: z.string().optional(),
  notificationType: z.string().optional(),
  notifDetails: z.string().optional(),
  createdAt: z
    .string()
    .optional()
    .refine(
      (date) => date === undefined || !isNaN(new Date(date).getTime()),
      "Invalid creation date"
    ),
  updatedAt: z
    .string()
    .optional()
    .refine(
      (date) => date === undefined || !isNaN(new Date(date).getTime()),
      "Invalid update date"
    ),
  attachments: z.string().optional(),
  fileType: z.string().optional(),
  files: z.array(z.instanceof(Uint8Array)).optional(), // Validate files as byte arrays
});

export type MedicineSchema = z.infer<typeof medicineSchema>;