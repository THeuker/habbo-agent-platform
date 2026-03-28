// vite.config.js
import { defineConfig, loadEnv } from "file:///Users/tijmendejong/Documents/projects/personal/habbo-agent-platform/portal/node_modules/vite/dist/node/index.js";
import react from "file:///Users/tijmendejong/Documents/projects/personal/habbo-agent-platform/portal/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///Users/tijmendejong/Documents/projects/personal/habbo-agent-platform/portal/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import { createRequire } from "module";
import { writeFileSync } from "fs";
var __vite_injected_original_dirname = "/Users/tijmendejong/Documents/projects/personal/habbo-agent-platform/portal";
var __vite_injected_original_import_meta_url = "file:///Users/tijmendejong/Documents/projects/personal/habbo-agent-platform/portal/vite.config.js";
var require2 = createRequire(__vite_injected_original_import_meta_url);
var { version: appVersion } = require2("./package.json");
function versionJsonPlugin() {
  return {
    name: "version-json",
    closeBundle() {
      writeFileSync("./dist/version.json", JSON.stringify({ version: appVersion }));
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__vite_injected_original_dirname, "..");
  const portalRoot = __vite_injected_original_dirname;
  const env = { ...loadEnv(mode, repoRoot, ""), ...loadEnv(mode, portalRoot, "") };
  const portalPort = env.HABBO_PORTAL_PORT || process.env.HABBO_PORTAL_PORT || "3090";
  const uiBuildStamp = `ui-${Date.now()}`;
  return {
    define: {
      "import.meta.env.VITE_UI_BUILD_STAMP": JSON.stringify(uiBuildStamp),
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion)
    },
    plugins: [react(), tailwindcss(), versionJsonPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    build: {
      outDir: "./dist",
      emptyOutDir: true
    },
    // `npm run dev` — `/api` → Express on host port from `.env` (`HABBO_PORTAL_PORT`, same as Docker).
    server: {
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${portalPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdGlqbWVuZGVqb25nL0RvY3VtZW50cy9wcm9qZWN0cy9wZXJzb25hbC9oYWJiby1hZ2VudC1wbGF0Zm9ybS9wb3J0YWxcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90aWptZW5kZWpvbmcvRG9jdW1lbnRzL3Byb2plY3RzL3BlcnNvbmFsL2hhYmJvLWFnZW50LXBsYXRmb3JtL3BvcnRhbC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdGlqbWVuZGVqb25nL0RvY3VtZW50cy9wcm9qZWN0cy9wZXJzb25hbC9oYWJiby1hZ2VudC1wbGF0Zm9ybS9wb3J0YWwvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IGNyZWF0ZVJlcXVpcmUgfSBmcm9tICdtb2R1bGUnXG5pbXBvcnQgeyB3cml0ZUZpbGVTeW5jIH0gZnJvbSAnZnMnXG5cbmNvbnN0IHJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKGltcG9ydC5tZXRhLnVybClcbmNvbnN0IHsgdmVyc2lvbjogYXBwVmVyc2lvbiB9ID0gcmVxdWlyZSgnLi9wYWNrYWdlLmpzb24nKVxuXG4vLyBXcml0ZXMgZGlzdC92ZXJzaW9uLmpzb24gYWZ0ZXIgZXZlcnkgcHJvZHVjdGlvbiBidWlsZCBzbyB0aGUgdm9sdW1lLW1vdW50ZWRcbi8vIGRpc3QvIGFsd2F5cyByZWZsZWN0cyB0aGUgZGVwbG95ZWQgdmVyc2lvbiB3aXRob3V0IG5lZWRpbmcgcGFja2FnZS5qc29uIG1vdW50ZWQuXG5mdW5jdGlvbiB2ZXJzaW9uSnNvblBsdWdpbigpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndmVyc2lvbi1qc29uJyxcbiAgICBjbG9zZUJ1bmRsZSgpIHtcbiAgICAgIHdyaXRlRmlsZVN5bmMoJy4vZGlzdC92ZXJzaW9uLmpzb24nLCBKU09OLnN0cmluZ2lmeSh7IHZlcnNpb246IGFwcFZlcnNpb24gfSkpXG4gICAgfSxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IHJlcG9Sb290ID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJylcbiAgY29uc3QgcG9ydGFsUm9vdCA9IF9fZGlybmFtZVxuICBjb25zdCBlbnYgPSB7IC4uLmxvYWRFbnYobW9kZSwgcmVwb1Jvb3QsICcnKSwgLi4ubG9hZEVudihtb2RlLCBwb3J0YWxSb290LCAnJykgfVxuICBjb25zdCBwb3J0YWxQb3J0ID0gZW52LkhBQkJPX1BPUlRBTF9QT1JUIHx8IHByb2Nlc3MuZW52LkhBQkJPX1BPUlRBTF9QT1JUIHx8ICczMDkwJ1xuXG4gIC8vIFVuaXF1ZSBwZXIgYHZpdGUgYnVpbGRgIC8gZGV2IHNlcnZlciBzdGFydCBcdTIwMTQgcHJvdmVzIHRoZSBicm93c2VyIGxvYWRlZCB0aGlzIGJ1bmRsZVxuICBjb25zdCB1aUJ1aWxkU3RhbXAgPSBgdWktJHtEYXRlLm5vdygpfWBcblxuICByZXR1cm4ge1xuICAgIGRlZmluZToge1xuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX1VJX0JVSUxEX1NUQU1QJzogSlNPTi5zdHJpbmdpZnkodWlCdWlsZFN0YW1wKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUFBfVkVSU0lPTic6IEpTT04uc3RyaW5naWZ5KGFwcFZlcnNpb24pLFxuICAgIH0sXG4gICAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCksIHZlcnNpb25Kc29uUGx1Z2luKCldLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICB9LFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogJy4vZGlzdCcsXG4gICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICB9LFxuICAgIC8vIGBucG0gcnVuIGRldmAgXHUyMDE0IGAvYXBpYCBcdTIxOTIgRXhwcmVzcyBvbiBob3N0IHBvcnQgZnJvbSBgLmVudmAgKGBIQUJCT19QT1JUQUxfUE9SVGAsIHNhbWUgYXMgRG9ja2VyKS5cbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogYGh0dHA6Ly8xMjcuMC4wLjE6JHtwb3J0YWxQb3J0fWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtWixTQUFTLGNBQWMsZUFBZTtBQUN6YixPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMscUJBQXFCO0FBTDlCLElBQU0sbUNBQW1DO0FBQXFOLElBQU0sMkNBQTJDO0FBTy9TLElBQU1BLFdBQVUsY0FBYyx3Q0FBZTtBQUM3QyxJQUFNLEVBQUUsU0FBUyxXQUFXLElBQUlBLFNBQVEsZ0JBQWdCO0FBSXhELFNBQVMsb0JBQW9CO0FBQzNCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFDWixvQkFBYyx1QkFBdUIsS0FBSyxVQUFVLEVBQUUsU0FBUyxXQUFXLENBQUMsQ0FBQztBQUFBLElBQzlFO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxXQUFXLEtBQUssUUFBUSxrQ0FBVyxJQUFJO0FBQzdDLFFBQU0sYUFBYTtBQUNuQixRQUFNLE1BQU0sRUFBRSxHQUFHLFFBQVEsTUFBTSxVQUFVLEVBQUUsR0FBRyxHQUFHLFFBQVEsTUFBTSxZQUFZLEVBQUUsRUFBRTtBQUMvRSxRQUFNLGFBQWEsSUFBSSxxQkFBcUIsUUFBUSxJQUFJLHFCQUFxQjtBQUc3RSxRQUFNLGVBQWUsTUFBTSxLQUFLLElBQUksQ0FBQztBQUVyQyxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTix1Q0FBdUMsS0FBSyxVQUFVLFlBQVk7QUFBQSxNQUNsRSxvQ0FBb0MsS0FBSyxVQUFVLFVBQVU7QUFBQSxJQUMvRDtBQUFBLElBQ0EsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLEdBQUcsa0JBQWtCLENBQUM7QUFBQSxJQUNyRCxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsSUFDZjtBQUFBO0FBQUEsSUFFQSxRQUFRO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRLG9CQUFvQixVQUFVO0FBQUEsVUFDdEMsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicmVxdWlyZSJdCn0K
