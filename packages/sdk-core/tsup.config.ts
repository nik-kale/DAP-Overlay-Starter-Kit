import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true, // Enable code splitting for better tree-shaking
  treeshake: true,
  external: ['ajv'], // Mark AJV as external (not used in core anymore)
  minify: false, // Users can minify in their build
});
