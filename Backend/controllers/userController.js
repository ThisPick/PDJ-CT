import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt'; // ⚠️ อย่าลืมรันคำสั่ง npm install bcrypt ในโฟลเดอร์หลังบ้านด้วยนะครับ

export const getAllUsers = async (req, res) => {
    try {
        const sql = `SELECT id, role, full_name, student_id, student_level, student_group, 
                     email, phone, profile_img, status FROM users ORDER BY id ASC`;
        const result = await pool.query(sql);
        res.status(200).json({ success: true, count: result.rowCount, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProfile = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: "ID ไม่ถูกต้อง" });
    }
    try {
        const sql = `SELECT id, full_name, email, role, phone, profile_img, 
                     student_id, student_level, student_group, status 
                     FROM users WHERE id = $1`;
        const result = await pool.query(sql, [parseInt(id)]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    const { id } = req.params;
    const { 
        full_name, email, phone, role, 
        student_id, student_level, student_group, 
        password, status 
    } = req.body;
    
    const profile_img = req.file ? req.file.filename : null;

    try {
        // 1. จัดการลบรูปภาพเก่า (ใส่ try-catch แยกเพื่อไม่ให้โปรแกรมค้างถ้าลบไม่ได้)
        if (profile_img) {
            try {
                const oldUser = await pool.query('SELECT profile_img FROM users WHERE id = $1', [id]);
                const oldFile = oldUser.rows[0]?.profile_img;
                if (oldFile) {
                    const oldPath = path.join(process.cwd(), 'uploads/profiles', oldFile);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            } catch (fileErr) {
                console.error("Delete old file error (ignored):", fileErr);
            }
        }

        // 2. สร้าง Dynamic Query
        let updates = [];
        let params = [];
        let count = 1;

        const addField = (name, value) => {
            // ✅ แก้ตรงนี้: ถ้าส่งค่าว่างมา ('') ให้เปลี่ยนเป็น null เพื่อป้องกัน SQL Error
            const finalValue = (value === '' || value === undefined) ? null : value;
            
            updates.push(`${name} = $${count}`);
            params.push(finalValue);
            count++;
        };

        // ฟิลด์พื้นฐาน
        if (full_name !== undefined) addField('full_name', full_name);
        if (email !== undefined) addField('email', email);
        if (phone !== undefined) addField('phone', phone);
        if (role !== undefined) addField('role', role);
        if (status !== undefined) addField('status', status);
        if (profile_img) addField('profile_img', profile_img);

        // ✅ จัดการ Role: ถ้าไม่ใช่ student ให้ล้างค่าทิ้ง (ส่ง null)
        if (role === 'student') {
            addField('student_id', student_id);
            addField('student_level', student_level);
            addField('student_group', student_group);
        } else if (role === 'teacher' || role === 'department_head') {
            // ล้างข้อมูลส่วนของนักเรียนออกเมื่อเปลี่ยน Role
            updates.push(`student_id = $${count}`, `student_level = $${count+1}`, `student_group = $${count+2}`);
            params.push(null, null, null);
            count += 3;
        }

        // 3. จัดการรหัสผ่าน
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updates.push(`password = $${count}`);
            params.push(hashedPassword);
            count++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: "ไม่มีข้อมูลที่จะอัปเดต" });
        }

        // 4. สร้าง SQL
        params.push(id); // ID จะเป็นลำดับสุดท้ายเสมอ
        const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() 
                     WHERE id = $${count} RETURNING *`;

        const result = await pool.query(sql, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้นี้" });
        }

        res.status(200).json({ success: true, message: "อัปเดตสำเร็จ", data: result.rows[0] });

    } catch (error) {
        console.error("Update Profile Error:", error.message);
        // ส่งข้อความ Error กลับไปให้หน้าบ้านแสดงผล (จะได้ไม่ค้าง)
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING id', ['inactive', id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
        res.json({ success: true, message: 'ระงับการใช้งานสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};