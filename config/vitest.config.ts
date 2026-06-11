import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    root: resolve(__dirname, '..'),
    environment: "node",
    include: ["tests/**/*.{test,spec}.ts"],
  },
  resolve: {
    alias: {
      "@common": resolve(__dirname, "../src/common"),
    },
  },
});
