import { createServer } from "node:http";
import { bot } from "./telegram.js";
import { config } from "./config.js";

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

function sendHealthResponse(res, mode) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, mode }));
}

if (config.PUBLIC_WEBHOOK_URL) {
  const webhookPath = `/telegram/${config.TELEGRAM_BOT_TOKEN}`;
  const webhookUrl = `${config.PUBLIC_WEBHOOK_URL}${webhookPath}`;
  const webhookCallback = bot.webhookCallback(webhookPath);

  await bot.telegram.setWebhook(webhookUrl);

  createServer((req, res) => {
    if (req.method === "GET" && ["/", "/healthz"].includes(req.url)) {
      sendHealthResponse(res, "webhook");
      return;
    }

    webhookCallback(req, res);
  }).listen(config.PORT, () => {
    console.log(`Telegram webhook bot listening on port ${config.PORT}`);
  });
} else {
  await bot.telegram.deleteWebhook();
  await bot.launch();
  console.log("Telegram polling bot started");
}
