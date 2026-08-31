# 📚 Project Management System for Student Projects

ระบบจัดการโครงงานนักศึกษา (**Student Project Management System**) สำหรับ

- นักศึกษาอัปโหลดโครงงาน
- อาจารย์ตรวจสอบและประเมิน
- ผู้ดูแลระบบจัดการผู้ใช้งาน

ระบบถูกพัฒนาด้วย **React + Node.js + PostgreSQL** เพื่อรองรับการจัดการโครงงานในสถาบันการศึกษา

---

# 🚀 Features

✨ ระบบมีฟังก์ชันหลักดังนี้

## 👨‍🎓 Student

- สมัครสมาชิก / เข้าสู่ระบบ
- ส่งโครงงาน
- ดูสถานะโครงงาน
- แก้ไขข้อมูลโปรไฟล์
- ดูคลังโครงงาน (Project Archive)

## 👨‍🏫 Admin / Instructor

- อนุมัติโครงงาน
- ประเมินโครงงาน
- จัดการผู้ใช้งาน
- ดู Dashboard สถิติ

---

# 🧰 Tech Stack

## Frontend

- ⚛️ React 19
- ⚡ Vite
- 🎨 TailwindCSS
- 🧩 Ant Design
- 📊 Recharts
- 🔐 JWT Decode
- 📡 Axios

## Backend

- 🟢 Node.js
- 🚀 Express.js
- 🔑 JSON Web Token (JWT)
- 🔒 bcryptjs
- 🍪 Cookie Parser
- 🌐 CORS

## Database

- 🐘 PostgreSQL
- pgAdmin

## Server Environment

- aaPanel
- Nginx
- Apache
- PHP
- Firewall / Security Tools

---

# 📂 Project Structure

```
StudentProject
│
├── Backend
│   ├── server.js
│   ├── routes
│   ├── controllers
│   ├── middleware
│   └── database
│
├── Frontend
│   ├── src
│   │   ├── Adminpage
│   │   ├── StudentPage
│   │   ├── Page
│   │   ├── services
│   │   └── components
│   │
│   └── vite.config.js
│
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/ThisPick/PDJ-CT.git
```

```bash
cd StudentProject
```

---

# 🖥️ Run Frontend

เข้าโฟลเดอร์ Frontend

```bash
cd Frontend
```

ติดตั้ง package

```bash
npm install
```

รันโปรเจกต์

```bash
npm run dev
```

Frontend จะรันที่

```
http://localhost:5173
```

---

# ⚙️ Run Backend

เข้าโฟลเดอร์ Backend

```bash
cd Backend
```

ติดตั้ง package

```bash
npm install
```

รันเซิร์ฟเวอร์

```bash
npm run dev
```

หรือ

```bash
npm start
```

Backend จะรันที่

```
http://localhost:5000
```

---

# 🗄️ Database Setup

ระบบใช้ฐานข้อมูล **PostgreSQL**

เครื่องมือที่ใช้จัดการฐานข้อมูล

- pgAdmin
- PostgreSQL

ตั้งค่าไฟล์ `.env`

```
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=studentproject
DB_PORT=5432
JWT_SECRET=yoursecret
```

---

# 🔐 Security

ระบบมีการใช้

- JWT Authentication
- Password Hashing (bcrypt)
- CORS Protection
- Cookie Parser

Server Security ผ่าน

- Nginx
- Apache
- aaPanel Firewall
- Anti-Intrusion

---

# 📊 Libraries Used

## Frontend

- React
- React Router DOM
- Axios
- Ant Design
- TailwindCSS
- Recharts
- SweetAlert2
- Lucide React

## Backend

- Express
- jsonwebtoken
- bcryptjs
- cors
- dotenv
- pg

---

# 👨‍💻 Developer

Project by

**Student Project System**

Developed for educational purposes.

---

# 📌 Repository

GitHub

```
https://github.com/ThisPick/PDJ-CT
```
