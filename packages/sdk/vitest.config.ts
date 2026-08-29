import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/examples/**", "src/types/**", "src/**/*.d.ts"],
      thresholds: {
        statements: 85,
        lines: 85,
        functions: 83,
        branches: 80,
      },
    },
  },
});
