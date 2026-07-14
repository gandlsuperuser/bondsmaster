import * as z from "zod";

export const bondSchema = z.object({
  defendantId: z.string().uuid("Please select a valid defendant"),
  amount: z.number().min(1, "Bond amount must be greater than 0"),
  status: z.enum(["Draft", "Active", "FTA", "Discharged"]),
  powerNumber: z.string().min(1, "Power number is required"),
  arrestDate: z.string().nullable().optional().transform((val) => val ? new Date(val) : null),
  releasedDate: z.string().nullable().optional().transform((val) => val ? new Date(val) : null),
  charges: z.array(
    z.object({
      description: z.string().min(1, "Charge description is required"),
      degree: z.string().optional().nullable(),
    })
  ).optional().default([]),
  collaterals: z.array(
    z.object({
      type: z.string().min(1, "Collateral type is required"),
      value: z.number().min(0, "Collateral value must be at least 0"),
      description: z.string().optional().nullable(),
    })
  ).optional().default([]),
});

export type BondInput = z.infer<typeof bondSchema>;
