import { z } from "zod";

export const createPlanInput = z.object({
  name: z.string().min(1).max(120),
  priceMinor: z.coerce.number().int().min(0),
  currency: z.string().length(3).default("USD"),
  durationDays: z.coerce.number().int().min(1),
  features: z.array(z.string()).default([]),
});

export type CreatePlanInput = z.infer<typeof createPlanInput>;
