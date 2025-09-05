import { vi } from "vitest";

vi.mock("bcryptjs", () => ({
  compare: async (plainTextPassword: string, hash: string) =>
    hash === "hashed_password",
}));

export const mockSingle = vi.fn();
export const mockMaybeSingle = vi.fn();

export function makeLoginSupabaseMock() {
  const queryBuilder = {
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };

  return {
    from: (tableName: string) => ({
      select: (query: string) => queryBuilder,
    }),
  };
}
