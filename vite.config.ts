import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import solidSvg from "vite-plugin-solid-svg";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    solid(),
    solidSvg({
      defaultAsComponent: true,
    }),
    // Build Chrome Extension
    crx({ manifest }),
  ],
});
