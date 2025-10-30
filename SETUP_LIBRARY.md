## Setup Database cho Folder & Sets System

### 1. Chạy MySQL và tạo database
```sql
mysql -u root -p
```

### 2. Chạy các script theo thứ tự:
```sql
-- 1. Tạo tables và user cơ bản
source c:/Users/Asus/Desktop/PBL/pbl6-main/pbl6-main/backend/db/registration-init.sql

-- 2. Thêm test data (folders, sets, cards)
source c:/Users/Asus/Desktop/PBL/pbl6-main/pbl6-main/backend/db/test-data-init.sql
```

### 3. Kiểm tra dữ liệu
```sql
USE pbl6_db;
SELECT * FROM folders;
SELECT * FROM flashcard_sets;
SELECT * FROM flashcards;
```

### 4. Chạy các services
1. **Backend:** `cd backend && ./gradlew bootRun` (port 8080)
2. **Model Service:** `cd model_service && python app.py` (port 5000)  
3. **Frontend:** `cd frontend && npm run dev` (port 5173)

### 5. Test tính năng mới
- Truy cập: http://localhost:5173/library
- Click vào folder bất kỳ → hiển thị sets thuộc folder đó
- Dropdown folder trong create-flashcard load từ database
- Có thể tạo folder mới bằng nút "+ Tạo folder"

### 6. API Endpoints mới
- `GET /api/folders` - Lấy danh sách folders
- `GET /api/sets?folderId=X` - Lấy sets theo folder
- `POST /api/folders` - Tạo folder mới
- `POST /api/sets` - Tạo set (với folderId optional)

### 7. Test Data included:
- **5 folders:** Toán, Vật lý, Tiếng Anh, Lịch sử, Hóa học
- **6 sets:** 2 sets Toán, 1 set Vật lý, 2 sets Tiếng Anh, 1 set Lịch sử
- **14 flashcards** trong các sets