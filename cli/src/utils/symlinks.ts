import { symlinkSync, unlinkSync, existsSync, lstatSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { platform } from 'os';

export interface SymlinkResult {
  success: boolean;
  error?: string;
}

export class SymlinkManager {
  
  /**
   * Create a symlink from source to target
   * Falls back to copying on Windows if symlinks fail
   */
  static createSymlink(source: string, target: string): SymlinkResult {
    try {
      // Ensure target directory exists
      const targetDir = dirname(target);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      // Remove existing target if it exists
      if (existsSync(target)) {
        unlinkSync(target);
      }

      // Try to create symlink
      if (platform() === 'win32') {
        // On Windows, try junction first, then copy as fallback
        try {
          symlinkSync(source, target, 'junction');
          return { success: true };
        } catch (error) {
          // Fallback to copying the file
          return this.copyFile(source, target);
        }
      } else {
        // On Unix-like systems, create regular symlink
        const relativePath = relative(dirname(target), source);
        symlinkSync(relativePath, target);
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Try copying as fallback
      if (!errorMessage.includes('EACCES')) {
        const copyResult = this.copyFile(source, target);
        if (copyResult.success) {
          return copyResult;
        }
      }
      
      return {
        success: false,
        error: `Failed to create symlink: ${errorMessage}`
      };
    }
  }

  /**
   * Copy file or directory as fallback when symlinks fail
   */
  private static copyFile(source: string, target: string): SymlinkResult {
    try {
      const sourceStats = lstatSync(source);
      
      if (sourceStats.isDirectory()) {
        // Copy directory recursively
        return this.copyDirectory(source, target);
      } else {
        // Copy single file
        const content = readFileSync(source, 'utf-8');
        writeFileSync(target, content);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to copy: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Copy directory recursively
   */
  private static copyDirectory(source: string, target: string): SymlinkResult {
    try {
      // Create target directory
      if (!existsSync(target)) {
        mkdirSync(target, { recursive: true });
      }

      // Read source directory
      const files = readdirSync(source);
      
      // Copy each file/subdirectory
      for (const file of files) {
        const sourcePath = join(source, file);
        const targetPath = join(target, file);
        const stats = lstatSync(sourcePath);
        
        if (stats.isDirectory()) {
          this.copyDirectory(sourcePath, targetPath);
        } else {
          const content = readFileSync(sourcePath, 'utf-8');
          writeFileSync(targetPath, content);
        }
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to copy directory: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Remove a symlink or copied file
   */
  static removeSymlink(target: string): SymlinkResult {
    try {
      if (existsSync(target)) {
        unlinkSync(target);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove symlink: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Check if a path is a symlink
   */
  static isSymlink(path: string): boolean {
    try {
      if (!existsSync(path)) {
        return false;
      }
      return lstatSync(path).isSymbolicLink();
    } catch {
      return false;
    }
  }

  /**
   * Get the target of a symlink
   */
  static getSymlinkTarget(path: string): string | null {
    try {
      if (this.isSymlink(path)) {
        return readFileSync(path, 'utf-8');
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a file was installed by CCM (either symlink or copy)
   */
  static isInstalledFile(commandsPath: string, installedPath: string): boolean {
    if (!existsSync(commandsPath)) {
      return false;
    }

    // Check if it's a symlink pointing to installed directory
    if (this.isSymlink(commandsPath)) {
      const target = this.getSymlinkTarget(commandsPath);
      return target ? target.includes('/installed/') : false;
    }

    // Check if corresponding file exists in installed directory
    const filename = commandsPath.split('/').pop();
    const expectedInstalledPath = join(installedPath, filename || '');
    return existsSync(expectedInstalledPath);
  }
}