School Student Management System

A full-stack School Student Management System for managing student records efficiently. The application provides student CRUD operations, search, filtering, sorting, pagination, and data export features.

🚀 Features
Add new students
View all student records
Edit student details
Delete student records
Search students by ID or name
Filter students by class
Sort student records
Pagination
Student count dashboard
Form validation
Gender selection
Email and phone validation
Export student data to:
PDF
Excel
Word
REST API
MongoDB database integration
Responsive user interface
🛠️ Technologies Used
Frontend
HTML5
CSS3
JavaScript
Backend
Node.js
Express.js
REST API
Database
MongoDB
Mongoose
Other Tools
Git
GitHub
Postman
VS Code
jsPDF
ExcelJS
DOCX
📁 Project Structure
School-Student-Management-System/
│
├── backend/
│   ├── models/
│   │   └── Student.js
│   ├── routes/
│   │   └── studentRoutes.js
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── .gitignore
└── README.md
⚙️ Installation
1. Clone the Repository
git clone https://github.com/yourusername/School-Student-Management-System.git
2. Open the Project
cd School-Student-Management-System
3. Install Backend Dependencies
cd backend
npm install
🗄️ MongoDB Configuration

Make sure MongoDB is installed and running.

Create a .env file inside the backend folder:

MONGO_URI=mongodb://127.0.0.1:27017/school_management
▶️ Run the Backend

Inside the backend folder:

node server.js

The server will run at:

http://localhost:5000
🌐 Run the Frontend

Open:

frontend/index.html

in your browser.

The frontend communicates with the backend through:

http://localhost:5000/api/students
🔌 API Endpoints
Method	Endpoint	Description
POST	/api/students	Add a student
GET	/api/students	Get students
GET	/api/students/:id	Get one student
PUT	/api/students/:id	Update a student
DELETE	/api/students/:id	Delete a student
GET	/api/students/download/excel	Export Excel
GET	/api/students/download/word	Export Word
🧪 Testing

The API can be tested using Postman.

Example:

GET http://localhost:5000/api/students

Add a student using:

POST http://localhost:5000/api/students

Example JSON:

{
  "studentId": "STU001",
  "name": "Keerthivasan G",
  "age": 15,
  "gender": "Male",
  "className": "9",
  "section": "A",
  "email": "student@example.com",
  "phone": "9876543210",
  "address": "Salem, Tamil Nadu"
}
🔐 Security

Sensitive configuration such as MongoDB connection details should be stored in .env.

The .env file should not be uploaded to GitHub.

Example .gitignore:

node_modules/
.env
*.log
📊 Project Purpose

This project was developed to practice and demonstrate:

Frontend development
Backend development
REST API development
MongoDB database operations
CRUD operations
Form validation
API integration
Data export
Git and GitHub
👨‍💻 Author

Keerthivasan G

B.E. Computer Science and Engineering
Salem, Tamil Nadu, India

📄 License

This project is created for learning and educational purposes.