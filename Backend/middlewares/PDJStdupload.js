import multer from 'multer'; // เปลี่ยน const ... require เป็น import
import path from 'path';
import fs from 'fs';

// ตรวจสอบว่ามีโฟลเดอร์สำหรับเก็บไฟล์หรือยัง ถ้าไม่มีให้สร้าง
const uploadDir = 'uploads/pdf/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. การตั้งค่าการเก็บรักษาไฟล์ (Storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // ระบุ Folder ที่เก็บไฟล์
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อใหม่: std-proj-[timestamp]-[random].pdf
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `std-proj-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 2. การกรองไฟล์ (File Filter)
const fileFilter = (req, file, cb) => {
    // ยอมรับเฉพาะไฟล์ PDF เท่านั้น
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF is allowed!'), false);
    }
};

// 3. เริ่มต้นใช้งาน Multer
const pdjStdUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // จำกัดขนาดไว้ที่ 20MB
    }
});

// ✅ สำคัญที่สุด: ต้องใช้ export default เพื่อให้ไฟล์อื่น import ไปใช้ได้
export default pdjStdUpload;