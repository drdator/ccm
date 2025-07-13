import chalk from 'chalk';
import inquirer from 'inquirer';
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

  // Get registration details using secure prompts if not provided
  const questions = [];
  
  if (!username) {
    questions.push({
      type: 'input',
      name: 'username',
      message: 'Username (3+ characters):',
      validate: (input: string) => {
        const trimmed = input.trim();
        if (trimmed.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return 'Username can only contain letters, numbers, underscores, and hyphens';
        return true;
      }
    });
  }
  
  if (!email) {
    questions.push({
      type: 'input',
      name: 'email',
      message: 'Email address:',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.trim())) return 'Please enter a valid email address';
        return true;
      }
    });
  }
  
  if (!password) {
    questions.push({
      type: 'password',
      name: 'password',
      message: 'Password (8+ characters with uppercase, lowercase, number, special char):',
      mask: '*',
      validate: (input: string) => {
        if (input.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])/.test(input)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(input)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(input)) return 'Password must contain at least one number';
        if (!/(?=.*[@$!%*?&])/.test(input)) return 'Password must contain at least one special character (@$!%*?&)';
        return true;
      }
    });
  }

  if (questions.length > 0) {
    const answers = await inquirer.prompt(questions as any);
    username = username || answers.username;
    email = email || answers.email;
    password = password || answers.password;
  }

  // Final validation for command-line provided values
  if (username && username.length < 3) {
    console.log(chalk.red('❌ Username must be at least 3 characters'));
    process.exit(1);
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(chalk.red('❌ Invalid email format'));
      process.exit(1);
    }
  }

  if (password && password.length < 8) {
    console.log(chalk.red('❌ Password must be at least 8 characters and meet complexity requirements'));
    process.exit(1);
  }

  try {
    console.log(chalk.gray(`Creating account for ${username!}...`));

    const response = await apiClient.register(username!, email!, password!);

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
    apiClient.saveAuth(token, user.username);

    console.log(chalk.green('✅ Account created successfully!'));
    console.log(chalk.gray('─'.repeat(45)));
    console.log(chalk.white(`Username: ${chalk.cyan(user.username)}`));
    console.log(chalk.white(`Email: ${chalk.gray(user.email)}`));
    
    console.log(chalk.blue('\n🎯 You can now:'));
    console.log(chalk.gray('• Publish commands: ccm publish'));
    console.log(chalk.gray('• Install commands: ccm install <command>'));
    console.log(chalk.gray('• Search commands: ccm search <query>'));

    console.log(chalk.yellow('\n⚠️  Important:'));
    console.log(chalk.gray('• Your session token is now saved locally'));
    console.log(chalk.gray('• Use ccm logout to clear your session'));

  } catch (error) {
    console.error(chalk.red('❌ Registration failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}