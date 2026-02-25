const pool = require('../models/db');

// 1. ดึงข้อมูลโครงการพร้อมชื่อนักศึกษา
exports.getPendingProjects = async (req, res) => {
    try {
        const query = `
            SELECT p.*, u.full_name AS student_name, u.student_id 
            FROM std_projects p
            JOIN users u ON p.created_by = u.id
            ORDER BY p.updated_at DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "ดึงข้อมูลล้มเหลว", detail: err.message });
    }
};

// 2. อัปเดตสถานะและใส่ Feedback
exports.updateProjectStatus = async (req, res) => {
    const { id } = req.params;
    const { progress_status, feedback, approved_by } = req.body;

    try {
        const query = `
            UPDATE std_projects 
            SET 
                progress_status = $1, 
                feedback = $2, 
                approved_by = $3, 
                updated_at = CURRENT_TIMESTAMP
            WHERE project_id = $4
            RETURNING *;
        `;
        const values = [progress_status, feedback, approved_by, id];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูล" });

        res.json({ message: "อัปเดตสถานะเรียบร้อย", data: rows[0] });
    } catch (err) {
        res.status(500).json({ error: "อัปเดตไม่สำเร็จ", detail: err.message });
    }
};