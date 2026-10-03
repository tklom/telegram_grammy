import "dotenv/config";
import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("ไม่พบ BOT_TOKEN — สร้างไฟล์ .env แล้วใส่ BOT_TOKEN=... (ดู .env.example)");
  process.exit(1);
}

const bot = new Bot(token);

// /start — ทักทาย + ปุ่ม inline
bot.command("start", async (ctx) => {
  const name = ctx.from?.first_name ?? "เพื่อน";
  const keyboard = new InlineKeyboard()
    .text("👋 ทักทาย", "hello")
    .text("🎲 สุ่มเลข", "dice");

  await ctx.reply(`สวัสดี ${name}! ผมเป็นบอทตัวอย่างที่เขียนด้วย grammY\nพิมพ์ /help เพื่อดูคำสั่งทั้งหมด`, {
    reply_markup: keyboard,
  });
});

bot.command("help", (ctx) =>
  ctx.reply(
    [
      "คำสั่งที่ใช้ได้:",
      "/start — เริ่มต้น",
      "/help — ดูคำสั่ง",
      "/ping — เช็คว่าบอทยังทำงานอยู่",
      "/me — ดูข้อมูลของคุณ",
      "",
      "หรือพิมพ์ข้อความอะไรก็ได้ บอทจะตอบกลับ",
    ].join("\n"),
  ),
);

bot.command("ping", (ctx) => ctx.reply("pong 🏓"));

bot.command("me", (ctx) => {
  const u = ctx.from;
  return ctx.reply(`ID: ${u.id}\nชื่อ: ${u.first_name} ${u.last_name ?? ""}\nUsername: @${u.username ?? "-"}`);
});

// ปุ่ม inline
bot.callbackQuery("hello", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("สวัสดีครับ 😄");
});

bot.callbackQuery("dice", async (ctx) => {
  const n = Math.floor(Math.random() * 100) + 1;
  await ctx.answerCallbackQuery({ text: `ได้เลข ${n}` });
  await ctx.reply(`🎲 สุ่มได้: ${n}`);
});

// ข้อความทั่วไป
bot.hears(/^(สวัสดี|hello|hi)$/i, (ctx) => ctx.reply("สวัสดีครับ! มีอะไรให้ช่วยไหม"));

bot.on("message:text", (ctx) => ctx.reply(`คุณพิมพ์ว่า: ${ctx.message.text}`));

bot.on("message:photo", (ctx) => ctx.reply("ได้รับรูปแล้ว 📷 สวยมาก!"));

bot.on("message:sticker", (ctx) => ctx.reply(ctx.message.sticker.emoji ?? "👍"));

// จัดการ error ไม่ให้บอทล่ม
bot.catch((err) => {
  const e = err.error;
  console.error(`Error ขณะจัดการ update ${err.ctx.update.update_id}:`);
  if (e instanceof GrammyError) console.error("Telegram API error:", e.description);
  else if (e instanceof HttpError) console.error("ติดต่อ Telegram ไม่ได้:", e);
  else console.error("Unknown error:", e);
});

// ตั้งเมนูคำสั่ง (ปุ่ม Menu ในแชท)
await bot.api.setMyCommands([
  { command: "start", description: "เริ่มต้น" },
  { command: "help", description: "ดูคำสั่งทั้งหมด" },
  { command: "ping", description: "เช็คสถานะบอท" },
  { command: "me", description: "ดูข้อมูลของคุณ" },
]);

// ปิดบอทอย่างนุ่มนวลเมื่อ PM2/systemd สั่งหยุด
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

bot.start({
  onStart: (me) => console.log(`✅ บอท @${me.username} ทำงานแล้ว (long polling)`),
});
