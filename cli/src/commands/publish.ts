import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { join, relative } from 'path';
import { ApiClient } from '../utils/api-client.js';
import { CcmConfig } from '../types/ccm.js';

interface PublishOptions {
  dry?: boolean;
  tag?: string;
}

export async function publish(options: PublishOptions = {}) {
  const apiClient = new ApiClient();
  const cwd = process.cwd();
  const ccmConfigPath = join(cwd, 'ccm.json');
  const commandsDir = join(cwd, 'commands');

  console.log(chalk.blue('📦 Publishing command set to CCM Registry...\n'));

  // Check authentication
  if (!apiClient.isAuthenticated()) {
    console.log(chalk.red('❌ Authentication required'));
    console.log(chalk.gray('Please login first: ccm login'));
    process.exit(1);
  }

  // Check if we're in a CCM project (publisher mode)
  if (!existsSync(ccmConfigPath)) {
    console.log(chalk.red('❌ Not in a CCM project'));
    console.log(chalk.gray('Run "ccm init" first to initialize the project'));
    process.exit(1);
  }

  if (!existsSync(commandsDir)) {
    console.log(chalk.red('❌ Commands directory not found'));
    console.log(chalk.gray('Create a commands/ directory with .md files'));
    process.exit(1);
  }

  try {
    const projectConfig: CcmConfig = JSON.parse(readFileSync(ccmConfigPath, 'utf-8'));

    console.log(chalk.gray(`Project: ${chalk.cyan(projectConfig.name)}`));
    console.log(chalk.gray(`Commands directory: ${chalk.cyan('commands/')}`));

    // Find all command files in the commands directory
    const pattern = join(commandsDir, '**/*.md');
    const commandFiles = await glob(pattern, { nodir: true });

    if (commandFiles.length === 0) {
      console.log(chalk.yellow('⚠️  No command files found'));
      console.log(chalk.gray('Add .md files to the commands/ directory'));
      process.exit(1);
    }

    console.log(chalk.gray(`\nFound ${commandFiles.length} command file(s):`));

    // Process each command file
    const commands = [];
    for (const filePath of commandFiles) {
      const relativePath = relative(commandsDir, filePath);
      const filename = relativePath;
      const content = readFileSync(filePath, 'utf-8');

      console.log(chalk.gray(`  • ${filename}`));
      commands.push({ filename, content });
    }

    // Create command metadata
    const metadata = `name: ${projectConfig.name}
version: ${projectConfig.version}
description: ${projectConfig.description || ''}
${options.tag ? `tags: [${options.tag}]` : ''}`;

    if (options.dry) {
      console.log(chalk.yellow('\n🔍 Dry run - would publish:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white('Metadata:'));
      console.log(chalk.gray(metadata));
      console.log(chalk.white('\nFiles:'));
      commands.forEach(cmd => {
        console.log(chalk.gray(`  ${cmd.filename} (${cmd.content.length} bytes)`));
      });
      console.log(chalk.yellow('\nUse --publish to actually publish'));
      return;
    }

    console.log(chalk.gray('\nPublishing to registry...'));

    const response = await apiClient.publishCommand(metadata, commands);

    if (!response.success) {
      console.log(chalk.red('❌ Publish failed:'), response.error);

      if (response.status === 401) {
        console.log(chalk.gray('\n💡 Your authentication may have expired. Try:'));
        console.log(chalk.gray('ccm login'));
      } else if (response.status === 409) {
        console.log(chalk.gray('\n💡 Tips:'));
        console.log(chalk.gray('• Update the version in ccm.json'));
        console.log(chalk.gray('• Use semantic versioning (e.g., 1.0.1)'));
      }

      process.exit(1);
    }

    const { command } = response.data;

    console.log(chalk.green('✅ Command set published successfully!'));
    console.log(chalk.gray('─'.repeat(45)));
    console.log(chalk.white(`Package: ${chalk.cyan(command.name)}`));
    console.log(chalk.white(`Version: ${chalk.cyan(command.version)}`));
    console.log(chalk.white(`Description: ${chalk.gray(command.description)}`));
    console.log(chalk.white(`Commands: ${chalk.cyan(commands.length)} file(s)`));
    if (command.tags && command.tags.length > 0) {
      console.log(chalk.white(`Tags: ${command.tags.map((t: string) => chalk.magenta(`#${t}`)).join(' ')}`));
    }

    console.log(chalk.blue('\n🎯 Your command set is now available:'));
    console.log(chalk.gray(`• Install: ccm install ${command.name}`));
    console.log(chalk.gray(`• View: ccm info ${command.name}`));
    console.log(chalk.gray(`• Search: ccm search ${command.name}`));

    console.log(chalk.yellow('\n📊 Next steps:'));
    console.log(chalk.gray('• Share your command with others'));
    console.log(chalk.gray('• Update documentation if needed'));
    console.log(chalk.gray('• Monitor downloads and usage'));

  } catch (error) {
    console.error(chalk.red('❌ Publish failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}