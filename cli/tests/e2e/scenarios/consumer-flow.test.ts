import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CliRunner } from '../helpers/cli-runner.js';
import { TempEnvironment } from '../helpers/temp-env.js';
import { apiServer } from '../setup.js';

describe('Consumer Workflow E2E', () => {
  let cli: CliRunner;
  let tempEnv: TempEnvironment;
  let tempHome: string;
  let consumerDir: string;

  beforeEach(async () => {
    cli = new CliRunner();
    tempEnv = new TempEnvironment();
    
    // Create temporary home directory for test isolation
    tempHome = await tempEnv.createTempHome(apiServer.getBaseUrl());
    tempEnv.setTempHome(tempHome);
    
    // Create temporary consumer directory
    consumerDir = await tempEnv.createTempConsumer();
  });

  afterEach(async () => {
    await tempEnv.cleanup();
  });

  it('should complete full consumer workflow: register → search → install → list', async () => {
    const username = tempEnv.getUniqueUsername('consumer');
    const email = tempEnv.getUniqueEmail(username);
    const password = tempEnv.getTestPassword();

    // 1. Register and authenticate user
    const registerResult = await cli.register(username, email, password, {
      apiUrl: apiServer.getBaseUrl()
    });
    expect(registerResult.success).toBe(true);

    // 2. Search for available commands
    const searchResult = await cli.search('test', {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    expect(searchResult.success).toBe(true);
    // Should show search interface even if no results

    // 3. List installed commands (should be empty initially)
    const initialListResult = await cli.list({
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    expect(initialListResult.success).toBe(true);
    // Should indicate no commands installed or show empty list

    // 4. Try to install a command (this might fail if no commands exist, which is expected)
    const installResult = await cli.install('nonexistent-command', {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    // This is expected to fail for nonexistent commands
    if (!installResult.success) {
      expect(installResult.stdout).toContain('not found') || 
      expect(installResult.stdout).toContain('error') ||
      expect(installResult.stdout).toContain('failed');
    }
  });

  it('should handle install without authentication', async () => {
    // Try to install without being logged in
    const installResult = await cli.install('some-command', {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    
    // Install should fail for nonexistent command but not require auth
    expect(installResult.success).toBe(false);
    expect(installResult.stdout).toContain('not found');
  });

  it('should handle list commands in different modes', async () => {
    const username = tempEnv.getUniqueUsername('lister');
    const email = tempEnv.getUniqueEmail(username);
    const password = tempEnv.getTestPassword();

    // Register user
    await cli.register(username, email, password, {
      apiUrl: apiServer.getBaseUrl()
    });

    // Test list with different options
    const localListResult = await cli.run(['list', '--local'], {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    expect(localListResult.success).toBe(true);

    const installedListResult = await cli.run(['list', '--installed'], {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    expect(installedListResult.success).toBe(true);

    // Test list alias
    const aliasListResult = await cli.run(['ls'], {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    expect(aliasListResult.success).toBe(true);
  });

  it('should handle install with specific version', async () => {
    const username = tempEnv.getUniqueUsername('versioner');
    const email = tempEnv.getUniqueEmail(username);
    const password = tempEnv.getTestPassword();

    // Register user
    await cli.register(username, email, password, {
      apiUrl: apiServer.getBaseUrl()
    });

    // Try to install with specific version
    const versionInstallResult = await cli.run(['install', 'some-command', '--version', '1.0.0'], {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    
    // Expected to fail for nonexistent command, but should handle version flag
    if (!versionInstallResult.success) {
      expect(versionInstallResult.stdout).toContain('not found') ||
      expect(versionInstallResult.stdout).toContain('error');
    }
  });

  it('should handle force reinstall', async () => {
    const username = tempEnv.getUniqueUsername('forcer');
    const email = tempEnv.getUniqueEmail(username);
    const password = tempEnv.getTestPassword();

    // Register user
    await cli.register(username, email, password, {
      apiUrl: apiServer.getBaseUrl()
    });

    // Try force install
    const forceInstallResult = await cli.run(['install', 'some-command', '--force'], {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    
    // Expected to fail for nonexistent command, but should handle force flag
    if (!forceInstallResult.success) {
      expect(forceInstallResult.stdout).toContain('not found') ||
      expect(forceInstallResult.stdout).toContain('error');
    }
  });

  it('should handle install without specifying command (bulk install)', async () => {
    const username = tempEnv.getUniqueUsername('bulker');
    const email = tempEnv.getUniqueEmail(username);
    const password = tempEnv.getTestPassword();

    // Register user
    await cli.register(username, email, password, {
      apiUrl: apiServer.getBaseUrl()
    });

    // Try bulk install (install all dependencies from ccm.json)
    const bulkInstallResult = await cli.install(undefined, {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    
    expect(bulkInstallResult.success).toBe(true);
    // Should either install dependencies or show that there are none
  });

  it('should provide helpful search functionality', async () => {
    // Test search with tags
    const tagSearchResult = await cli.run(['search', 'test', '--tags', 'utility,helper'], {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    expect(tagSearchResult.success).toBe(true);

    // Test search with limit and offset
    const paginatedSearchResult = await cli.run(['search', 'command', '--limit', '10', '--offset', '5'], {
      apiUrl: apiServer.getBaseUrl(),
      cwd: consumerDir
    });
    expect(paginatedSearchResult.success).toBe(true);
  });
});