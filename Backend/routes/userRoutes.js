import express from 'express';
import multer from 'multer'; // ต้องมีเพื่อเช็ก Error Instance
import { getAllUsers, getProfile, updateProfile, deleteUser } from '../controllers/userController.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/all', getAllUsers);
router.get('/profile/:id', getProfile);

// Route อัปเดตโปรไฟล์ (ใช้ PUT ตามที่ Frontend เรียก)
router.put('/update-profile/:id', (req, res, next) => {
    upload.single('profile_img')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: "ไฟล์ใหญ่เกิน 2MB หรือเกิดข้อผิดพลาดในการอัปโหลด" });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, updateProfile);

router.delete('/:id', deleteUser);

export default router;