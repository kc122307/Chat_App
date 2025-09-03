import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:5000",
            },
        },
    },
    define: {
        global: 'window',
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
});