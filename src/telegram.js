import { Telegraf } from "telegraf";
import { allowedTelegramUserIds, config } from "./config.js";
import { analyzeRecord } from "./openaiAnalysis.js";
import { createNotionRecord, hasNotionRecord } from "./notion.js";

export const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

const shouldRethrowHandlerErrors = process.env.PROCESS_PENDING_UPDATES === "true";

function isAllowed(ctx) {
  if (allowedTelegramUserIds.length === 0) {
    return true;
  }

  return allowedTelegramUserIds.includes(String(ctx.from?.id));
}

function senderLabel(ctx) {
  const from = ctx.from;
  if (!from) {
    return "unknown";
  }

  const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
  return `${name || from.username || "unknown"} (${from.id})`;
}

function telegramMessageKey(ctx) {
  const chatId = ctx.chat?.id;
  const messageId = ctx.message?.message_id;
  if (!chatId || !messageId) {
    return "";
  }

  return `${chatId}:${messageId}`;
}

async function getTelegramFileUrl(ctx, fileId) {
  const link = await ctx.telegram.getFileLink(fileId);
  return link.href;
}

function extractText(ctx) {
  return ctx.message?.text || ctx.message?.caption || "";
}

async function extractImageUrl(ctx) {
  const photos = ctx.message?.photo;
  if (photos?.length) {
    const largestPhoto = photos[photos.length - 1];
    return getTelegramFileUrl(ctx, largestPhoto.file_id);
  }

  const document = ctx.message?.document;
  if (document?.mime_type?.startsWith("image/")) {
    return getTelegramFileUrl(ctx, document.file_id);
  }

  return null;
}

async function handleRecord(ctx) {
  if (!isAllowed(ctx)) {
    await ctx.reply("이 봇을 사용할 권한이 없어요.");
    return;
  }

  const text = extractText(ctx);
  const imageUrl = await extractImageUrl(ctx);

  if (!text && !imageUrl) {
    await ctx.reply("텍스트, 사진, 또는 이미지 파일을 보내주세요.");
    return;
  }

  const messageKey = telegramMessageKey(ctx);

  try {
    if (await hasNotionRecord(messageKey)) {
      await ctx.reply("이미 Notion에 저장된 메시지라 건너뛰었어요.");
      return;
    }
  } catch (error) {
    console.error("Failed to check duplicate Notion record", error);
  }

  const processingMessage = await ctx.reply("기록을 읽고 Notion에 정리하는 중이에요.");

  try {
    const analysis = await analyzeRecord({ text, imageUrl });
    const page = await createNotionRecord({
      analysis,
      originalText: text,
      imageUrl,
      telegramUser: senderLabel(ctx),
      telegramMessageKey: messageKey,
      createdAt: new Date((ctx.message?.date || Math.floor(Date.now() / 1000)) * 1000),
    });

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMessage.message_id,
      undefined,
      [
        "Notion에 저장했어요.",
        `유형: ${analysis.recordType}`,
        `성장 신호: ${analysis.growthSignals.join(", ")}`,
        `대표 기록: ${analysis.isRepresentative ? "예" : "아니오"}`,
        page.url,
      ].join("\n")
    );
  } catch (error) {
    console.error(error);
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMessage.message_id,
        undefined,
        "저장 중 문제가 생겼어요. 다음 run-bot 실행 때 다시 시도할게요."
      );
    } catch (replyError) {
      console.error("Failed to send error message to Telegram", replyError);
    }

    if (shouldRethrowHandlerErrors) {
      throw error;
    }
  }
}

async function fetchTelegramUpdates(params) {
  return bot.telegram.callApi("getUpdates", params);
}

async function confirmTelegramUpdates(offset) {
  await fetchTelegramUpdates({
    offset,
    limit: 1,
    timeout: 0,
    allowed_updates: ["message"],
  });
}

export async function processPendingUpdates() {
  await bot.telegram.callApi("deleteWebhook", { drop_pending_updates: false });

  let offset;
  let processedCount = 0;

  while (true) {
    const updates = await fetchTelegramUpdates({
      offset,
      limit: 100,
      timeout: 0,
      allowed_updates: ["message"],
    });

    if (updates.length === 0) {
      console.log(`No pending Telegram updates left. Processed ${processedCount} update(s).`);
      return;
    }

    for (const update of updates) {
      try {
        await bot.handleUpdate(update);
        offset = update.update_id + 1;
        await confirmTelegramUpdates(offset);
        processedCount += 1;
      } catch (error) {
        console.error(`Stopped before confirming Telegram update ${update.update_id}`, error);
        throw error;
      }
    }
  }
}

bot.start((ctx) =>
  ctx.reply("아이의 말, 일기, 부모 메모, 손그림이나 사진을 보내면 GPT로 분석해서 Notion에 저장할게요.")
);

bot.on(["text", "photo", "document"], handleRecord);
