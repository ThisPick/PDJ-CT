import pool from '../config/db.js'; 

const Rubric = {
    // 1. สร้างเกณฑ์ (ส่งข้อมูลก้อนเดียวจบ)
    create: async (client, data) => {
        const queryText = `
            INSERT INTO rubrics (title, academic_year, level, department, total_full_score, created_by)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING rubric_id
        `;
        const values = [
            data.title, 
            data.academic_year, 
            data.level, 
            data.department || 'คอมพิวเตอร์', 
            data.total_full_score,
            data.created_by 
        ];
        const res = await client.query(queryText, values);
        return res.rows[0].rubric_id;
    },

    // 2. ดึงรายการทั้งหมด
    findAll: async () => {
        const queryText = `
            SELECT r.*, u.full_name AS creator_name
            FROM rubrics r
            LEFT JOIN users u ON r.created_by = u.id
            ORDER BY r.rubric_id DESC
        `;
        const res = await pool.query(queryText); 
        return res.rows;
    },

    // 3. ดึงข้อมูลรายตัวตาม ID
    findById: async (id) => {
        const queryText = `
            SELECT r.*, u.full_name AS creator_name
            FROM rubrics r
            LEFT JOIN users u ON r.created_by = u.id
            WHERE r.rubric_id = $1
        `;
        const res = await pool.query(queryText, [id]);
        return res.rows[0] || null;
    },

    // 4. อัปเดตสถานะ
    updateStatus: async (id, is_active) => {
        return await pool.query(
            "UPDATE rubrics SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE rubric_id = $2", 
            [is_active, id]
        );
    },

    // 5. ลบเกณฑ์
    delete: async (id) => {
        return await pool.query("DELETE FROM rubrics WHERE rubric_id = $1", [id]);
    }
};

export default Rubric;