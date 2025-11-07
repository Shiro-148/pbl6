-- DB schema for Chat & Vocabulary features
-- Use with your preferred RDBMS. This file shows a portable SQL schema.

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255),
  password_hash VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vocabulary master table
CREATE TABLE IF NOT EXISTS vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word VARCHAR(200) NOT NULL,
  definition_en TEXT,
  definition_local TEXT,
  examples TEXT, -- JSON array of example sentences
  level VARCHAR(16), -- easy/medium/hard
  source VARCHAR(100), -- e.g. 'model_service', 'user', 'import'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(word)
);

-- User-specific vocabulary / progress (spaced repetition fields)
CREATE TABLE IF NOT EXISTS user_vocab (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  vocab_id INTEGER NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_reviewed DATETIME,
  efactor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 0, -- days
  repetitions INTEGER DEFAULT 0,
  next_review DATETIME,
  notes TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(vocab_id) REFERENCES vocabulary(id)
);

-- Chat sessions (group messages into sessions)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  role VARCHAR(16), -- 'user' or 'ai' or 'system'
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
);

-- Indexes to speed common queries
CREATE INDEX IF NOT EXISTS idx_user_vocab_user ON user_vocab(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_word ON vocabulary(word);
CREATE INDEX IF NOT EXISTS idx_chat_session_user ON chat_sessions(user_id);

-- Example migration notes:
-- - When importing existing vocabulary, insert into vocabulary then user_vocab to mark as added for a user.
-- - chat_messages can be archived or pruned for long-term storage.

