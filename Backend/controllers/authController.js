import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// --- ฟังก์ชันลงทะเบียน (Register) ---
export const register = async (req, res) => {
  const { 
    email, password, full_name, role, 
    student_id, student_level, student_group, staff_key 
  } = req.body;

  try {
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้ไปแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (
        email, password, full_name, role, 
        student_id, student_level, student_group
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        email, 
        hashedPassword, 
        full_name, 
        role, 
        student_id || null,
        student_level || null,
        student_group || null
      ]
    );

    res.status(201).json({ status: "success", message: "ลงทะเบียนสำเร็จ" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: " + err.message });
  }
};

// --- ฟังก์ชันเข้าสู่ระบบ (Login - ใช้ JWT) ---
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
        }

        // 💡 แก้ไข SQL: เช็คทั้งอีเมล และต้องมีสถานะเป็น active เท่านั้น
        const userQuery = await pool.query(
            'SELECT * FROM users WHERE email = $1', 
            [email]
        );

        const user = userQuery.rows[0];

        // 1. เช็คว่ามีผู้ใช้ไหม และรหัสผ่านถูกต้องไหม
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        // 💡 2. เพิ่มการเช็คสถานะ: ถ้าเป็น inactive ให้ปฏิเสธการเข้าสู่ระบบ
        if (user.status === 'inactive') {
            return res.status(403).json({ 
                status: "error",
                message: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" 
            });
        }

        // ✅ สร้าง JWT Token (โค้ดเดิมของคุณ)
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '1h' }
        );

        // ✅ ส่ง Token ผ่าน HTTP-Only Cookie (โค้ดเดิมของคุณ)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000 
        });

        res.json({ 
            status: "success", 
            message: "เข้าสู่ระบบสำเร็จ",
            token,
            user: {
                id : user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name
            }
        });

    } catch (err) {
        console.error("DEBUG LOGIN ERROR:", err.message);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
    }
};

// --- ฟังก์ชันรีเซ็ตรหัสผ่าน (Reset Password) ---
export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body; 

    try {
        const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
        }

        if (newPassword.length < 5) {
            return res.status(400).json({ message: "รหัสผ่านใหม่สั้นเกินไป" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE users SET password = $1 WHERE email = $2',
            [hashedPassword, email]
        );

        res.json({ 
            status: "success", 
            message: "รีเซ็ตรหัสผ่านสำเร็จ" 
        });

    } catch (err) {
        console.error("❌ SQL Error:", err.message); 
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: " + err.message });
    }
};

// --- ฟังก์ชันออกจากระบบ (Logout - ลบ JWT Cookie) ---
export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
    });
    res.status(200).json({ status: "success", message: "ออกจากระบบเรียบร้อยแล้ว" });
};
