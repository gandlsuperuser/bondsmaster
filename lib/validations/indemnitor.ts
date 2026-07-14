import * as z from "zod";

export const indemnitorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email format").nullable().optional().or(z.literal("")),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "Zip code is required"),
  employer: z.string().optional().nullable(),
});

export type IndemnitorInput = z.infer<typeof indemnitorSchema>;
