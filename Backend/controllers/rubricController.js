import pool from '../config/db.js';

const rubricController = {
    getAllRubrics: async (req, res) => {
        try {
            const query = `
                SELECT r.*, u.full_name AS creator_name 
                FROM rubrics r 
                LEFT JOIN users u ON r.created_by = u.id 
                ORDER BY r.rubric_id DESC`;
            const { rows } = await pool.query(query);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    getRubricById: async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT r.*, u.full_name AS creator_name 
                FROM rubrics r 
                LEFT JOIN users u ON r.created_by = u.id 
                WHERE r.rubric_id = $1`;
            const { rows } = await pool.query(query, [id]);
            if (rows.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูล" });
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    createRubric: async (req, res) => {
        try {
            const { title, academic_year, level, department, total_full_score, created_by, rubric_data } = req.body;
            const query = `
                INSERT INTO rubrics (title, academic_year, level, department, total_full_score, created_by, rubric_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING rubric_id`;
            
            // ส่ง rubric_data เข้าไปตรงๆ (pg driver จะจัดการ JSON ให้เอง)
            const { rows } = await pool.query(query, [
                title, academic_year, level, department, total_full_score, created_by, rubric_data
            ]);
            res.status(201).json({ success: true, rubric_id: rows[0].rubric_id });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    updateRubric: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, academic_year, level, department, total_full_score, is_active, rubric_data } = req.body;
            const query = `
                UPDATE rubrics 
                SET title = $1, academic_year = $2, level = $3, department = $4, 
                    total_full_score = $5, is_active = $6, rubric_data = $7, updated_at = CURRENT_TIMESTAMP
                WHERE rubric_id = $8`;
            await pool.query(query, [title, academic_year, level, department, total_full_score, is_active, rubric_data, id]);
            res.json({ success: true, message: "อัปเดตเรียบร้อย" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    toggleStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            await pool.query("UPDATE rubrics SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE rubric_id = $2", [is_active, id]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    deleteRubric: async (req, res) => {
        try {
            await pool.query('DELETE FROM rubrics WHERE rubric_id = $1', [req.params.id]);
            res.json({ success: true, message: "ลบสำเร็จ" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

export default rubricController;