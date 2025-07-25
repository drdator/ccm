import { spawn } from 'child_process';
import { join } from 'path';

export interface CliRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface CliRunOptions {
  cwd?: string;            // Working directory
  env?: Record<string, string>; // Environment variables
  timeout?: number;        // Timeout in milliseconds (default: 10s)
  apiUrl?: string;         // API URL to use for testing
}

export class CliRunner {
  private cliPath: string;

  constructor() {
    // Path to CLI source - use tsx to run TypeScript directly
    this.cliPath = join(process.cwd(), 'src', 'cli.ts');
  }

  async run(args: string[], options: CliRunOptions = {}): Promise<CliRunResult> {
    const {
      cwd = process.cwd(),
      env = {},
      timeout = 10000,
      apiUrl
    } = options;

    return new Promise((resolve) => {
      // Environment variables for the CLI process
      const processEnv = {
        ...process.env,
        ...env,
        NODE_ENV: 'test',
        CCM_DEV: 'true', // Force development mode for tests
        ...(apiUrl && { CCM_REGISTRY_URL: apiUrl })
      };

      // Spawn the CLI process using tsx
      const child = spawn('npx', ['tsx', this.cliPath, ...args], {
        cwd,
        env: processEnv,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let finished = false;

      // Collect output
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process completion
      child.on('close', (code) => {
        if (!finished) {
          finished = true;
          resolve({
            stdout,
            stderr,
            exitCode: code || 0,
            success: (code || 0) === 0
          });
        }
      });

      child.on('error', (error) => {
        if (!finished) {
          finished = true;
          resolve({
            stdout,
            stderr: stderr + error.message,
            exitCode: 1,
            success: false
          });
        }
      });

      // Close stdin immediately since we're using command-line arguments
      child.stdin?.end();

      // Set timeout
      setTimeout(() => {
        if (!finished) {
          finished = true;
          child.kill('SIGTERM');
          resolve({
            stdout,
            stderr: stderr + '\\nProcess timed out',
            exitCode: 124, // Standard timeout exit code
            success: false
          });
        }
      }, timeout);
    });
  }

  // Helper methods for common commands
  async register(username: string, email: string, password: string, options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['register', '-u', username, '-e', email, '-p', password], options);
  }

  async login(username: string, password: string, options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['login', '-u', username, '-p', password], options);
  }

  async loginForce(username: string, password: string, options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['login', '-u', username, '-p', password, '-f'], options);
  }

  async logout(options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['logout'], options);
  }

  async init(projectName: string, options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['init', '-n', projectName, '-d', 'Test project', '-y'], options);
  }

  async publish(options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['publish'], options);
  }

  async search(query: string, options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['search', query], options);
  }

  async install(command?: string, options: CliRunOptions = {}): Promise<CliRunResult> {
    const args = command ? ['install', command] : ['install'];
    return this.run(args, options);
  }

  async list(options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['list'], options);
  }

  async config(configOptions: string[] = [], options: CliRunOptions = {}): Promise<CliRunResult> {
    return this.run(['config', ...configOptions], options);
  }
}