import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { ApiClient } from '../utils/api-client.js';
import { ConsumerConfigManager } from '../utils/consumer-config.js';
import { SymlinkManager } from '../utils/symlinks.js';

interface InstallOptions {
  version?: string;
  force?: boolean;
}

export async function install(commandSpec?: string, options: InstallOptions = {}) {
  const apiClient = new ApiClient();
  const configManager = new ConsumerConfigManager();

  console.log(chalk.blue('📦 Installing command(s)...\n'));

  // Ensure .claude directory structure exists
  configManager.ensureDirectories();

  const projectConfig = configManager.read();
  const installedDir = configManager.getInstalledDir();
  const commandsDir = configManager.getCommandsDir();

  try {
    if (commandSpec) {
      // Parse package@version syntax
      const atIndex = commandSpec.lastIndexOf('@');
      let commandName: string;
      let version: string | undefined;
      
      if (atIndex > 0) {
        commandName = commandSpec.substring(0, atIndex);
        version = commandSpec.substring(atIndex + 1);
      } else {
        commandName = commandSpec;
        version = options.version;
      }
      
      // Install specific command with parsed version
      await installCommand(commandName, { ...options, version }, apiClient, configManager);
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
  configManager: ConsumerConfigManager
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

  const packageCommandPath = join(commandsDir, name);
  const packageInstalledDir = join(installedDir, name);

  // Check if package is already installed
  if ((existsSync(packageCommandPath) || existsSync(packageInstalledDir)) && !options.force) {
    console.log(chalk.yellow(`⚠️  Package "${name}" is already installed`));
    console.log(chalk.gray('Use --force to reinstall'));
    return;
  }

  // Install files
  console.log(chalk.gray(`Installing ${files.length} file(s)...`));

  // Create package directory under installed/
  if (!existsSync(packageInstalledDir)) {
    mkdirSync(packageInstalledDir, { recursive: true });
  }

  // Write all files to the package directory
  for (const file of files) {
    const installedPath = join(packageInstalledDir, file.filename);
    
    // Create subdirectories if needed
    const fileDir = join(packageInstalledDir, file.filename.split('/').slice(0, -1).join('/'));
    if (fileDir !== packageInstalledDir && !existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }
    
    writeFileSync(installedPath, file.content);
    console.log(chalk.gray(`  ✓ ${file.filename}`));
  }

  // Create a single symlink for the entire package directory
  const symlinkResult = SymlinkManager.createSymlink(packageInstalledDir, packageCommandPath);
  
  if (!symlinkResult.success) {
    console.log(chalk.yellow(`⚠️  Warning: ${symlinkResult.error}`));
    console.log(chalk.gray('Package directory was copied instead of symlinked'));
  }

  // Update ccm.json
  const projectConfig = configManager.read();
  const versionSpec = options.version || `^${version}`;

  if (!projectConfig.dependencies) {
    projectConfig.dependencies = {};
  }
  projectConfig.dependencies[name] = versionSpec;
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
    files: files.map((f: any) => f.filename),
    installedPath: join(installedDir, name)
  };

  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(chalk.green(`✅ Installed ${chalk.cyan(name)} v${version}`));
  
  if (description) {
    console.log(chalk.gray(`   ${description}`));
  }
  
  if (tags && tags.length > 0) {
    console.log(chalk.gray(`   ${tags.map((t: string) => `#${t}`).join(' ')}`));
  }

  console.log(chalk.blue('\n🎯 Commands are now available in Claude Code!'));
  console.log(chalk.gray('Use commands with namespace:'));
  files.forEach((file: any) => {
    const commandName = basename(file.filename, '.md');
    console.log(chalk.gray(`  /${name}/${commandName}`));
  });
}

async function installDependencies(
  projectConfig: any,
  apiClient: ApiClient,
  configManager: ConsumerConfigManager
) {
  const dependencies = projectConfig.dependencies || {};
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