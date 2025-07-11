import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { ApiClient } from '../utils/api-client.js';
import { CcmConfigManager } from '../utils/ccm-config.js';
import { SymlinkManager } from '../utils/symlinks.js';

interface InstallOptions {
  version?: string;
  saveDev?: boolean;
  force?: boolean;
}

export async function install(commandName?: string, options: InstallOptions = {}) {
  const apiClient = new ApiClient();
  const configManager = new CcmConfigManager();

  console.log(chalk.blue('📦 Installing command(s)...\n'));

  // Check if we're in a CCM project
  if (!configManager.exists()) {
    console.log(chalk.red('❌ Not in a CCM project'));
    console.log(chalk.gray('Run "ccm init" first to initialize the project'));
    process.exit(1);
  }

  const projectConfig = configManager.read();
  const installedDir = configManager.getInstalledDir();
  const commandsDir = configManager.getCommandsDir();

  // Ensure directories exist
  if (!existsSync(installedDir)) {
    mkdirSync(installedDir, { recursive: true });
  }
  if (!existsSync(commandsDir)) {
    mkdirSync(commandsDir, { recursive: true });
  }

  try {
    if (commandName) {
      // Install specific command
      await installCommand(commandName, options, apiClient, configManager);
    } else {
      // Install all dependencies from ccm.json
      await installDependencies(projectConfig, apiClient, configManager);
    }
  } catch (error) {
    console.error(chalk.red('❌ Installation failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function installCommand(
  commandName: string,
  options: InstallOptions,
  apiClient: ApiClient,
  configManager: CcmConfigManager
) {
  console.log(chalk.gray(`Installing ${chalk.cyan(commandName)}...`));

  // Download command from registry
  const response = await apiClient.downloadCommand(commandName, options.version);

  if (!response.success) {
    if (response.status === 404) {
      console.log(chalk.red(`❌ Command "${commandName}" not found`));
      console.log(chalk.gray('• Check the command name'));
      console.log(chalk.gray('• Search available commands: ccm search <query>'));
    } else {
      console.log(chalk.red('❌ Download failed:'), response.error);
    }
    process.exit(1);
  }

  const { name, version, description, files, tags } = response.data;
  const installedDir = configManager.getInstalledDir();
  const commandsDir = configManager.getCommandsDir();

  console.log(chalk.gray(`Found ${chalk.cyan(name)} v${version}`));

  // Check if already installed
  const existingFiles = files.filter((file: any) => 
    existsSync(join(commandsDir, file.filename))
  );

  if (existingFiles.length > 0 && !options.force) {
    console.log(chalk.yellow(`⚠️  Command "${name}" is already installed`));
    console.log(chalk.gray('Use --force to reinstall'));
    return;
  }

  // Install files
  console.log(chalk.gray(`Installing ${files.length} file(s)...`));

  for (const file of files) {
    const installedPath = join(installedDir, file.filename);
    const commandPath = join(commandsDir, file.filename);

    // Write file to installed directory
    const fileDir = join(installedDir, file.filename.split('/').slice(0, -1).join('/'));
    if (fileDir !== installedDir && !existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }
    
    writeFileSync(installedPath, file.content);
    console.log(chalk.gray(`  ✓ ${file.filename}`));

    // Create symlink in commands directory
    const symlinkResult = SymlinkManager.createSymlink(installedPath, commandPath);
    if (!symlinkResult.success) {
      console.log(chalk.yellow(`⚠️  Warning: ${symlinkResult.error}`));
      console.log(chalk.gray('File was copied instead of symlinked'));
    }
  }

  // Update ccm.json
  const projectConfig = configManager.read();
  const depType = options.saveDev ? 'devDependencies' : 'dependencies';
  const versionSpec = options.version || `^${version}`;

  if (!projectConfig[depType]) {
    projectConfig[depType] = {};
  }
  projectConfig[depType][name] = versionSpec;
  configManager.write(projectConfig);

  // Update metadata
  const metadataPath = join(installedDir, '.ccm-metadata.json');
  let metadata: any = { installedPackages: {} };
  
  if (existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
    } catch {
      // Use default metadata if parsing fails
    }
  }

  metadata.installedPackages[name] = {
    version,
    description,
    tags,
    installedAt: new Date().toISOString(),
    files: files.map((f: any) => f.filename)
  };

  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(chalk.green(`✅ Installed ${chalk.cyan(name)} v${version}`));
  
  if (description) {
    console.log(chalk.gray(`   ${description}`));
  }
  
  if (tags && tags.length > 0) {
    console.log(chalk.gray(`   ${tags.map((t: string) => `#${t}`).join(' ')}`));
  }

  console.log(chalk.blue('\n🎯 Command is now available in Claude Code!'));
  console.log(chalk.gray(`Use: /${basename(files[0].filename, '.md')}`));
}

async function installDependencies(
  projectConfig: any,
  apiClient: ApiClient,
  configManager: CcmConfigManager
) {
  const dependencies = {
    ...projectConfig.dependencies,
    ...projectConfig.devDependencies
  };

  const commandNames = Object.keys(dependencies);

  if (commandNames.length === 0) {
    console.log(chalk.yellow('No dependencies found in ccm.json'));
    return;
  }

  console.log(chalk.gray(`Installing ${commandNames.length} dependencies...`));

  for (const commandName of commandNames) {
    const versionSpec = dependencies[commandName];
    console.log(chalk.gray(`\n• ${commandName}@${versionSpec}`));
    
    try {
      await installCommand(
        commandName,
        { force: true }, // Force to ensure clean install
        apiClient,
        configManager
      );
    } catch (error) {
      console.log(chalk.red(`  ✗ Failed to install ${commandName}`));
      console.log(chalk.red(`    ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  console.log(chalk.green('\n✅ All dependencies installed!'));
}