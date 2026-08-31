import EvaluationModel from '../models/evaluationModel.js';

// ดึงข้อมูลทั้งหมด (พร้อมคะแนนล่าสุด)
export const getAllEvaluations = async (req, res) => {
  try {
    const data = await EvaluationModel.getAll();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงข้อมูลรายตัว (พร้อมคะแนนล่าสุด)
export const getDataById = async (req, res) => {
  try {
    const data = await EvaluationModel.getEverything(req.params.id);
    if (!data) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงประวัติการบันทึกคะแนนของโปรเจกต์
export const getScoreHistory = async (req, res) => {
  try {
    const data = await EvaluationModel.getHistory(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// บันทึกคะแนน
export const saveChanges = async (req, res) => {
  try {
    const result = await EvaluationModel.updateScore(req.body);
    res.status(200).json({
      message: 'บันทึกคะแนนสำเร็จ!',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};