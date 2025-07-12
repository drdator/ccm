import chalk from 'chalk';
import { ApiConfigManager } from '../config/api.js';

interface ConfigOptions {
  list?: boolean;
  get?: string;
  set?: string;
  registry?: string;
}

export async function config(options: ConfigOptions = {}) {
  const configManager = new ApiConfigManager();
  const currentConfig = configManager.getConfig();

  // List all configuration
  if (options.list) {
    console.log(chalk.blue('📋 CCM Configuration'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(chalk.white(`Registry URL: ${chalk.cyan(currentConfig.registryUrl)}`));
    console.log(chalk.white(`Username: ${chalk.cyan(currentConfig.username || 'Not logged in')}`));
    console.log(chalk.white(`Authenticated: ${currentConfig.token ? chalk.green('Yes') : chalk.red('No')}`));
    return;
  }

  // Get specific config value
  if (options.get) {
    const key = options.get.toLowerCase();
    switch (key) {
      case 'registry':
      case 'registryurl':
        console.log(currentConfig.registryUrl);
        break;
      case 'username':
        console.log(currentConfig.username || '');
        break;
      case 'authenticated':
        console.log(configManager.isAuthenticated() ? 'true' : 'false');
        break;
      default:
        console.log(chalk.red(`❌ Unknown config key: ${options.get}`));
        console.log(chalk.gray('Available keys: registry, username, authenticated'));
        process.exit(1);
    }
    return;
  }

  // Set registry URL
  if (options.registry) {
    let registryUrl = options.registry;
    
    // Add /api suffix if not present
    if (!registryUrl.endsWith('/api')) {
      registryUrl = registryUrl.replace(/\/$/, '') + '/api';
    }
    
    // Add protocol if missing
    if (!registryUrl.startsWith('http://') && !registryUrl.startsWith('https://')) {
      registryUrl = 'https://' + registryUrl;
    }

    configManager.saveConfig({ registryUrl });
    console.log(chalk.green('✅ Registry URL updated'));
    console.log(chalk.gray(`New registry: ${chalk.cyan(registryUrl)}`));
    return;
  }

  // Set generic config value
  if (options.set) {
    const [key, value] = options.set.split('=');
    if (!key || !value) {
      console.log(chalk.red('❌ Invalid format. Use: ccm config --set key=value'));
      process.exit(1);
    }

    switch (key.toLowerCase()) {
      case 'registry':
      case 'registryurl':
        let registryUrl = value;
        if (!registryUrl.endsWith('/api')) {
          registryUrl = registryUrl.replace(/\/$/, '') + '/api';
        }
        if (!registryUrl.startsWith('http://') && !registryUrl.startsWith('https://')) {
          registryUrl = 'https://' + registryUrl;
        }
        configManager.saveConfig({ registryUrl });
        console.log(chalk.green('✅ Registry URL updated'));
        console.log(chalk.gray(`New registry: ${chalk.cyan(registryUrl)}`));
        break;
      default:
        console.log(chalk.red(`❌ Cannot set config key: ${key}`));
        console.log(chalk.gray('Settable keys: registry'));
        process.exit(1);
    }
    return;
  }

  // Default: show current config
  console.log(chalk.blue('📋 CCM Configuration'));
  console.log(chalk.gray('─'.repeat(30)));
  console.log(chalk.white(`Registry URL: ${chalk.cyan(currentConfig.registryUrl)}`));
  console.log(chalk.white(`Username: ${chalk.cyan(currentConfig.username || 'Not logged in')}`));
  console.log(chalk.white(`Authenticated: ${currentConfig.token ? chalk.green('Yes') : chalk.red('No')}`));
  
  console.log(chalk.blue('\n📝 Usage:'));
  console.log(chalk.gray('• Set registry: ccm config --registry <url>'));
  console.log(chalk.gray('• List all: ccm config --list'));
  console.log(chalk.gray('• Get value: ccm config --get <key>'));
}