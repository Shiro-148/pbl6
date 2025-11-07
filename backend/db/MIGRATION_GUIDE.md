# Database Migration Guide - Flashcards Table Restructure

## Thay đổi

Bảng `flashcards` đã được thiết kế lại với schema mới:

### Schema cũ:
- `id`, `front`, `back`, `set_id`

### Schema mới:
- `id`, `user_id`, `set_id`
- `word`, `definition`, `phonetic`, `example`, `type`, `audio`
- `created_at`, `updated_at`

## Cách migrate

### Bước 1: Backup dữ liệu cũ (nếu cần)

```sql
-- Tạo backup table
CREATE TABLE flashcards_backup AS SELECT * FROM flashcards;
```

### Bước 2: Chạy migration script

```sql
-- Trong MySQL client hoặc MySQL Workbench
source d:/PBL/pbl6/backend/db/flashcard-schema-new.sql;
```

Hoặc copy nội dung file `flashcard-schema-new.sql` và execute trong MySQL client.

### Bước 3: Verify migration

```sql
-- Kiểm tra cấu trúc bảng mới
DESCRIBE flashcards;

-- Kiểm tra sample data
SELECT * FROM flashcards LIMIT 5;
```

### Bước 4: Restart services

```powershell
# Backend
cd d:\PBL\pbl6\backend
.\gradlew bootRun

# Frontend sẽ tự reload nếu dev server đang chạy
```

## Lưu ý

- Script sẽ **XÓA** bảng `flashcards` cũ
- Sample data sẽ được insert vào set có `id=4`
- Nếu muốn migrate data cũ, cần viết script convert `front` → `word` và `back` → `definition`

## Rollback (nếu cần)

Nếu muốn quay lại schema cũ:

```sql
DROP TABLE flashcards;
RENAME TABLE flashcards_backup TO flashcards;
```
