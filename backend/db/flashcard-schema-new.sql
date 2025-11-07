-- Drop old flashcards table and recreate with new schema
USE pbl6_db;

-- Drop old table
DROP TABLE IF EXISTS flashcards;

-- Create new flashcards table
CREATE TABLE flashcards (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  set_id BIGINT NOT NULL,
  word VARCHAR(255) NOT NULL,
  definition TEXT,
  phonetic VARCHAR(100),
  example TEXT,
  type VARCHAR(50),
  audio VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_set_id (set_id),
  INDEX idx_word (word)
);

-- Sample data for testing
INSERT INTO flashcards (user_id, set_id, word, definition, phonetic, example, type, audio) VALUES
(1, 4, 'customresnet', 'Mạng ResNet tùy chỉnh cho deep learning', '/ˈkʌstəm ˈrɛznɛt/', 'We built a customresnet for image classification.', 'noun', NULL),
(1, 4, 'use', 'sử dụng, dùng', '/juːz/', 'You can use this tool to solve the problem.', 'verb', NULL),
(1, 4, 'is', 'là, thì', '/ɪz/', 'This is a flashcard application.', 'verb', NULL),
(1, 4, 'on', 'trên, bật', '/ɒn/', 'The light is on.', 'preposition', NULL);
