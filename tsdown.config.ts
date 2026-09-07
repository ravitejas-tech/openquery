import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20.19',
  platform: 'node',
  // Keep the CLI runnable directly after install.
  outputOptions: {
    banner: (chunk) => (chunk.name === 'cli/index' ? '#!/usr/bin/env node' : ''),
  },
});
