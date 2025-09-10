import { z } from "zod";

export const HandleSchema = z.object({
  handle: z.string().regex(/^[a-z0-9_.-]{3,30}$/),
});
export type HandleInput = z.infer<typeof HandleSchema>;
