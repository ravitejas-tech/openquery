import { defineConfig } from 'queryfish'

export default defineConfig({
    input: './openapi.yaml',
    output: './src/api',
    // The client is yours — see src/client.ts. QueryFish ships no runtime.
    client: './src/client.ts',
})
