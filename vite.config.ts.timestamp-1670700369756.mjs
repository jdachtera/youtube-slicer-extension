// vite.config.ts
import { defineConfig } from "file:///Users/jascha/dev/youtube-slicer-extension/node_modules/vite/dist/node/index.js";
import react from "file:///Users/jascha/dev/youtube-slicer-extension/node_modules/@vitejs/plugin-react/dist/index.mjs";
import svgr from "file:///Users/jascha/dev/youtube-slicer-extension/node_modules/vite-plugin-svgr/dist/index.mjs";
import { crx } from "file:///Users/jascha/dev/youtube-slicer-extension/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "React Content Script",
  version: "1.0.0",
  action: {
    default_title: "Popup",
    default_popup: "index.html",
    default_icon: "logo192.png"
  },
  icons: {},
  content_scripts: [
    {
      matches: ["https://blank.org/*"],
      js: ["content-script/src/main.tsx"],
      media: []
    }
  ]
};

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true
      }
    }),
    crx({ manifest: manifest_default })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvamFzY2hhL2Rldi95b3V0dWJlLXNsaWNlci1leHRlbnNpb25cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qYXNjaGEvZGV2L3lvdXR1YmUtc2xpY2VyLWV4dGVuc2lvbi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvamFzY2hhL2Rldi95b3V0dWJlLXNsaWNlci1leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHN2Z3IgZnJvbSAndml0ZS1wbHVnaW4tc3ZncidcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbidcbmltcG9ydCBtYW5pZmVzdCBmcm9tICcuL21hbmlmZXN0Lmpzb24nXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBzdmdyKHtcbiAgICAgIHN2Z3JPcHRpb25zOiB7XG4gICAgICAgIGljb246IHRydWUsXG4gICAgICAgIC8vIC4uLnN2Z3Igb3B0aW9ucyAoaHR0cHM6Ly9yZWFjdC1zdmdyLmNvbS9kb2NzL29wdGlvbnMvKVxuICAgICAgfSxcbiAgICB9KSxcbiAgICAvLyBCdWlsZCBDaHJvbWUgRXh0ZW5zaW9uXG4gICAgY3J4KHsgbWFuaWZlc3QgfSksXG4gIF1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdULFNBQVMsb0JBQW9CO0FBQzdVLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxXQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlwQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxhQUFhO0FBQUEsUUFDWCxNQUFNO0FBQUEsTUFFUjtBQUFBLElBQ0YsQ0FBQztBQUFBLElBRUQsSUFBSSxFQUFFLDJCQUFTLENBQUM7QUFBQSxFQUNsQjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
