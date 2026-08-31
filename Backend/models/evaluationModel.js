import db from '../config/db.js';

const EvaluationModel = {

  getAll: async () => {
    // ดึง score ล่าสุดของแต่ละโปรเจกต์ (evaluated_at มากสุด)
    const query = `
      SELECT 
        p.*,
        s.score_id,
        s.total_score,
        s.max_score,
        s.comment,
        s.rubric_id,
        s.criteria_scores,
        s.evaluated_at,
        u.full_name AS creator_name
      FROM std_projects p
      LEFT JOIN LATERAL (
        SELECT * FROM project_scores
        WHERE project_id = p.project_id
        ORDER BY evaluated_at DESC
        LIMIT 1
      ) s ON true
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.project_id ASC`;
    const result = await db.query(query);
    return result.rows;
  },

  getEverything: async (id) => {
    // ดึง score ล่าสุดของโปรเจกต์นั้น
    const query = `
      SELECT 
        p.*,
        s.score_id,
        s.total_score,
        s.max_score,
        s.comment,
        s.rubric_id,
        s.criteria_scores,
        s.evaluated_at,
        u.full_name AS creator_name
      FROM std_projects p
      LEFT JOIN LATERAL (
        SELECT * FROM project_scores
        WHERE project_id = p.project_id
        ORDER BY evaluated_at DESC
        LIMIT 1
      ) s ON true
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.project_id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // ดึงประวัติการบันทึกทั้งหมดของโปรเจกต์ (เรียงล่าสุดก่อน)
  getHistory: async (project_id) => {
    const query = `
      SELECT 
        s.*,
        u.full_name AS evaluator_name
      FROM project_scores s
      LEFT JOIN users u ON s.evaluator_id = u.id
      WHERE s.project_id = $1
      ORDER BY s.evaluated_at DESC`;
    const result = await db.query(query, [project_id]);
    return result.rows;
  },

  // บันทึกคะแนน — INSERT row ใหม่ทุกครั้ง (เก็บ history)
  // อัปเดต std_projects ด้วยเพื่อให้ตาราง list แสดงคะแนนล่าสุด
  updateScore: async (data) => {
    const {
      project_id,
      evaluator_id,
      rubric_id,
      criteria_scores,
      total_score,
      max_score,
      comment,
    } = data;

    // INSERT ประวัติใหม่ทุกครั้ง
    const insertQuery = `
      INSERT INTO project_scores 
        (project_id, evaluator_id, rubric_id, criteria_scores, total_score, max_score, comment, evaluated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *`;

    const result = await db.query(insertQuery, [
      project_id,
      evaluator_id,
      rubric_id,
      JSON.stringify(criteria_scores),
      total_score,
      max_score,
      comment,
    ]);

    return result.rows[0];
  },
};

export default EvaluationModel;