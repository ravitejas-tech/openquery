/**
 * The test that matters most for a code generator.
 *
 * Snapshots prove the output did not *change*; only type-checking proves it
 * *compiles*. This generates each fixture to a temporary directory, writes a
 * client stub and a tsconfig next to it, and runs `tsc --noEmit` over the
 * result. If OpenQuery ever emits TypeScript that does not build, this fails.
 */

import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, describe, expect, it } from 'vitest';

import { generate } from '../src/generate.js';

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(here, '..');
const fixtures = path.join(here, 'fixtures');

const created: string[] = [];

afterAll(async () => {
  await Promise.all(created.map((dir) => rm(dir, { recursive: true, force: true })));
});

/** Minimal client matching the structural interface generated code expects. */
const CLIENT_STUB = `
export const client = {
  request<T>(_config: {
    method: string;
    url: string;
    params?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    data?: unknown;
  }): Promise<T> {
    return Promise.resolve(undefined as T);
  },
};
`;

async function generateAndCompile(spec: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'openquery-compile-'));
  created.push(dir);

  await generate({
    input: path.join(fixtures, spec),
    output: path.join(dir, 'api'),
    client: './client',
    root: dir,
  });

  await writeFile(path.join(dir, 'client.ts'), CLIENT_STUB, 'utf8');

  // Point at the real node_modules so react-query-kit resolves.
  await writeFile(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2023', 'DOM'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          typeRoots: [path.join(projectRoot, 'node_modules', '@types')],
          // Resolve library imports against the repo's node_modules.
          paths: { '*': [path.join(projectRoot, 'node_modules', '*')] },
        },
        include: ['**/*.ts'],
      },
      null,
      2,
    ),
    'utf8',
  );

  const tsc = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

  try {
    await execFileAsync(process.execPath, [tsc, '--project', dir], {
      cwd: dir,
      maxBuffer: 10 * 1024 * 1024,
    });
    return '';
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return `${err.stdout ?? ''}${err.stderr ?? ''}`.trim();
  }
}

describe('generated code compiles', () => {
  it('petstore', async () => {
    expect(await generateAndCompile('petstore.yaml')).toBe('');
  });

  it('edge cases', async () => {
    expect(await generateAndCompile('edge-cases.yaml')).toBe('');
  });

  it('swagger 2.0', async () => {
    expect(await generateAndCompile('swagger2.json')).toBe('');
  });
});
