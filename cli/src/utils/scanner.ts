import { glob } from 'glob';
import { join } from 'path';
import { readFileSync, existsSync, readdirSync, lstatSync } from 'fs';
import { Command, CommandFile } from '../types/command.js';
import { parseCommandFile } from './parser.js';

export async function scanCommands(options: { local?: boolean; installed?: boolean } = {}): Promise<Command[]> {
  const commands: Command[] = [];
  const scannedPaths = new Set<string>();

  // Determine which locations to scan
  const scanLocal = options.local || (!options.local && !options.installed);
  const scanInstalled = options.installed || (!options.local && !options.installed);

  // Scan for user-created commands (local to this project)
  if (scanLocal) {
    const localPath = join(process.cwd(), '.claude', 'commands');
    if (existsSync(localPath)) {
      const localCommands = await scanDirectory(localPath, 'local');
      localCommands.forEach(cmd => {
        if (!scannedPaths.has(cmd.name)) {
          commands.push(cmd);
          scannedPaths.add(cmd.name);
        }
      });
    }
  }

  // Scan for installed command packages
  if (scanInstalled) {
    const installedPath = join(process.cwd(), '.claude', 'installed');
    if (existsSync(installedPath)) {
      const installedCommands = await scanInstalledPackages(installedPath);
      installedCommands.forEach(cmd => {
        if (!scannedPaths.has(cmd.name)) {
          commands.push(cmd);
          scannedPaths.add(cmd.name);
        }
      });
    }
  }

  return commands;
}

async function scanDirectory(basePath: string, location: 'local' | 'installed'): Promise<Command[]> {
  const commands: Command[] = [];
  
  // Find all .md files in the directory (including subdirectories for namespacing)
  const pattern = join(basePath, '**/*.md');
  const files = await glob(pattern, { 
    nodir: true,
    absolute: true 
  });

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const metadata = parseCommandFile(content);
      
      // Extract command name from file path
      const relativePath = filePath.replace(basePath + '/', '');
      const name = relativePath.replace(/\.md$/, '').replace(/\//g, '/');

      commands.push({
        name,
        path: filePath,
        location,
        metadata: {
          ...metadata,
          name
        },
        content
      });
    } catch (error) {
      console.warn(`Warning: Failed to parse command file ${filePath}:`, error instanceof Error ? error.message : String(error));
    }
  }

  return commands;
}

async function scanInstalledPackages(installedPath: string): Promise<Command[]> {
  const commands: Command[] = [];
  
  try {
    const packageDirs = readdirSync(installedPath).filter(name => {
      const fullPath = join(installedPath, name);
      return lstatSync(fullPath).isDirectory() && name !== '.ccm-metadata.json';
    });

    for (const packageName of packageDirs) {
      const packagePath = join(installedPath, packageName);
      const packageCommands = await scanDirectory(packagePath, 'installed');
      
      // Add package namespace to command names
      packageCommands.forEach(cmd => {
        cmd.name = `${packageName}/${cmd.name}`;
        cmd.metadata.package = packageName;
      });
      
      commands.push(...packageCommands);
    }
  } catch (error) {
    console.warn(`Warning: Failed to scan installed packages:`, error instanceof Error ? error.message : String(error));
  }

  return commands;
}