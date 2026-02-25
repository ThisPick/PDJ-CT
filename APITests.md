📌 ส่วนที่ 1: ข้อมูลตั้งต้นและการตั้งค่าสิทธิ์ (Info & Collection Auth)
ส่วนนี้คือ "หัวใจ" ของไฟล์ ทำหน้าที่บอก Postman ว่าไฟล์นี้ชื่ออะไร และตั้งค่าให้ API ทุกตัวในนี้ใช้ระบบ Bearer Token เป็นค่าเริ่มต้น (โดยดึงค่ามาจากตัวแปร {{token}})

JSON
"info": {
    "name": "STD_UTC API Tests",
    "description": "ชุดทดสอบ API สำหรับระบบจัดการโครงงาน พร้อมระบบ Auto-Token",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
},
"auth": {
    "type": "bearer",
    "bearer": [
        {
            "key": "token",
            "value": "{{token}}",
            "type": "string"
        }
    ]
}
🔐 ส่วนที่ 2: โฟลเดอร์ Auth (ระบบล็อคอิน)
นี่คือโฟลเดอร์แรก ความพิเศษของส่วนนี้คือโค้ดตรง event ที่ผมเขียน Test Script (JavaScript) ฝังไว้ เพื่อให้มันดึงค่า token จากหลังบ้านมาเซฟเก็บไว้ให้อัตโนมัติเวลาล็อคอินสำเร็จ

JSON
{
    "name": "1. Auth (ระบบจัดการสิทธิ์)",
    "item": [
        {
            "name": "Login (ดึง Token อัตโนมัติ)",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "pm.test(\"Status code is 200\", function () {",
                            "    pm.response.to.have.status(200);",
                            "});",
                            "",
                            "pm.test(\"Save Token to Variables\", function () {",
                            "    var jsonData = pm.response.json();",
                            "    if(jsonData.token) {",
                            "        pm.collectionVariables.set(\"token\", jsonData.token);",
                            "    }",
                            "});"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "auth": { "type": "noauth" },
                "method": "POST",
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"email\": \"admin@utc.ac.th\",\n    \"password\": \"123456\"\n}"
                },
                "url": {
                    "raw": "{{baseUrl}}/api/auth/login",
                    "host": ["{{baseUrl}}"],
                    "path": ["api", "auth", "login"]
                }
            }
        }
    ]
}
👥 ส่วนที่ 3: โฟลเดอร์ Users (ระบบจัดการผู้ใช้)
โฟลเดอร์นี้สำหรับดึงข้อมูลผู้ใช้ทั้งหมด (เป็น API ที่ต้องใช้สิทธิ์ Admin) ส่วนนี้จะมีการเขียน Test เช็คว่าข้อมูลที่หลังบ้านตอบกลับมาต้องเป็นรูปแบบ Array เสมอ

JSON
{
    "name": "2. Users (ระบบจัดการผู้ใช้)",
    "item": [
        {
            "name": "Get All Users (สำหรับ Admin)",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "pm.test(\"Status code is 200\", function () {",
                            "    pm.response.to.have.status(200);",
                            "});",
                            "pm.test(\"Response is an array\", function () {",
                            "    var jsonData = pm.response.json();",
                            "    pm.expect(jsonData.data).to.be.an('array');",
                            "});"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "GET",
                "url": {
                    "raw": "{{baseUrl}}/api/users",
                    "host": ["{{baseUrl}}"],
                    "path": ["api", "users"]
                }
            }
        }
    ]
}
📚 ส่วนที่ 4: โฟลเดอร์ Projects (ระบบจัดการโครงงาน)
โฟลเดอร์สำหรับจัดการโครงงาน อันนี้เป็นแบบเรียบง่ายที่สุดคือมีแค่ Method GET และ URL ปลายทาง

JSON
{
    "name": "3. Projects (ระบบจัดการโครงงาน)",
    "item": [
        {
            "name": "Get All Projects",
            "request": {
                "method": "GET",
                "url": {
                    "raw": "{{baseUrl}}/api/projects",
                    "host": ["{{baseUrl}}"],
                    "path": ["api", "projects"]
                }
            }
        }
    ]
}
⚙️ ส่วนที่ 5: ตัวแปรระบบ (Variables)
ส่วนนี้จะอยู่ท้ายสุดของไฟล์ JSON เสมอ เอาไว้เก็บค่าคงที่อย่าง baseUrl (เพื่อให้คุณเปลี่ยนทีเดียวแล้วเปลี่ยนทั้งโปรเจกต์) และเป็นที่เก็บกล่องเปล่าๆ ไว้รอรับ token จากการล็อคอินครับ

JSON
"variable": [
    {
        "key": "baseUrl",
        "value": "http://localhost:5000",
        "type": "string"
    },
    {
        "key": "token",
        "value": "",
        "type": "string"
    }
]