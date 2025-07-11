import chalk from 'chalk';
import { scanCommands } from '../utils/scanner.js';
import { Command } from '../types/command.js';

export async function list(options: { local?: boolean; global?: boolean }) {
  console.log(chalk.blue('Scanning for Claude commands...\n'));

  const commands = await scanCommands(options);

  if (commands.length === 0) {
    console.log(chalk.yellow('No commands found.'));
    console.log(chalk.gray('\nTo install commands, use: ccm install <command>'));
    console.log(chalk.gray('To create a command, place a .md file in .claude/commands/'));
    return;
  }

  // Group commands by location
  const localCommands = commands.filter(cmd => cmd.location === 'local');
  const globalCommands = commands.filter(cmd => cmd.location === 'global');

  // Display local commands
  if (localCommands.length > 0 && (options.local || !options.global)) {
    console.log(chalk.green('Local Commands:'));
    displayCommands(localCommands);
    if (globalCommands.length > 0 && !options.local) {
      console.log(''); // Add spacing
    }
  }

  // Display global commands
  if (globalCommands.length > 0 && (options.global || !options.local)) {
    console.log(chalk.green('Global Commands:'));
    displayCommands(globalCommands);
  }

  // Display summary
  console.log('');
  console.log(chalk.gray(`Total: ${commands.length} command${commands.length !== 1 ? 's' : ''}`));
}

function displayCommands(commands: Command[]) {
  // Sort commands by name
  const sortedCommands = commands.sort((a, b) => a.name.localeCompare(b.name));

  // Calculate column widths
  const maxNameLength = Math.max(...sortedCommands.map(cmd => cmd.name.length), 10);

  // Display commands in a table format
  sortedCommands.forEach(cmd => {
    const name = cmd.name.padEnd(maxNameLength + 2);
    const description = cmd.metadata.description || chalk.gray('No description');
    const version = cmd.metadata.version ? chalk.gray(` v${cmd.metadata.version}`) : '';
    
    console.log(`  ${chalk.cyan(name)} ${description}${version}`);
    
    // Show tags if available
    if (cmd.metadata.tags && cmd.metadata.tags.length > 0) {
      const tags = cmd.metadata.tags.map(tag => chalk.magenta(`#${tag}`)).join(' ');
      console.log(`  ${' '.repeat(maxNameLength + 2)} ${tags}`);
    }
  });
}