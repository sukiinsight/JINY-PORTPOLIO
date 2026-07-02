import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  NOTION_API_KEY: z.string().optional(),
  NOTION_TOKEN: z.string().optional(),
  NOTION_DATABASE_ID: z.string().min(1),
  ALLOWED_TELEGRAM_USER_IDS: z.string().optional().default(""),
  OPENAI_MODEL: z.string().optional().default("gpt-5.5"),
  PUBLIC_WEBHOOK_URL: z.string().url().optional(),
  PORT: z.coerce.number().optional().default(3000)
});

const parsedConfig = envSchema.parse(process.env);
const notionApiKey = parsedConfig.NOTION_API_KEY || parsedConfig.NOTION_TOKEN;

if (!notionApiKey) {
  throw new Error("Missing required environment variable: NOTION_API_KEY");
}

export const config = {
  ...parsedConfig,
  NOTION_API_KEY: notionApiKey
};

export const allowedTelegramUserIds = config.ALLOWED_TELEGRAM_USER_IDS
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
