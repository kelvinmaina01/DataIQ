/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['backend/**/*.test.ts'],
        exclude: ['src/**'],
        setupFiles: ['./backend/test-setup.ts'],
    },
    esbuild: {
        target: 'es2020',
        include: /\.(ts|tsx)$/,
        loader: 'ts',
        tsconfigRaw: {
            compilerOptions: {
                experimentalDecorators: true
            }
        }
    }
});
