import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  dts: true,
  sourcemap: true,
  clean: true,
  globalName: 'DAPOverlay',
  splitting: false,
  treeshake: true,
  external: [],
  noExternal: ['@dap-overlay/sdk-core', '@popperjs/core'],
});
