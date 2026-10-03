import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: { outDir: "dist" },
  publicDir: path.resolve(__dirname, "../public"),
  // The avatar preview reuses the game's own rig code (plain JS, no Phaser).
  resolve: {
    alias: { "@avatar": path.resolve(__dirname, "../src/game/avatar") },
  },
  server: {
    fs: { allow: [path.resolve(__dirname, "..")] },
  },
});
