-- Insert test data for folders and sets
USE pbl6_db;

-- Insert test folders if not exist
INSERT IGNORE INTO folders (id, name) VALUES 
(1, 'Toán'),
(2, 'Vật lý'), 
(3, 'Tiếng Anh'),
(4, 'Lịch sử'),
(5, 'Hóa học');

-- Insert test flashcard sets
INSERT IGNORE INTO flashcard_sets (id, title, description, folder_id) VALUES
(1, 'Đại số cơ bản', 'Các khái niệm đại số cơ bản', 1),
(2, 'Hình học phẳng', 'Các định lý hình học phẳng', 1),
(3, 'Cơ học Newton', 'Các định luật Newton và ứng dụng', 2),
(4, 'Basic English Vocabulary', 'Common English words for beginners', 3),
(5, 'English Grammar', 'Essential grammar rules', 3),
(6, 'Lịch sử Việt Nam', 'Các sự kiện lịch sử quan trọng', 4);

-- Insert some test flashcards
INSERT IGNORE INTO flashcards (id, front, back, set_id) VALUES
-- Đại số cơ bản
(1, '2x + 3 = 7, x = ?', 'x = 2', 1),
(2, '(a + b)² = ?', 'a² + 2ab + b²', 1),
(3, 'Phương trình bậc 2 có dạng', 'ax² + bx + c = 0', 1),

-- Hình học phẳng  
(4, 'Định lý Pythagoras', 'a² + b² = c²', 2),
(5, 'Diện tích tam giác', 'S = (1/2) × đáy × chiều cao', 2),

-- Cơ học Newton
(6, 'Định luật I Newton', 'Mọi vật đều có xu hướng duy trì trạng thái nghỉ hoặc chuyển động thẳng đều', 3),
(7, 'F = ma là biểu thức của', 'Định luật II Newton', 3),

-- Basic English
(8, 'Hello', 'Xin chào', 4),
(9, 'Thank you', 'Cảm ơn', 4),
(10, 'Good morning', 'Chào buổi sáng', 4),

-- English Grammar
(11, 'Present Simple tense structure', 'Subject + Verb (s/es) + Object', 5),
(12, 'Past tense of "go"', 'went', 5),

-- Lịch sử Việt Nam
(13, 'Năm thành lập nước Việt Nam Dân chủ Cộng hòa', '1945', 6),
(14, 'Cuộc kháng chiến chống Pháp kết thúc năm nào?', '1954', 6);