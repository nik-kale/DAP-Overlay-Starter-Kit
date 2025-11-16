import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  dts: true,
  sourcemap: true,
  clean: true,
  globalName: 'DAPOverlay',
  splitting: true, // Enable code splitting (not for IIFE, but for ESM/CJS)
  treeshake: true,
  external: ['ajv'], // Don't bundle AJV (not used)
  noExternal: ['@dap-overlay/sdk-core', '@popperjs/core', 'dompurify'], // Bundle these
  minify: false, // Users can minify in their build
});
