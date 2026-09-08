/** Locate and load `queryfish.config.{ts,mts,js,mjs,json}`. */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'

import { CONFIG_DEFAULTS, type QueryFishConfig, type ResolvedConfig } from './define.js'
import { QueryFishError } from '../loader/errors.js'

const CONFIG_NAMES = [
    'queryfish.config.ts',
    'queryfish.config.mts',
    'queryfish.config.js',
    'queryfish.config.mjs',
    'queryfish.config.json',
]

export function findConfig(cwd: string): string | undefined {
    for (const name of CONFIG_NAMES) {
        const candidate = path.join(cwd, name)
        if (existsSync(candidate)) return candidate
    }
    return undefined
}

async function importConfigFile(file: string): Promise<unknown> {
    if (file.endsWith('.json')) {
        return JSON.parse(await readFile(file, 'utf8'))
    }
    // jiti handles TypeScript configs without requiring a build step.
    const jiti = createJiti(pathToFileURL(file).href, { interopDefault: true })
    return await jiti.import(file, { default: true })
}

/**
 * Load config from disk and merge CLI overrides over it.
 * CLI flags always win, so `--output` can override a committed config.
 */
export async function loadConfig(options: {
    cwd: string
    configPath?: string | undefined
    overrides?: Partial<QueryFishConfig>
}): Promise<{ config: ResolvedConfig; configFile?: string; root: string }> {
    const { cwd, overrides = {} } = options

    const configFile = options.configPath ? path.resolve(cwd, options.configPath) : findConfig(cwd)

    if (options.configPath && !existsSync(configFile!)) {
        throw new QueryFishError(`Config file not found: ${options.configPath}`)
    }

    let fileConfig: Partial<QueryFishConfig> = {}
    if (configFile) {
        const loaded = await importConfigFile(configFile)
        if (!loaded || typeof loaded !== 'object') {
            throw new QueryFishError(`Config file did not export an object: ${path.relative(cwd, configFile)}`, {
                hint: 'Export your config as the default export, e.g. `export default defineConfig({ … })`.',
            })
        }
        fileConfig = loaded as Partial<QueryFishConfig>
    }

    // Paths in a config file are relative to that file, not the cwd.
    const root = configFile ? path.dirname(configFile) : cwd

    const merged = { ...CONFIG_DEFAULTS, ...fileConfig, ...stripUndefined(overrides) }

    if (!merged.input) {
        throw new QueryFishError('No `input` specified.', {
            hint: configFile
                ? 'Add `input: "./openapi.yaml"` to your config.'
                : 'Create a queryfish.config.ts, or pass --input <spec>.',
        })
    }
    if (!merged.output) {
        throw new QueryFishError('No `output` specified.', {
            hint: configFile
                ? 'Add `output: "./src/api"` to your config.'
                : 'Create a queryfish.config.ts, or pass --output <dir>.',
        })
    }

    return {
        config: merged as ResolvedConfig,
        ...(configFile ? { configFile } : {}),
        root,
    }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}
