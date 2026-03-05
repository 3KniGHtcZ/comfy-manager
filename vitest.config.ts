import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [
      ["src/hooks/**", "jsdom"],
      ["src/components/**", "jsdom"],
    ],
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**"],
      exclude: ["src/test/**", "src/routes/**", "**/*.gen.ts"],
    },
  },
});
