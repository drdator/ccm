import { Router } from 'express';
import { CommandModel } from '../models/Command.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { parseCommandYaml } from '../utils/validation.js';

const router = Router();

// List all commands
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const commands = await CommandModel.list(limit, offset);
    
    // Add tags to each command
    const commandsWithTags = await Promise.all(
      commands.map(async (cmd) => ({
        ...cmd,
        tags: await CommandModel.getTags(cmd.id)
      }))
    );
    
    res.json({
      commands: commandsWithTags,
      pagination: {
        limit,
        offset,
        total: commandsWithTags.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Search commands
router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      throw new ApiError(400, 'Search query required');
    }
    
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const commands = await CommandModel.search(query, limit, offset);
    
    // Add tags to each command
    const commandsWithTags = await Promise.all(
      commands.map(async (cmd) => ({
        ...cmd,
        tags: await CommandModel.getTags(cmd.id)
      }))
    );
    
    res.json({
      commands: commandsWithTags,
      query,
      pagination: {
        limit,
        offset,
        total: commandsWithTags.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get specific command
router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { version } = req.query;
    
    const command = await CommandModel.findByName(name, version as string);
    if (!command) {
      throw new ApiError(404, 'Command not found');
    }
    
    const tags = await CommandModel.getTags(command.id);
    
    res.json({
      command: {
        ...command,
        tags
      }
    });
  } catch (error) {
    next(error);
  }
});

// Download command files
router.get('/:name/download', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { version } = req.query;
    
    const command = await CommandModel.findByName(name, version as string);
    if (!command) {
      throw new ApiError(404, 'Command not found');
    }
    
    // Get files
    const files = await CommandModel.getFiles(command.id);
    const tags = await CommandModel.getTags(command.id);
    
    // Track download
    const ipAddress = req.ip;
    const userId = (req as AuthRequest).user?.id;
    await CommandModel.incrementDownloads(command.id, userId, ipAddress);
    
    res.json({
      name: command.name,
      version: command.version,
      description: command.description,
      author_id: command.author_id,
      tags,
      files: files.map(f => ({
        filename: f.filename,
        content: f.content
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Publish new command
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Validate command package
    const { metadata, files } = req.body;
    
    if (!metadata || !files || !Array.isArray(files)) {
      throw new ApiError(400, 'Invalid command package format');
    }
    
    // Parse and validate metadata
    const { name, version, description, tags } = parseCommandYaml(metadata);
    
    if (!name || !version) {
      throw new ApiError(400, 'Command name and version are required');
    }
    
    // Check if command version already exists
    const existing = await CommandModel.findByName(name, version);
    if (existing) {
      throw new ApiError(409, `Command ${name}@${version} already exists`);
    }
    
    // Validate files
    if (files.length === 0) {
      throw new ApiError(400, 'At least one command file is required');
    }
    
    for (const file of files) {
      if (!file.filename || !file.content) {
        throw new ApiError(400, 'Each file must have filename and content');
      }
      if (!file.filename.endsWith('.md')) {
        throw new ApiError(400, 'Command files must be Markdown (.md) files');
      }
    }
    
    // Create command
    const command = await CommandModel.create(
      name,
      version,
      description || '',
      userId,
      files
    );
    
    // Add tags if provided
    if (tags && Array.isArray(tags)) {
      await CommandModel.addTags(command.id, tags);
    }
    
    res.status(201).json({
      message: 'Command published successfully',
      command: {
        ...command,
        tags: tags || []
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;