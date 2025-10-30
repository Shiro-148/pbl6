-- Create database and users + user_profiles tables for registration testing
CREATE DATABASE IF NOT EXISTS pbl6_db;
USE pbl6_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  display_name VARCHAR(255),
  email VARCHAR(255),
  CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Example: insert a test user and profile
INSERT INTO users (username, password) VALUES ('testuser', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8mVfW6dIhTqK8/8XVl3V2Y1w4Y7V1K');
INSERT INTO user_profiles (user_id, display_name, email) VALUES (1, 'Test User', 'test@example.com');
