import pool from '../config/db.js';

const Project = {
    create: async (data) => {
        // ✅ เพิ่ม student_id เข้าไปในรายการคอลัมน์ และเพิ่ม $16
        const sql = `INSERT INTO std_projects 
        (created_by, title_th, title_en, academic_year, project_level, category, progress_status, is_featured, feedback, pdf_file_path, video_url, github_url, drive_url, advisor, student_name, student_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`;
        
        const values = [
            data.created_by, 
            data.title_th, 
            data.title_en, 
            data.academic_year, 
            data.project_level, 
            data.category, 
            data.progress_status,
            data.is_featured === true || data.is_featured === 'true' ? true : null,
            data.feedback && data.feedback.trim() !== '' ? data.feedback : null,
            data.pdf_file_path, 
            data.video_url, 
            data.github_url, 
            data.drive_url,
            data.advisor, 
            data.student_name,
            data.student_id // ✅ เพิ่มรหัสนักศึกษาเข้าไป ($16) เพื่อเชื่อม Foreign Key
        ];
        const result = await pool.query(sql, values);
        return result.rows[0];
    },

    update: async (id, data) => {
        // ✅ เพิ่ม student_id=$15 และเลื่อน id ไปเป็น $16
        const sql = `UPDATE std_projects SET 
            title_th=$1, title_en=$2, academic_year=$3, project_level=$4, 
            category=$5, progress_status=$6, is_featured=$7, feedback=$8, 
            pdf_file_path=COALESCE($9, pdf_file_path), video_url=$10, 
            github_url=$11, drive_url=$12, advisor=$13, student_name=$14,
            student_id=$15 
            WHERE project_id=$16 RETURNING *`;
            
        const values = [
            data.title_th, 
            data.title_en, 
            data.academic_year, 
            data.project_level, 
            data.category, 
            data.progress_status,
            data.is_featured === true || data.is_featured === 'true' ? true : null,
            data.feedback && data.feedback.trim() !== '' ? data.feedback : null,
            data.pdf_file_path, 
            data.video_url, 
            data.github_url, 
            data.drive_url,
            data.advisor, 
            data.student_name,
            data.student_id, // ✅ $15
            id               // ✅ $16
        ];
        const result = await pool.query(sql, values);
        return result.rows[0];
    },

    findAll: async () => {
        // ดึงข้อมูลพร้อม Join กับตาราง users เพื่อเอาชื่อจริงของผู้สร้างมาโชว์
        const sql = `SELECT p.*, u.full_name as creator_name 
                    FROM std_projects p 
                    LEFT JOIN users u ON p.created_by = u.id 
                    ORDER BY p.created_at DESC`;
        const result = await pool.query(sql);
        return result.rows;
    },

    findById: async (id) => {
        const result = await pool.query('SELECT * FROM std_projects WHERE project_id = $1', [id]);
        return result.rows[0];
    },
    
    delete: async (id) => {
        const result = await pool.query('DELETE FROM std_projects WHERE project_id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

export default Project;