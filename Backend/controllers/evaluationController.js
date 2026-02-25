import EvaluationModel from '../models/evaluationModel.js';

// ✅ ใหม่: ดึงข้อมูลทั้งหมด
export const getAllEvaluations = async (req, res) => {
    try {
        const data = await EvaluationModel.getAll();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ดึงข้อมูลรายตัว
export const getDataById = async (req, res) => {
    try {
        const data = await EvaluationModel.getEverything(req.params.id);
        if (!data) return res.status(404).json({ message: "ไม่พบข้อมูล" });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// บันทึกการเปลี่ยนแปลง
export const saveChanges = async (req, res) => {
    try {
        const result = await EvaluationModel.updateScore(req.body);
        res.status(200).json({
            message: "แก้ไขข้อมูลสำเร็จ!",
            data: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};