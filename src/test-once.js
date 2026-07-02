import "dotenv/config";

const requiredEnvVars = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const message = [
  "GitHub Actions Telegram send test",
  `Repository: ${process.env.GITHUB_REPOSITORY || "local"}`,
  `Run: ${process.env.GITHUB_RUN_ID || "manual"}`,
  "This only verifies outbound Telegram delivery.",
  "Inbound bot processing and Notion writes require npm start on an always-on server."
].join("\n");

const response = await fetch(
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
  {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message
    })
  }
);

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Telegram test message failed: ${response.status} ${body}`);
}

console.log("Telegram send test message sent successfully.");
