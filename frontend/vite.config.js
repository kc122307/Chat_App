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
    // Add the resolve section to alias Node.js core modules
    resolve: {
        alias: {
            'events': 'events',
            'util': 'util',
        },
    },
    // Update the define section for better compatibility
    define: {
        global: 'globalThis',
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    // Add optimizeDeps to handle simple-peer dependencies correctly
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis',
            },
        },
    },
});