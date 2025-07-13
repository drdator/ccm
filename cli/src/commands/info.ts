import chalk from 'chalk';
import { ApiClient } from '../utils/api-client.js';

interface InfoOptions {
  version?: string;
}

export async function info(commandName: string, options: InfoOptions = {}) {
  const apiClient = new ApiClient();

  console.log(chalk.blue(`📋 Getting information for "${commandName}"...\n`));

  try {
    const response = await apiClient.getCommand(commandName, options.version);

    if (!response.success) {
      if (response.status === 404) {
        console.log(chalk.red('❌ Command not found'));
        console.log(chalk.gray('\n💡 Tips:'));
        console.log(chalk.gray('• Check the command name spelling'));
        console.log(chalk.gray('• Search for similar commands: ccm search <query>'));
        console.log(chalk.gray('• Browse all commands: ccm list --remote'));
      } else {
        console.log(chalk.red('❌ Failed to get command info:'), response.error);
      }
      process.exit(1);
    }

    const { command } = response.data;

    // Header
    console.log(chalk.white.bold(`${command.name} v${command.version}`));
    console.log(chalk.gray('─'.repeat(50)));

    // Description
    if (command.description) {
      console.log(chalk.white('Description:'));
      console.log(`  ${command.description}\n`);
    }

    // Metadata section
    console.log(chalk.white('Metadata:'));
    
    if (command.category) {
      console.log(`  ${chalk.blue('📁 Category:')} ${command.category}`);
    }
    
    if (command.license) {
      console.log(`  ${chalk.yellow('⚖️  License:')} ${command.license}`);
    }
    
    if (command.repository) {
      console.log(`  ${chalk.cyan('📦 Repository:')} ${command.repository}`);
    }
    
    if (command.homepage) {
      console.log(`  ${chalk.green('🏠 Homepage:')} ${command.homepage}`);
    }
    
    console.log(`  ${chalk.gray('📅 Published:')} ${new Date(command.published_at).toLocaleDateString()}`);
    console.log(`  ${chalk.gray('🔄 Updated:')} ${new Date(command.updated_at).toLocaleDateString()}`);
    console.log(`  ${chalk.gray('⬇️  Downloads:')} ${command.downloads}`);

    // Tags
    if (command.tags && command.tags.length > 0) {
      const tags = command.tags.map((tag: string) => chalk.magenta(`#${tag}`)).join(' ');
      console.log(`\n${chalk.white('Tags:')}\n  ${tags}`);
    }

    // Installation instructions
    console.log(chalk.blue('\n🎯 Installation:'));
    if (options.version) {
      console.log(chalk.gray(`ccm install ${command.name}@${command.version}`));
    } else {
      console.log(chalk.gray(`ccm install ${command.name}`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to get command info:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}