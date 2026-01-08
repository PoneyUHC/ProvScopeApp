import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.{test,spec}.ts"],
  },
  resolve: {
    alias: {
      // adjust the path to wherever "@common" points in YOUR repo
      "@common": resolve(__dirname, "src/common"),
      // or: resolve(__dirname, "src/renderer/src/common"), etc.
    },
  },
});
