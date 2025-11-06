Setup and test JWT authentication locally

1) Create database and table (MySQL):

-- from Windows PowerShell (adjust user/password as needed)
# mysql -u root -p < backend\db\db-init.sql

2) Run backend:
# cd backend
# .\gradlew.bat bootRun

3) Test login (curl):
# curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"testuser","password":"password"}'

You should receive a JSON {"token":"..."}

4) Frontend: set VITE_API_BASE in .env to http://localhost:8080 and run dev server in frontend
# cd frontend
# npm install
# npm run dev

Note: The bcrypt hash in db/db-init.sql is an example and may not match your environment. Replace with a hash produced by BCrypt for the desired password if needed.
