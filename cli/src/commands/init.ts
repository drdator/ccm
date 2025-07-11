import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { basename } from 'path';
import chalk from 'chalk';
import { CcmConfigManager } from '../utils/ccm-config.js';

interface InitOptions {
  name?: string;
  description?: string;
  yes?: boolean;
}

export async function init(options: InitOptions = {}) {
  const projectRoot = process.cwd();
  const projectName = options.name || basename(projectRoot);
  const configManager = new CcmConfigManager(projectRoot);

  console.log(chalk.blue('🚀 Initializing CCM project...\n'));

  // Check if already initialized
  if (configManager.exists()) {
    console.log(chalk.yellow('⚠️  CCM project already initialized'));
    console.log(chalk.gray('ccm.json already exists. Use --force to overwrite.'));
    return;
  }

  try {
    // Create .claude directory if it doesn't exist
    const claudeDir = configManager.getClaudeDir();
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
      console.log(chalk.green('✅ Created .claude directory'));
    }

    // Create commands directory
    const commandsDir = configManager.getCommandsDir();
    if (!existsSync(commandsDir)) {
      mkdirSync(commandsDir, { recursive: true });
      console.log(chalk.green('✅ Created commands directory'));
    }

    // Create installed directory
    const installedDir = configManager.getInstalledDir();
    if (!existsSync(installedDir)) {
      mkdirSync(installedDir, { recursive: true });
      console.log(chalk.green('✅ Created installed directory'));
    }

    // Create ccm.json
    const config = configManager.create(projectName, options.description);
    console.log(chalk.green('✅ Created ccm.json'));

    // Create .gitignore for Claude directory
    const gitignorePath = join(claudeDir, '.gitignore');
    const gitignoreContent = `# CCM installed commands
installed/
.ccm-lock.json
*.ccm-tmp

# Keep user commands
!commands/
!ccm.json
`;
    
    writeFileSync(gitignorePath, gitignoreContent);
    console.log(chalk.green('✅ Created .claude/.gitignore'));

    // Create metadata file in installed directory
    const metadataPath = join(installedDir, '.ccm-metadata.json');
    const metadata = {
      version: '1.0.0',
      created: new Date().toISOString(),
      installedPackages: {}
    };
    
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(chalk.green('✅ Created installation metadata'));

    // Display summary
    console.log(chalk.blue('\n📋 Project initialized successfully!'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white(`Project: ${chalk.cyan(config.name)}`));
    if (config.description) {
      console.log(chalk.white(`Description: ${chalk.gray(config.description)}`));
    }
    console.log(chalk.white(`Commands: ${chalk.gray('.claude/commands/')}`));
    console.log(chalk.white(`Installed: ${chalk.gray('.claude/installed/')}`));
    
    console.log(chalk.blue('\n🎯 Next steps:'));
    console.log(chalk.gray('• Create commands in .claude/commands/'));
    console.log(chalk.gray('• Install packages with: ccm install <package>'));
    console.log(chalk.gray('• List commands with: ccm list'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize CCM project:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}