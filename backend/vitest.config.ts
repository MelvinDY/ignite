import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    sequence: { concurrent: false },
    testTimeout:10_000,
    hookTimeout: 100_000,
    teardownTimeout: 15_000,
  },
});
