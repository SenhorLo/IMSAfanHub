import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/* O GitHub Pages serve este repositório a partir da RAIZ do branch main,
   e essa configuração não é alterável por aqui. Por isso a fonte fica em
   app/ e o build é escrito na raiz, sem esvaziá-la: midia/ e o restante
   precisam sobreviver ao build. */
export default defineConfig({
  root: "app",
  base: "/IMSAfanHub/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "..",
    emptyOutDir: false,
    assetsDir: "assets",
  },
});
