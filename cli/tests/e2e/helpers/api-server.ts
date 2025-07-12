import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

export class TestApiServer {
  private process: ChildProcess | null = null;
  private port: number;
  private apiPath: string;

  constructor(port = 3333) {
    this.port = port;
    // Path to API directory relative to CLI tests
    this.apiPath = join(process.cwd(), '..', 'api');
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Starting test API server...');
      
      // Set test environment variables
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        PORT: this.port.toString(),
        JWT_SECRET: 'test-secret-key-for-e2e',
        LOG_LEVEL: 'info' // Keep info level to see startup messages
      };

      // Start the API server using npm run dev
      this.process = spawn('npm', ['run', 'dev'], {
        cwd: this.apiPath,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let started = false;

      // Wait for server to start
      this.process.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log('API stdout:', text); // Debug output
        
        // Look for server start message - check for either Fastify or our custom message
        if ((text.includes('CCM Registry API started successfully') || 
             text.includes('Server listening at') ||
             text.includes(`port: "${this.port}"`)) && !started) {
          started = true;
          console.log(`✅ Test API server started on port ${this.port}`);
          // Small delay to ensure server is fully ready
          setTimeout(() => resolve(), 1000);
        }
      });

      this.process.stderr?.on('data', (data) => {
        const text = data.toString();
        console.error('API server stderr:', text); // More detailed error logging
        // Don't reject immediately on stderr, some output might be warnings
      });

      this.process.on('error', (error) => {
        console.error('Failed to start API server:', error);
        if (!started) {
          reject(error);
        }
      });

      this.process.on('exit', (code) => {
        if (!started && code !== 0) {
          reject(new Error(`API server exited with code ${code}`));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!started) {
          this.stop();
          reject(new Error('API server start timeout'));
        }
      }, 10000);
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      console.log('Stopping test API server...');
      this.process.kill('SIGTERM');
      
      // Wait for process to exit
      await new Promise<void>((resolve) => {
        if (this.process) {
          this.process.on('exit', () => {
            console.log('✅ Test API server stopped');
            resolve();
          });
          
          // Force kill if it doesn't stop gracefully
          setTimeout(() => {
            if (this.process && !this.process.killed) {
              this.process.kill('SIGKILL');
              resolve();
            }
          }, 5000);
        } else {
          resolve();
        }
      });
      
      this.process = null;
    }
  }

  getBaseUrl(): string {
    return `http://localhost:${this.port}/api`;
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}