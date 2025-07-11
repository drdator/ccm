import chalk from 'chalk';
import { ApiClient } from '../utils/api-client.js';

interface LoginOptions {
  username?: string;
  password?: string;
}

export async function login(options: LoginOptions = {}) {
  const apiClient = new ApiClient();

  console.log(chalk.blue('🔐 Logging into CCM Registry...\n'));

  // Check if already authenticated
  if (apiClient.isAuthenticated()) {
    const currentUser = apiClient.getUsername();
    console.log(chalk.yellow(`⚠️  Already logged in as ${chalk.cyan(currentUser)}`));
    console.log(chalk.gray('Use --force to login as a different user'));
    return;
  }

  let username = options.username;
  let password = options.password;

  // Get credentials if not provided
  if (!username) {
    // In a real implementation, you'd use a library like 'inquirer' for prompts
    console.log(chalk.red('❌ Username is required'));
    console.log(chalk.gray('Usage: ccm login --username <username> --password <password>'));
    process.exit(1);
  }

  if (!password) {
    console.log(chalk.red('❌ Password is required'));
    console.log(chalk.gray('Usage: ccm login --username <username> --password <password>'));
    process.exit(1);
  }

  try {
    console.log(chalk.gray(`Authenticating as ${username}...`));

    const response = await apiClient.login(username, password);

    if (!response.success) {
      console.log(chalk.red('❌ Login failed:'), response.error);
      
      if (response.status === 401) {
        console.log(chalk.gray('\n💡 Tips:'));
        console.log(chalk.gray('• Check your username and password'));
        console.log(chalk.gray('• Use your email address if you registered with one'));
        console.log(chalk.gray('• Register first with: ccm register'));
      }
      
      process.exit(1);
    }

    // Save authentication details
    const { user, token } = response.data;
    apiClient.saveAuth(token, user.username, user.api_key);

    console.log(chalk.green('✅ Login successful!'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.white(`User: ${chalk.cyan(user.username)}`));
    console.log(chalk.white(`Email: ${chalk.gray(user.email)}`));
    console.log(chalk.white(`API Key: ${chalk.gray(`${user.api_key.substring(0, 8)}...`)}`));
    
    console.log(chalk.blue('\n🎯 You can now:'));
    console.log(chalk.gray('• Publish commands: ccm publish'));
    console.log(chalk.gray('• Install commands: ccm install <command>'));
    console.log(chalk.gray('• Search commands: ccm search <query>'));

  } catch (error) {
    console.error(chalk.red('❌ Login failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function logout() {
  const apiClient = new ApiClient();

  if (!apiClient.isAuthenticated()) {
    console.log(chalk.yellow('⚠️  Not currently logged in'));
    return;
  }

  const username = apiClient.getUsername();
  apiClient.clearAuth();

  console.log(chalk.green(`✅ Logged out ${chalk.cyan(username)}`));
  console.log(chalk.gray('Authentication cleared from this device'));
}