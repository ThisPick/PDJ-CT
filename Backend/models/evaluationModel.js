import db from '../config/db.js';

const EvaluationModel = {
    getAll: async () => {
        const query = `
            SELECT 
                p.*, 
                s.total_score, 
                s.comment,
                u.full_name as creator_name  -- ดึงชื่อจากตาราง users
            FROM std_projects p
            LEFT JOIN project_scores s ON p.project_id = s.project_id
            LEFT JOIN users u ON p.created_by = u.id  -- เปลี่ยนเป็น u.id ตามที่คุณแจ้ง
            ORDER BY p.project_id ASC`;
        const result = await db.query(query);
        return result.rows; 
    },

    getEverything: async (id) => {
        const query = `
            SELECT 
                p.*, 
                s.total_score, 
                s.comment,
                u.full_name as creator_name
            FROM std_projects p
            LEFT JOIN project_scores s ON p.project_id = s.project_id
            LEFT JOIN users u ON p.created_by = u.id  -- เปลี่ยนเป็น u.id
            WHERE p.project_id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    // updateScore คงเดิม
    updateScore: async (data) => {
        const { project_id, evaluator_id, total_score, comment } = data;
        const query = `
            INSERT INTO project_scores (project_id, evaluator_id, total_score, comment)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (project_id) 
            DO UPDATE SET 
                total_score = EXCLUDED.total_score, 
                comment = EXCLUDED.comment,
                evaluator_id = EXCLUDED.evaluator_id,
                evaluated_at = CURRENT_TIMESTAMP
            RETURNING *`;
        const result = await db.query(query, [project_id, evaluator_id, total_score, comment]);
        return result.rows[0];
    }
};

export default EvaluationModel;