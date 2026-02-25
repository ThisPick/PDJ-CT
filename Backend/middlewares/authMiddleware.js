import jwt from 'jsonwebtoken';

// 1. ด่านตรวจการ Login (Authentication)
export const protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'สิทธิ์ถูกปฏิเสธ: กรุณาเข้าสู่ระบบก่อน' });
    }

    try {
        // ยืนยันความถูกต้องของบัตรผ่าน
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // เก็บข้อมูลไว้ใน req.user (จะมี userId และ role ที่เราใส่ไว้ตอน Login)
        req.user = decoded; 
        
        next();
    } catch (error) {
        // ถ้า Token หมดอายุ หรือถูกปลอมแปลง
        return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ กรุณา Login ใหม่' });
    }
};

// 2. ด่านตรวจสิทธิ์ (Authorization) - สำหรับแยก นักศึกษา / ครู
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // ตรวจว่า role ใน Token ตรงกับที่อนุญาตให้เข้าหน้านี้ไหม
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `คุณไม่มีสิทธิ์เข้าถึง: เฉพาะกลุ่ม ${allowedRoles.join(', ')} เท่านั้น` 
            });
        }
        next();
    };
};