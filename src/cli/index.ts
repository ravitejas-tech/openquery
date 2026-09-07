import path from 'node:path';
import { cac } from 'cac';

import { loadConfig } from '../config/load.js';
import { generate, type GenerateResult } from '../generate.js';
import { OpenQueryError } from '../loader/errors.js';

const cli = cac('openquery');

// ANSI colours, disabled when not a TTY or when NO_COLOR is set.
const useColor = process.stdout.isTTY && !process.env['NO_COLOR'];
const ESC = '\x1b';
const wrap = (open: string, close: string) => (s: string) =>
  useColor ? `${ESC}[${open}m${s}${ESC}[${close}m` : s;
const color = {
  dim: wrap('2', '22'),
  red: wrap('31', '39'),
  green: wrap('32', '39'),
  yellow: wrap('33', '39'),
  bold: wrap('1', '22'),
};

function reportResult(
  result: GenerateResult,
  options: { dryRun: boolean; silent: boolean },
): void {
  if (options.silent) return;

  const changed = result.files.filter((f) => f.status !== 'unchanged');

  for (const warning of result.warnings) {
    console.warn(`${color.yellow('warning')} ${warning}`);
  }

  if (options.dryRun) {
    if (changed.length === 0) {
      console.log(`${color.green('✓')} No changes.`);
    } else {
      console.log(color.bold(`Would write ${changed.length} file(s):`));
      for (const file of changed) {
        const label = file.status === 'created' ? color.green('+') : color.yellow('M');
        console.log(`  ${label} ${file.name}`);
      }
    }
    return;
  }

  if (changed.length === 0) {
    console.log(
      `${color.green('✓')} Up to date ${color.dim(`(${result.operationCount} operations)`)}`,
    );
    return;
  }

  for (const file of changed) {
    const label = file.status === 'created' ? color.green('+') : color.yellow('M');
    console.log(`  ${label} ${file.name}`);
  }
  console.log(
    `${color.green('✓')} Generated ${result.operationCount} operations → ${color.dim(
      path.relative(process.cwd(), result.outputDir) || '.',
    )}`,
  );
}

function reportError(error: unknown): void {
  if (error instanceof OpenQueryError) {
    console.error(color.red(error.format()));
  } else if (error instanceof Error) {
    console.error(`${color.red('error:')} ${error.message}`);
    if (process.env['OPENQUERY_DEBUG']) console.error(error.stack);
  } else {
    console.error(`${color.red('error:')} ${String(error)}`);
  }
}

cli
  .command('generate', 'Generate typed hooks from an OpenAPI document')
  .option('-c, --config <path>', 'Path to config file')
  .option('-i, --input <spec>', 'Path or URL to the OpenAPI document')
  .option('-o, --output <dir>', 'Output directory')
  .option('--client <module>', 'Module exporting the HTTP client')
  .option('--no-format', 'Skip Prettier formatting')
  .option('--dry-run', 'Report what would change without writing')
  .option('--watch', 'Regenerate when the spec changes')
  .option('--silent', 'Suppress output')
  .action(async (flags) => {
    const cwd = process.cwd();

    const run = async (): Promise<GenerateResult> => {
      const { config, root } = await loadConfig({
        cwd,
        configPath: flags.config,
        overrides: {
          input: flags.input,
          output: flags.output,
          client: flags.client,
          // cac maps --no-format to format: false
          format: flags.format === false ? false : undefined,
        },
      });

      const result = await generate({ ...config, root, dryRun: Boolean(flags.dryRun) });
      reportResult(result, {
        dryRun: Boolean(flags.dryRun),
        silent: Boolean(flags.silent),
      });
      return result;
    };

    try {
      await run();
    } catch (error) {
      reportError(error);
      process.exitCode = 1;
      return;
    }

    if (flags.watch) {
      const { startWatch } = await import('./watch.js');
      await startWatch({ cwd, configPath: flags.config, run, onError: reportError });
    }
  });

cli.help();
cli.version(process.env['npm_package_version'] ?? '0.1.0');

try {
  cli.parse();
} catch (error) {
  reportError(error);
  process.exitCode = 1;
}
