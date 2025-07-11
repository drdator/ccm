-- CCM Registry Database Schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  api_key VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create commands table
CREATE TABLE IF NOT EXISTS commands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  description TEXT,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  downloads INTEGER DEFAULT 0,
  published_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, version)
);

-- Create command_files table
CREATE TABLE IF NOT EXISTS command_files (
  id SERIAL PRIMARY KEY,
  command_id INTEGER REFERENCES commands(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  command_id INTEGER REFERENCES commands(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  UNIQUE(command_id, tag)
);

-- Create downloads table for tracking
CREATE TABLE IF NOT EXISTS downloads (
  id SERIAL PRIMARY KEY,
  command_id INTEGER REFERENCES commands(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMP DEFAULT NOW(),
  ip_address INET
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commands_name ON commands(name);
CREATE INDEX IF NOT EXISTS idx_commands_author ON commands(author_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
CREATE INDEX IF NOT EXISTS idx_downloads_command ON downloads(command_id);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commands_updated_at BEFORE UPDATE ON commands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();