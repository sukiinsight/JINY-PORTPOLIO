import { createServer } from "node:http";
import { bot } from "./telegram.js";
import { config } from "./config.js";

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

if (config.PUBLIC_WEBHOOK_URL) {
  const webhookPath = `/telegram/${config.TELEGRAM_BOT_TOKEN}`;
  const webhookUrl = `${config.PUBLIC_WEBHOOK_URL}${webhookPath}`;

  await bot.telegram.setWebhook(webhookUrl);
  createServer(bot.webhookCallback(webhookPath)).listen(config.PORT, () => {
    console.log(`Telegram webhook bot listening on port ${config.PORT}`);
  });
} else {
  await bot.launch();
  console.log("Telegram polling bot started");
}
