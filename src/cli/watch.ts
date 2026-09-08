/** `--watch`: regenerate when the spec or config changes. */

import path from 'node:path'
import chokidar from 'chokidar'

import { findConfig, loadConfig } from '../config/load.js'

export interface WatchOptions {
    cwd: string
    configPath?: string | undefined
    run: () => Promise<unknown>
    onError: (error: unknown) => void
}

export async function startWatch(options: WatchOptions): Promise<void> {
    const { cwd, configPath, run, onError } = options

    const { config, root, configFile } = await loadConfig({ cwd, configPath })

    // Remote specs cannot be watched; polling a URL would be surprising.
    if (/^https?:\/\//i.test(config.input)) {
        console.log('watch: input is a URL — nothing to watch. Re-run to refresh.')
        return
    }

    const specPath = path.resolve(root, config.input)
    const watched = [specPath, configFile ?? findConfig(cwd)].filter((p): p is string => typeof p === 'string')

    const watcher = chokidar.watch(watched, { ignoreInitial: true })

    let running = false
    let queued = false

    const trigger = async (): Promise<void> => {
        // Editors often emit several events per save; collapse them.
        if (running) {
            queued = true
            return
        }
        running = true
        try {
            await run()
        } catch (error) {
            onError(error)
        } finally {
            running = false
            if (queued) {
                queued = false
                void trigger()
            }
        }
    }

    watcher.on('change', trigger)
    watcher.on('add', trigger)

    console.log(`watch: watching ${path.relative(cwd, specPath) || specPath}`)

    // Hold the process open until interrupted.
    await new Promise<void>((resolve) => {
        const stop = (): void => {
            void watcher.close().then(() => resolve())
        }
        process.once('SIGINT', stop)
        process.once('SIGTERM', stop)
    })
}
