import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        // Generating + formatting several fixture specs is not instant.
        testTimeout: 30_000,
    },
})
