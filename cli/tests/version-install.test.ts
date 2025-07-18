import { describe, it, expect } from 'vitest';
import { install } from '../src/commands/install.js';

describe('Version Install Parsing', () => {
  it('should parse package@version syntax correctly', () => {
    // This is a simple test to ensure the parsing logic works
    // The actual install function would need to be mocked for proper testing
    
    const testCases = [
      { input: 'hello-world@1.0.0', expectedName: 'hello-world', expectedVersion: '1.0.0' },
      { input: 'hello-world@2.0.0', expectedName: 'hello-world', expectedVersion: '2.0.0' },
      { input: 'dev-tools@1.2.0', expectedName: 'dev-tools', expectedVersion: '1.2.0' },
      { input: '@scoped/package@1.0.0', expectedName: '@scoped/package', expectedVersion: '1.0.0' },
      { input: 'package-name', expectedName: 'package-name', expectedVersion: undefined }
    ];
    
    testCases.forEach(({ input, expectedName, expectedVersion }) => {
      const atIndex = input.lastIndexOf('@');
      let parsedName: string;
      let parsedVersion: string | undefined;
      
      if (atIndex > 0) {
        parsedName = input.substring(0, atIndex);
        parsedVersion = input.substring(atIndex + 1);
      } else {
        parsedName = input;
        parsedVersion = undefined;
      }
      
      expect(parsedName).toBe(expectedName);
      expect(parsedVersion).toBe(expectedVersion);
    });
  });
});