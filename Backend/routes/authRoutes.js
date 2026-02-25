import express from 'express';
import { login, register,logout } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { resetPassword } from '../controllers/authController.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // เพิ่มเส้นทางสำหรับการ Logout
router.put('/reset-password', resetPassword); //รีเซ็ตรหัส
router.get('/me', protect, (req, res) => {
    res.json({ loggedIn: true, user: req.user });
});

export default router;