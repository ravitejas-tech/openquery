/** Pipeline orchestration: spec → IR → emitted files → disk. */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';

import type { QueryFishConfig } from './config/define.js';
import { CONFIG_DEFAULTS } from './config/define.js';
import { loadSpec } from './loader/load.js';
import { buildIR } from './ir/build.js';
import { emitTypes } from './emit/types.js';
import { emitRequests } from './emit/requests.js';
import { emitQueries, plainQueries } from './emit/queries.js';
import { emitMutations, mutationOperations } from './emit/mutations.js';
import { emitInfiniteQueries, infiniteOperations } from './emit/infinite.js';
import { emitIndex } from './emit/index-file.js';

export interface GeneratedFile {
  /** Path relative to the output directory. */
  name: string;
  contents: string;
  /** How this file compares to what is already on disk. */
  status: 'created' | 'updated' | 'unchanged';
}

export interface GenerateResult {
  files: GeneratedFile[];
  warnings: string[];
  outputDir: string;
  operationCount: number;
}

export interface GenerateOptions extends QueryFishConfig {
  /** Directory that relative paths resolve against. */
  root?: string;
  /** Compute results without writing anything. */
  dryRun?: boolean;
}

/**
 * Resolve the import specifier generated `requests.ts` uses for the client.
 * A bare specifier (e.g. `@/lib/client`) is passed through untouched.
 */
function resolveClientImport(client: string, outputDir: string, root: string): string {
  const isRelativePath = client.startsWith('.') || path.isAbsolute(client);
  if (!isRelativePath) return client;

  const absolute = path.resolve(root, client);
  let relative = path.relative(outputDir, absolute).split(path.sep).join('/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  // Strip the extension; generated code targets bundler/NodeNext resolution.
  return relative.replace(/\.(ts|tsx|js|mjs|cjs)$/, '');
}

async function format(
  contents: string,
  filepath: string,
  enabled: boolean,
): Promise<string> {
  if (!enabled) return contents;
  try {
    // Honour the user's own Prettier config so output matches their codebase.
    const config = await prettier.resolveConfig(filepath);
    return await prettier.format(contents, {
      ...config,
      filepath,
      parser: 'typescript',
    });
  } catch {
    // Formatting is a nicety; never fail a build over it.
    return contents;
  }
}

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const root = options.root ?? process.cwd();
  const config = { ...CONFIG_DEFAULTS, ...options };

  const outputDir = path.resolve(root, config.output);

  const { document, warnings: specWarnings } = await loadSpec(config.input, root);
  const ir = buildIR(document, config);

  const clientImport = resolveClientImport(config.client, outputDir, root);

  const hasQueries = plainQueries(ir).length > 0;
  const hasMutations = mutationOperations(ir).length > 0;
  const hasInfinite = infiniteOperations(ir).length > 0;

  const emitted: Array<{ name: string; contents: string }> = [
    { name: 'types.ts', contents: emitTypes(ir) },
    { name: 'requests.ts', contents: emitRequests(ir, clientImport) },
  ];

  if (hasQueries) emitted.push({ name: 'queries.ts', contents: emitQueries(ir) });
  if (hasMutations) emitted.push({ name: 'mutations.ts', contents: emitMutations(ir) });
  // Only written when something opted in to pagination.
  if (hasInfinite) {
    emitted.push({ name: 'infiniteQueries.ts', contents: emitInfiniteQueries(ir) });
  }
  if (config.barrel) {
    emitted.push({
      name: 'index.ts',
      contents: emitIndex({
        queries: hasQueries,
        mutations: hasMutations,
        infinite: hasInfinite,
      }),
    });
  }

  const files: GeneratedFile[] = [];

  for (const file of emitted) {
    const target = path.join(outputDir, file.name);
    const contents = await format(file.contents, target, config.format);

    let status: GeneratedFile['status'] = 'created';
    if (existsSync(target)) {
      const existing = await readFile(target, 'utf8');
      status = existing === contents ? 'unchanged' : 'updated';
    }

    files.push({ name: file.name, contents, status });
  }

  if (!options.dryRun) {
    await mkdir(outputDir, { recursive: true });
    await Promise.all(
      files
        .filter((f) => f.status !== 'unchanged')
        .map((f) => writeFile(path.join(outputDir, f.name), f.contents, 'utf8')),
    );
  }

  return {
    files,
    warnings: [...specWarnings, ...ir.warnings],
    outputDir,
    operationCount: ir.operations.length,
  };
}
