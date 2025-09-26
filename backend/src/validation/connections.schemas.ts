import { z } from "zod";

export const RelationshipStatusQuery = z.object({
  profileId: z.uuid(),
});

export type RelationshipStatusInput = z.infer<typeof RelationshipStatusQuery>;