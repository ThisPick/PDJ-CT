# 🔐 เอกสารอธิบายการเชื่อมต่อระบบ (Authentication & User API)
> **Base URL:** `http://localhost:5000`

เอกสารนี้ระบุรายละเอียดของ Endpoint สำหรับระบบจัดการสมาชิกและการยืนยันตัวตนทั้งหมดภายในระบบ

---

## 1. 🔑 ระบบยืนยันตัวตน (Authentication)

ใช้สำหรับจัดการสิทธิ์การเข้าถึงระบบ ตั้งแต่การลงทะเบียนจนถึงการกู้คืนรหัสผ่าน

### 📋 รายละเอียด Endpoint
| Endpoint | Method | รายละเอียด | หมายเหตุ |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | `POST` | เข้าสู่ระบบด้วย Email | ระบบจะส่ง Token และข้อมูล User กลับมา |
| `/api/auth/register` | `POST` | ลงทะเบียนผู้ใช้ใหม่ | รองรับสิทธิ์ Student และ Department Head |
| `/api/auth/reset-password` | `POST` | เปลี่ยนรหัสผ่านใหม่ | ต้องระบุ Email ที่มีอยู่ในระบบเท่านั้น |

### 💡 ตัวอย่างการ Register (สำหรับหัวหน้าแผนก)
```json
{
  "email": "mygigaming2012@gmail.com",
  "password": "your_secure_password",
  "full_name": "WatsiriHead",
  "role": "department_head",
  "staff_key": "HEAD_COM69"
}


# 🚀 การเชื่อมต่อระบบ API (Projects & Evaluations)
> **Base URL:** `http://localhost:5000`

---

## 1. 📊 ระบบประเมินผลและให้คะแนน (Evaluations API)
ใช้สำหรับการจัดการข้อมูลคะแนนที่อาจารย์ประเมินโครงงานของนักศึกษา

### 📋 รายละเอียด Endpoint
| Endpoint | Method | รายละเอียด |
| :--- | :---: | :--- |
| `/api/evaluations/:id` | `GET` | ดึงข้อมูลผลการประเมินของโครงงานตาม ID (เช่น `/api/evaluations/33`) |
| `/api/evaluations/update` | `POST` | บันทึกหรืออัปเดตผลคะแนนและข้อเสนอแนะ |

### 📥 ตัวอย่าง Request Body (POST /update)
```json
{
  "project_id": 33,
  "evaluator_id": 15,
  "total_score": 95.50,
  "comment": "แก้ไขเนื้อหาให้สมบูรณ์ขึ้นแล้ว งานดีมากครับ"
}

# ✅ เอกสารอธิบายการเชื่อมต่อระบบ (Approve API)
> **Base URL:** `http://localhost:5000`

ใช้สำหรับการจัดการสถานะโครงงาน (เช่น อนุมัติหัวข้อ, ให้แก้ไข, หรือไม่อนุมัติ) รวมถึงการบันทึกข้อเสนอแนะ (Feedback) กลับไปยังนักศึกษา

---

## 📋 รายการ Endpoints

| Endpoint | Method | รายละเอียด |
| :--- | :---: | :--- |
| `/api/approve/all` | `GET` | ดึงข้อมูลโครงงานทั้งหมดที่รอการตรวจสอบ หรือประวัติการอนุมัติทั้งหมด |
| `/api/approve/update-status/:id` | `PUT` | อัปเดตสถานะและบันทึกข้อเสนอแนะของโครงงานตาม ID (เช่น `/api/approve/update-status/25`) |

---

## 📥 ตัวอย่าง Request Body (PUT /update-status/:id)

เมื่ออาจารย์หรือหัวหน้าแผนกทำการตัดสินใจ หน้าบ้าน (Frontend) จะส่งข้อมูล JSON ดังนี้ไปที่หลังบ้าน:

```json
{
  "progress_status": "กำลังทำ",
  "feedback": "หัวข้อน่าสนใจมาก ขอบเขตงานชัดเจน อนุมัติครับ",
  "approved_by": 15
}