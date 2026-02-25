import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/evaluations';

const evaluationService = {
    getAll: async () => {
        try {
            const response = await axios.get(API_BASE_URL);
            return response.data; 
        } catch (error) {
            console.error("Fetch All Error:", error);
            throw error;
        }
    },

    getById: async (projectId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/${projectId}`);
            return response.data;
        } catch (error) {
            console.error("Fetch ID Error:", error);
            throw error;
        }
    },

    updateScore: async (payload) => {
        try {
            // ส่งข้อมูลไปยัง /update ตรงตาม Route ของหลังบ้าน
            const response = await axios.post(`${API_BASE_URL}/update`, payload);
            return response.data;
        } catch (error) {
            console.error("Update Error:", error.response?.data || error.message);
            throw error;
        }
    }
};

export default evaluationService;