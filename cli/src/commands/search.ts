import chalk from 'chalk';
import { ApiClient } from '../utils/api-client.js';

interface SearchOptions {
  limit?: number;
  offset?: number;
  tags?: string;
}

export async function search(query: string, options: SearchOptions = {}) {
  const apiClient = new ApiClient();

  console.log(chalk.blue(`🔍 Searching for "${query}"...\n`));

  try {
    const limit = Math.min(options.limit || 20, 50);
    const offset = options.offset || 0;

    const response = await apiClient.searchCommands(query, limit, offset);

    if (!response.success) {
      console.log(chalk.red('❌ Search failed:'), response.error);
      process.exit(1);
    }

    const { commands, pagination } = response.data;

    if (commands.length === 0) {
      console.log(chalk.yellow('No commands found'));
      console.log(chalk.gray('\n💡 Tips:'));
      console.log(chalk.gray('• Try different keywords'));
      console.log(chalk.gray('• Check spelling'));
      console.log(chalk.gray('• Browse all commands: ccm list --remote'));
      return;
    }

    console.log(chalk.green(`Found ${commands.length} command(s):`));
    console.log(chalk.gray('─'.repeat(60)));

    // Display commands
    commands.forEach((cmd: any, index: number) => {
      const num = (offset + index + 1).toString().padStart(2);
      console.log(`${chalk.cyan(num)}. ${chalk.white(cmd.name)} ${chalk.gray(`v${cmd.version}`)}`);
      
      if (cmd.description) {
        console.log(`    ${chalk.gray(cmd.description)}`);
      }
      
      if (cmd.author_username) {
        console.log(`    ${chalk.gray(`by ${cmd.author_username}`)}`);
      }
      
      if (cmd.tags && cmd.tags.length > 0) {
        const tags = cmd.tags.map((tag: string) => chalk.magenta(`#${tag}`)).join(' ');
        console.log(`    ${tags}`);
      }
      
      if (cmd.downloads > 0) {
        console.log(`    ${chalk.gray(`↓ ${cmd.downloads} download${cmd.downloads !== 1 ? 's' : ''}`)}`);
      }
      
      console.log(); // Empty line between commands
    });

    // Pagination info
    if (pagination.total > limit) {
      const hasMore = (offset + limit) < pagination.total;
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.gray(`Showing ${offset + 1}-${offset + commands.length} of ${pagination.total} results`));
      
      if (hasMore) {
        const nextOffset = offset + limit;
        console.log(chalk.gray(`Next page: ccm search "${query}" --offset ${nextOffset}`));
      }
    }

    console.log(chalk.blue('\n🎯 To install a command:'));
    console.log(chalk.gray(`ccm install <command-name>`));

  } catch (error) {
    console.error(chalk.red('❌ Search failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}