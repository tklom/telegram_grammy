// PM2 config — ใช้บน VPS: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "telegram-bot",
      script: "src/bot.js",
      instances: 1, // long polling ต้องรันแค่ 1 ตัว ห้ามเกิน
      autorestart: true,
      max_memory_restart: "200M",
      env: { NODE_ENV: "production" },
    },
  ],
};
