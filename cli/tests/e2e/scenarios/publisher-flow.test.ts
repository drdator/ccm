import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CliRunner } from '../helpers/cli-runner.js';
import { TempEnvironment } from '../helpers/temp-env.js';
import { apiServer } from '../setup.js';

describe('Publisher Workflow E2E', () => {
  let cli: CliRunner;
  let tempEnv: TempEnvironment;
  let tempHome: string;
  let projectDir: string;

  beforeEach(async () => {
    cli = new CliRunner();
    tempEnv = new TempEnvironment();
    
    // Create temporary home directory for test isolation
    tempHome = await tempEnv.createTempHome(apiServer.getBaseUrl());
    tempEnv.setTempHome(tempHome);
    
    // Create empty project directory (not pre-initialized)
    projectDir = await tempEnv.createTempDir('project-');
  });

  afterEach(async () => {
    await tempEnv.cleanup();
  });

  it('should complete full publisher workflow: register → init → publish → search', async () => {
    const username = tempEnv.getUniqueUsername('publisher');
    const email = tempEnv.getUniqueEmail(username);
    const password = tempEnv.getTestPassword();
    const projectName = tempEnv.getUniqueProjectName('test-command-package');

    // 1. Register and authenticate user
    const registerResult = await cli.register(username, email, password, {
      apiUrl: apiServer.getBaseUrl()
    });
    expect(registerResult.success).toBe(true);

    // 2. Initialize a new project
    const initResult = await cli.init(projectName, {
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });
    
    expect(initResult.success).toBe(true);
    expect(initResult.stdout).toContain('initialized') ||
    expect(initResult.stdout).toContain('created');

    // 2.5. Create a sample command file for publishing
    const { writeFileSync, mkdirSync } = await import('fs');
    const { join } = await import('path');
    
    const commandsDir = join(projectDir, 'commands');
    mkdirSync(commandsDir, { recursive: true });
    
    const sampleCommand = `# Hello Command

A simple hello command for testing.

## Usage
\`\`\`bash
hello [name]
\`\`\`

## Example
\`\`\`bash
hello world
# Output: Hello, world!
\`\`\`
`;
    
    writeFileSync(join(commandsDir, 'hello.md'), sampleCommand);

    // 3. Publish the project
    const publishResult = await cli.publish({
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });
    
    
    expect(publishResult.success).toBe(true);
    expect(publishResult.stdout).toContain('Command set published successfully');
    expect(publishResult.stdout).toContain(projectName);

    // 4. Search for the published command
    const searchResult = await cli.search(projectName, {
      apiUrl: apiServer.getBaseUrl()
    });
    expect(searchResult.success).toBe(true);
    expect(searchResult.stdout).toContain(projectName);
    expect(searchResult.stdout).toContain(username); // Should show the author
  });

  it('should prevent publishing without authentication', async () => {
    const projectName = tempEnv.getUniqueProjectName('unauthenticated-project');

    // Initialize a project without being logged in
    const initResult = await cli.init(projectName, {
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });
    expect(initResult.success).toBe(true);

    // Try to publish without authentication
    const publishResult = await cli.publish({
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });
    expect(publishResult.success).toBe(false);
    expect(publishResult.stdout).toContain('Authentication required');
  });

  it('should prevent publishing from directory without ccm.json', async () => {
    const username = tempEnv.getUniqueUsername('badpublisher');
    const email = tempEnv.getUniqueEmail(username);
    const password = tempEnv.getTestPassword();

    // Register user
    await cli.register(username, email, password, {
      apiUrl: apiServer.getBaseUrl()
    });

    // Try to publish from empty directory (projectDir is empty by default)
    const publishResult = await cli.publish({
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });
    expect(publishResult.success).toBe(false);
    expect(publishResult.stdout).toContain('Not in a CCM project');
  });

  it('should handle init with custom project settings', async () => {
    const projectName = tempEnv.getUniqueProjectName('custom-settings-project');
    const description = 'A custom test project with specific settings';

    // Initialize with custom description
    const initResult = await cli.run(['init', '-n', projectName, '-d', description, '-y'], {
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });

    expect(initResult.success).toBe(true);
    expect(initResult.stdout).toContain('CCM project initialized successfully');
    expect(initResult.stdout).toContain(projectName);
  });

  it('should allow republishing with version updates', async () => {
    const username = tempEnv.getUniqueUsername('republisher');
    const email = tempEnv.getUniqueEmail(username);
    const password = tempEnv.getTestPassword();
    const projectName = tempEnv.getUniqueProjectName('version-test-package');

    // Register user
    await cli.register(username, email, password, {
      apiUrl: apiServer.getBaseUrl()
    });

    // Initialize and publish first version
    await cli.init(projectName, {
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });

    // Create a sample command file
    const { writeFileSync, mkdirSync } = await import('fs');
    const { join } = await import('path');
    
    const commandsDir = join(projectDir, 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'version-test.md'), '# Version Test Command\n\nA test command for version management.');

    const firstPublish = await cli.publish({
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });
    expect(firstPublish.success).toBe(true);

    // Try to publish again (should handle version management)
    const secondPublish = await cli.publish({
      apiUrl: apiServer.getBaseUrl(),
      cwd: projectDir
    });
    
    // This might succeed with a version bump or fail with appropriate message
    if (!secondPublish.success) {
      expect(secondPublish.stdout).toContain('version');
    }
  });

  it('should search with various query parameters', async () => {
    // Test basic search (should work even without published packages)
    const searchResult = await cli.search('nonexistent-package-xyz', {
      apiUrl: apiServer.getBaseUrl()
    });
    expect(searchResult.success).toBe(true);
    // Should show no results or empty list
    expect(searchResult.stdout).toContain('No commands found');

    // Test search with limit
    const limitedSearchResult = await cli.run(['search', 'test', '--limit', '5'], {
      apiUrl: apiServer.getBaseUrl()
    });
    expect(limitedSearchResult.success).toBe(true);
  });
});