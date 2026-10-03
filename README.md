# Telegram Bot ด้วย grammY + Deploy ขึ้น VPS

บอทตัวอย่างที่ตอบโต้ได้: `/start` (มีปุ่ม inline), `/help`, `/ping`, `/me`, ตอบกลับข้อความ, รูป, สติกเกอร์

```
telegram_grammy/
├── src/bot.js             # โค้ดบอททั้งหมด
├── .env.example           # ตัวอย่างไฟล์ตั้งค่า (copy เป็น .env)
├── Dockerfile             # สำหรับรันด้วย Docker
├── docker-compose.yml     # วางใน Hostinger Docker Manager (ส่วนที่ 2A)
├── ecosystem.config.cjs   # config ของ PM2 (ส่วนที่ 2B)
└── package.json
```

---

## ส่วนที่ 1 — สร้างบอทและรันบนเครื่องตัวเอง

### 1. ขอ Token จาก BotFather
1. เปิด Telegram ค้นหา **@BotFather**
2. พิมพ์ `/newbot` → ตั้งชื่อบอท → ตั้ง username (ต้องลงท้ายด้วย `bot`)
3. BotFather จะส่ง token มาให้ เช่น `123456789:ABCdef...` (**ห้ามเผยแพร่ ห้าม commit ขึ้น git**)

### 2. รันบนเครื่อง
```bash
npm install
cp .env.example .env       # Windows: copy .env.example .env
# แก้ .env ใส่ BOT_TOKEN ของจริง
npm run dev                # รันแบบ auto-reload เวลาแก้โค้ด
```
ถ้าขึ้นข้อความ `✅ บอท @xxx ทำงานแล้ว` แสดงว่าบอททำงานแล้ว ลองไปทักบอทใน Telegram ได้เลย

> ⚠️ ก่อนขึ้น VPS ให้กด Ctrl+C ปิดบอทบนเครื่องตัวเองก่อน
> ถ้าใช้ token เดียวกันรันพร้อมกัน 2 ที่ จะเจอ error `409 Conflict`

---

## ส่วนที่ 2A — ขึ้นผ่าน Hostinger Docker Manager (ไม่ต้อง SSH)

ใช้กับ VPS ที่ติดตั้ง template "Ubuntu 24.04 with Docker" มาแล้ว บอทจะรันเป็น Docker app อีกตัว แยกจาก app เดิมทั้งหมด

### 1. Push โค้ดขึ้น GitHub (repo แบบ Public)
สร้าง repo ชื่อ `telegram_grammy` บน GitHub แล้วรันบนเครื่องตัวเอง:
```bash
git init -b main
git add .
git commit -m "Telegram bot with grammY"
git remote add origin https://github.com/<you>/telegram_grammy.git
git push -u origin main
```
ไฟล์ `.env` ถูก ignore ไว้แล้ว token จึงไม่หลุดขึ้น GitHub

### 2. แก้ docker-compose.yml
เปลี่ยน `YOUR_GITHUB_USER` เป็นชื่อ GitHub ของตัวเอง แล้ว commit + push อีกรอบ

### 3. สร้าง app ใน Docker Manager
1. hPanel → VPS → **Docker Manager** → ปุ่ม **Compose** (มุมขวาบน)
2. ตั้งชื่อ project เช่น `telegram-bot`
3. วางเนื้อหาไฟล์ `docker-compose.yml` ทั้งไฟล์ลงไป
4. ที่ส่วน Environment variables ให้เพิ่ม `BOT_TOKEN` แล้วใส่ token จริง
5. กด Deploy → รอ build ประมาณ 1–2 นาที จนสถานะขึ้น **Running**

### 4. ตรวจสอบ
- กด **Manage** → ดู Logs ต้องเห็น `✅ บอท @xxx ทำงานแล้ว`
- ทัก `/start` ใน Telegram

### อัปเดตโค้ดครั้งต่อไป
`git push` โค้ดใหม่ → ใน Docker Manager กด Manage → **Update/Redeploy** (`pull_policy: build` ทำให้ build ใหม่จาก GitHub ทุกครั้ง)

> ไม่ต้องตั้ง Traefik หรือเปิด port เพราะบอทใช้ long polling (ดึงข้อมูลออกไปเอง ไม่มีใครเรียกเข้ามา)

---

## ส่วนที่ 2B — ขึ้นเองผ่าน SSH + PM2 (Ubuntu 22.04/24.04)

ตัวอย่างนี้ใช้ IP `203.0.113.10` แทน IP ของ VPS จริง ให้เปลี่ยนเป็น IP ของตัวเอง

### ขั้นที่ 1: SSH เข้า VPS
```bash
ssh root@203.0.113.10
```

### ขั้นที่ 2: อัปเดตระบบ + สร้าง user แยก (ไม่ควรรันบอทด้วย root)
```bash
apt update && apt upgrade -y
adduser botuser                 # ตั้งรหัสผ่าน ส่วนช่องอื่นกด Enter ข้ามได้
usermod -aG sudo botuser
su - botuser                    # สลับไปใช้ user ใหม่
```

### ขั้นที่ 3: ติดตั้ง Node.js (ผ่าน nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts
node -v                         # ควรได้ v20 ขึ้นไป
```

### ขั้นที่ 4: เอาโค้ดขึ้น VPS (เลือกทางใดทางหนึ่ง)

**ทาง A — ผ่าน Git (แนะนำ)** push โค้ดขึ้น GitHub ก่อน (`.env` ถูก ignore ไว้แล้ว) แล้วบน VPS:
```bash
git clone https://github.com/<you>/telegram_grammy.git
cd telegram_grammy
```

**ทาง B — copy จากเครื่องตัวเองตรง ๆ** (รันบนเครื่องตัวเอง ไม่ใช่บน VPS):
```bash
scp -r src package.json package-lock.json ecosystem.config.cjs botuser@203.0.113.10:~/telegram_grammy/
```

### ขั้นที่ 5: ติดตั้ง dependency + ใส่ token
```bash
cd ~/telegram_grammy
npm ci --omit=dev
nano .env                       # พิมพ์ BOT_TOKEN=xxxx  แล้วกด Ctrl+O, Enter, Ctrl+X
chmod 600 .env                  # ให้เฉพาะ user นี้อ่านไฟล์ได้
```

ทดสอบรันก่อน 1 รอบ:
```bash
npm start                       # เห็น ✅ แล้วกด Ctrl+C ปิด
```

### ขั้นที่ 6: ใช้ PM2 ให้บอทรันตลอด 24 ชม.
ถ้าปิดหน้าต่าง SSH บอทจะหยุดไปด้วย จึงต้องใช้ PM2 คุมให้รันอยู่เบื้องหลัง และ restart ให้อัตโนมัติถ้าบอทล่ม
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save                        # จำรายการแอปไว้
pm2 startup                     # จะพิมพ์คำสั่ง sudo ออกมา 1 บรรทัด → copy ไปรัน
```
ตอนนี้ VPS reboot แล้วบอทก็จะกลับมารันเอง

### ขั้นที่ 7: Firewall
บอทนี้ใช้ **long polling** คือบอทเป็นฝ่ายดึงข้อความจาก Telegram เอง จึง**ไม่ต้องเปิด port ขาเข้า** เปิดแค่ SSH ก็พอ:
```bash
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## คำสั่งที่ใช้ดูแลบอทบน VPS

| ต้องการ | คำสั่ง |
|---|---|
| ดูสถานะ | `pm2 status` |
| ดู log สด | `pm2 logs telegram-bot` |
| restart | `pm2 restart telegram-bot` |
| หยุด | `pm2 stop telegram-bot` |
| ดู CPU/RAM | `pm2 monit` |

**อัปเดตโค้ดเวอร์ชันใหม่:**
```bash
cd ~/telegram_grammy
git pull
npm ci --omit=dev
pm2 restart telegram-bot
```

---

## แก้ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `ไม่พบ BOT_TOKEN` | ยังไม่ได้สร้าง `.env` หรือสร้างไว้ผิดโฟลเดอร์ |
| `401 Unauthorized` | token ผิด ให้ไปเช็คกับ BotFather (ใช้ `/token`) |
| `409 Conflict: terminated by other getUpdates` | มีบอทตัวเดียวกันรันอยู่อีกที่ เช่นบนเครื่องตัวเอง ให้ปิดตัวนั้น |
| บอทเงียบ ไม่ตอบ | `pm2 logs telegram-bot` เพื่อดู error |
| `pm2: command not found` หลัง reboot | รัน `pm2 startup` แล้วนำคำสั่งที่ได้ไปรันอีกครั้ง |

---

## Long polling vs Webhook

โปรเจกต์นี้ใช้ **long polling** เพราะตั้งค่าง่ายที่สุด ไม่ต้องมีโดเมน ไม่ต้องมี SSL และไม่ต้องเปิด port เหมาะกับบอทส่วนใหญ่

ถ้าในอนาคตบอทมีผู้ใช้เยอะมาก หรือต้องการรันแบบ serverless ค่อยเปลี่ยนไปใช้ **webhook** ซึ่งต้องมีโดเมน + HTTPS (เช่น Nginx + Let's Encrypt) และใช้ `webhookCallback` ของ grammY แทน `bot.start()`
