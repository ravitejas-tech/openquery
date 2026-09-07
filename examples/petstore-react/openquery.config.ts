import { defineConfig } from 'openquery';

export default defineConfig({
  input: './openapi.yaml',
  output: './src/api',
  // The client is yours — see src/client.ts. OpenQuery ships no runtime.
  client: './src/client.ts',
});
