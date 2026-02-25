import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors'; 
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import fs from 'fs'; 

import { errorHandler } from './middlewares/errorMiddleware.js';



import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js'; 
import rubricRoutes from './routes/rubricRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import approveRoutes from './routes/approveRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
dotenv.config();

const app = express();

// --- 1. Config __dirname สำหรับ ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// --- 2. Security & Base Middleware ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ แก้ไข: เพิ่ม 'PATCH' เข้าไปใน methods
app.use(cors({ 
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // 👈 เพิ่ม PATCH ตรงนี้แล้ว
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- 3. Static Files Setup ---
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📂 Created missing uploads directory at: ${uploadDir}`);
}

app.use('/uploads', express.static(uploadDir));

// --- 4. API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/rubrics', rubricRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/approve', approveRoutes);
app.use('/api/evaluations', evaluationRoutes);
// เพิ่มเติม: ถ้ามีโฟลเดอร์ pdf แยกต่างหาก
app.use('/uploads/pdf', express.static(path.join(__dirname, 'uploads', 'pdf')));

// Test Route
app.get("/", (req, res) => res.send("🚀 PRO-HUB API is running..."));

// --- 5. Error Handling ---
app.use(errorHandler);

// --- 6. Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});