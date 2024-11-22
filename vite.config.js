import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import inject from '@rollup/plugin-inject';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        inject({
            // Polyfill for `process` and `Buffer`
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    resolve: {
        alias: {
            // Alias for any node module to avoid import errors in the browser
            util: 'rollup-plugin-node-polyfills/polyfills/util',
            // Additional polyfill aliases if needed
            stream: 'rollup-plugin-node-polyfills/polyfills/stream',
            path: 'rollup-plugin-node-polyfills/polyfills/path',
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            // Polyfills for node modules used in browser
            define: {
                global: 'globalThis', // This will map global to globalThis for compatibility
            },
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    process: true,  // Polyfill process
                    buffer: true,   // Polyfill buffer
                }),
                NodeModulesPolyfillPlugin(), // Polyfills for other modules
            ],
        },
    },
});
