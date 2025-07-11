import chalk from 'chalk';
import { ApiClient } from '../utils/api-client.js';

interface RegisterOptions {
  username?: string;
  email?: string;
  password?: string;
}

export async function register(options: RegisterOptions = {}) {
  const apiClient = new ApiClient();

  console.log(chalk.blue('📝 Creating CCM Registry account...\n'));

  // Check if already authenticated
  if (apiClient.isAuthenticated()) {
    const currentUser = apiClient.getUsername();
    console.log(chalk.yellow(`⚠️  Already logged in as ${chalk.cyan(currentUser)}`));
    console.log(chalk.gray('Logout first with: ccm logout'));
    return;
  }

  let { username, email, password } = options;

  // Validate required fields
  if (!username) {
    console.log(chalk.red('❌ Username is required'));
    console.log(chalk.gray('Usage: ccm register --username <username> --email <email> --password <password>'));
    process.exit(1);
  }

  if (!email) {
    console.log(chalk.red('❌ Email is required'));
    console.log(chalk.gray('Usage: ccm register --username <username> --email <email> --password <password>'));
    process.exit(1);
  }

  if (!password) {
    console.log(chalk.red('❌ Password is required'));
    console.log(chalk.gray('Usage: ccm register --username <username> --email <email> --password <password>'));
    process.exit(1);
  }

  // Basic validation
  if (username.length < 3) {
    console.log(chalk.red('❌ Username must be at least 3 characters'));
    process.exit(1);
  }

  if (password.length < 8) {
    console.log(chalk.red('❌ Password must be at least 8 characters'));
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log(chalk.red('❌ Invalid email format'));
    process.exit(1);
  }

  try {
    console.log(chalk.gray(`Creating account for ${username}...`));

    const response = await apiClient.register(username, email, password);

    if (!response.success) {
      console.log(chalk.red('❌ Registration failed:'), response.error);
      
      if (response.status === 409) {
        console.log(chalk.gray('\n💡 Tips:'));
        console.log(chalk.gray('• Try a different username or email'));
        console.log(chalk.gray('• Login if you already have an account: ccm login'));
      }
      
      process.exit(1);
    }

    // Save authentication details
    const { user, token } = response.data;
    apiClient.saveAuth(token, user.username, user.api_key);

    console.log(chalk.green('✅ Account created successfully!'));
    console.log(chalk.gray('─'.repeat(45)));
    console.log(chalk.white(`Username: ${chalk.cyan(user.username)}`));
    console.log(chalk.white(`Email: ${chalk.gray(user.email)}`));
    console.log(chalk.white(`API Key: ${chalk.gray(`${user.api_key.substring(0, 8)}...`)}`));
    
    console.log(chalk.blue('\n🎯 You can now:'));
    console.log(chalk.gray('• Publish commands: ccm publish'));
    console.log(chalk.gray('• Install commands: ccm install <command>'));
    console.log(chalk.gray('• Search commands: ccm search <query>'));

    console.log(chalk.yellow('\n⚠️  Important:'));
    console.log(chalk.gray('• Keep your API key secure'));
    console.log(chalk.gray('• Regenerate it if compromised: ccm whoami --regenerate-key'));

  } catch (error) {
    console.error(chalk.red('❌ Registration failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}