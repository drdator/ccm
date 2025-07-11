#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { list } from './commands/list.js';
import { init } from './commands/init.js';
import { login, logout } from './commands/login.js';
import { register } from './commands/register.js';
import { publish } from './commands/publish.js';
import { search } from './commands/search.js';
import { install } from './commands/install.js';
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

// Init command
program
  .command('init')
  .description('Initialize a new CCM project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <description>', 'Project description')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    try {
      await init(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Authentication commands
program
  .command('register')
  .description('Create a new CCM Registry account')
  .option('-u, --username <username>', 'Username')
  .option('-e, --email <email>', 'Email address')
  .option('-p, --password <password>', 'Password')
  .action(async (options) => {
    try {
      await register(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('login')
  .description('Login to CCM Registry')
  .option('-u, --username <username>', 'Username or email')
  .option('-p, --password <password>', 'Password')
  .option('-f, --force', 'Force login even if already authenticated')
  .action(async (options) => {
    try {
      await login(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Logout from CCM Registry')
  .action(async () => {
    try {
      await logout();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

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

// Command management
program
  .command('search <query>')
  .description('Search for commands in the registry')
  .option('-l, --limit <number>', 'Number of results to show', '20')
  .option('-o, --offset <number>', 'Number of results to skip', '0')
  .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
  .action(async (query, options) => {
    try {
      await search(query, {
        limit: parseInt(options.limit),
        offset: parseInt(options.offset),
        tags: options.tags
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('install [command]')
  .description('Install command(s) from the registry')
  .option('-v, --version <version>', 'Specific version to install')
  .option('-f, --force', 'Force reinstall even if already installed')
  .action(async (command, options) => {
    try {
      await install(command, {
        version: options.version,
        force: options.force
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('publish')
  .description('Publish command(s) to the registry')
  .option('-d, --dry', 'Show what would be published without actually publishing')
  .option('-t, --tag <tag>', 'Add a tag to the published command')
  .action(async (options) => {
    try {
      await publish(options);
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