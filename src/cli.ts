#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { list } from './commands/list.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const program = new Command();

program
  .name('ccm')
  .description('Claude Command Manager - Package manager for Claude Code custom commands')
  .version(packageJson.version);

// List command
program
  .command('list')
  .alias('ls')
  .description('List all installed Claude commands')
  .option('-l, --local', 'Show only local commands', false)
  .option('-g, --global', 'Show only global commands', false)
  .action(async (options) => {
    try {
      await list(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}