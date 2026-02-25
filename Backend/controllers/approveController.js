import pool from '../config/db.js';

// ดึงข้อมูลโครงการ
export const getPendingProjects = async (req, res) => {
    try {
        // ✅ แก้ไข: เปลี่ยน u.full_name AS student_name เป็น AS creator_name 
        // เพื่อไม่ให้ไปทับคอลัมน์ student_name จริงๆ ที่อยู่ใน p.* (std_projects)
        const query = `
            SELECT p.*, u.full_name AS creator_name, u.student_id 
            FROM std_projects p
            LEFT JOIN users u ON p.created_by = u.id
            ORDER BY p.updated_at DESC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("❌ Error fetching projects:", err.message);
        res.status(500).json({ error: "Server Error", detail: err.message });
    }
};

// อัปเดตสถานะ (พร้อม Log เพื่อ Debug)
export const updateProjectStatus = async (req, res) => {
    const { id } = req.params;
    const { progress_status, feedback, approved_by } = req.body;

    console.log("-----------------------------------------");
    console.log("🛠 Updating Project ID:", id);
    console.log("📥 Data Received:", { progress_status, feedback, approved_by });

    try {
        // ตรวจสอบข้อมูลเบื้องต้น
        if (!id) throw new Error("Missing Project ID");
        
        // แปลง approved_by เป็นตัวเลข (กันไว้กรณีส่งมาเป็น string หรือ null)
        const approverId = approved_by ? parseInt(approved_by) : null; 

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
        const values = [progress_status, feedback, approverId, id];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            console.log("❌ Project Not Found ID:", id);
            return res.status(404).json({ message: "ไม่พบโปรเจกต์ไอดีนี้ในระบบ" });
        }

        console.log("✅ Update Success:", rows[0].title_th);
        res.json({ message: "อัปเดตสถานะเรียบร้อย", data: rows[0] });

    } catch (err) {
        console.error("❌ Error updating project:", err.message);
        res.status(500).json({ error: "Server Error", detail: err.message });
    }
};