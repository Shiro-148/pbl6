-- Create database and users table for testing
CREATE DATABASE IF NOT EXISTS pbl6_db;
USE pbl6_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- Insert a test user: username=testuser, password=password
-- Password is bcrypt hashed. Replace with your own hash if needed.
INSERT INTO users (username, password) VALUES ('testuser', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8mVfW6dIhTqK8/8XVl3V2Y1w4Y7V1K');
