import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true, // Enable code splitting for better tree-shaking
  treeshake: true,
  external: ['react', 'react-dom', 'ajv'], // Don't bundle these
  minify: false, // Users can minify in their build
});
