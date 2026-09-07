/** The barrel `index.ts`, so consumers have a single import path. */

import { GENERATED_HEADER } from './writer.js';

export function emitIndex(files: {
  queries: boolean;
  mutations: boolean;
  infinite: boolean;
}): string {
  const lines = [
    GENERATED_HEADER,
    '',
    `export * from './types.js';`,
    `export * from './requests.js';`,
  ];

  if (files.queries) lines.push(`export * from './queries.js';`);
  if (files.mutations) lines.push(`export * from './mutations.js';`);
  if (files.infinite) lines.push(`export * from './infiniteQueries.js';`);

  return lines.join('\n') + '\n';
}
