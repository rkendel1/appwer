import { defineConfig } from "appport";

export default defineConfig({
  entry: "./src/application.mjs",
  outDir: "./appport/generated",
  manifestPath: "./appport/manifest.json"
});
