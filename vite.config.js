import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/* Alvo de deploy: Vercel. A fonte fica em app/ e o build sai em dist/,
   servido a partir da raiz do domínio — por isso base é "/".
   O que estiver em app/public/ é copiado para dist/ como está. */
export default defineConfig({
  root: "app",
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
