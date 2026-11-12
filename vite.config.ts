import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const cmsUrl = env.VITE_CMS_URL || "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        "/api": cmsUrl,
        "/media": cmsUrl,
      },
    },
  };
});
