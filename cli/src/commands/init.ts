import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { basename } from 'path';
import chalk from 'chalk';
import { CcmConfig } from '../types/ccm.js';

interface InitOptions {
  name?: string;
  description?: string;
  yes?: boolean;
}

export async function init(options: InitOptions = {}) {
  console.log(chalk.blue('🚀 Initializing CCM project for command development...\n'));

  const cwd = process.cwd();
  const commandsDir = join(cwd, 'commands');
  const ccmConfigPath = join(cwd, 'ccm.json');
  const gitignorePath = join(cwd, '.gitignore');

  // Check if already initialized
  if (existsSync(ccmConfigPath)) {
    console.log(chalk.yellow('⚠️  CCM project already initialized'));
    console.log(chalk.gray('ccm.json already exists. Use --force to overwrite.'));
    return;
  }

  try {
    // Create commands directory for development
    console.log(chalk.gray('Creating directories...'));
    if (!existsSync(commandsDir)) {
      mkdirSync(commandsDir, { recursive: true });
      console.log(chalk.gray('  ✓ commands/'));
    }

    // Create ccm.json in root
    console.log(chalk.gray('\nCreating configuration...'));
    
    const projectName = options.name || basename(cwd);
    const description = options.description || 'Claude commands package';
    
    const config: CcmConfig = {
      name: projectName,
      version: '1.0.0',
      description
    };

    writeFileSync(ccmConfigPath, JSON.stringify(config, null, 2));
    console.log(chalk.gray('  ✓ ccm.json'));

    // Create/update .gitignore
    let gitignoreContent = '';
    if (existsSync(gitignorePath)) {
      gitignoreContent = readFileSync(gitignorePath, 'utf-8');
    }
    
    const ccmIgnoreRules = `
# CCM
node_modules/
*.log
.DS_Store
`;
    
    if (!gitignoreContent.includes('# CCM')) {
      writeFileSync(gitignorePath, gitignoreContent + ccmIgnoreRules);
      console.log(chalk.gray('  ✓ .gitignore updated'));
    }

    // Success message
    console.log(chalk.green('\n✅ CCM project initialized successfully!'));
    console.log(chalk.gray('─'.repeat(45)));
    console.log(chalk.white(`Project: ${chalk.cyan(projectName)}`));
    console.log(chalk.white(`Location: ${chalk.gray(cwd)}`));
    
    console.log(chalk.blue('\n🎯 Next steps:'));
    console.log(chalk.gray('1. Create command files in commands/'));
    console.log(chalk.gray('2. Test your commands locally'));
    console.log(chalk.gray('3. Publish your commands: ccm publish'));
    
    console.log(chalk.yellow('\n📝 Example command file:'));
    console.log(chalk.gray('  commands/hello.md'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize CCM project:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}