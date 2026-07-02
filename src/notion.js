import { Client } from "@notionhq/client";
import { config } from "./config.js";

const notion = new Client({ auth: config.NOTION_API_KEY });

function isRetryableNetworkError(error) {
  const message = String(error?.message || "");
  return [
    "Premature close",
    "ERR_STREAM_PREMATURE_CLOSE",
    "ECONNRESET",
    "ETIMEDOUT",
    "FetchError"
  ].some((value) => message.includes(value) || error?.code === value);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(label, operation) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableNetworkError(error) || attempt === 3) {
        throw error;
      }

      console.warn(`${label} failed on attempt ${attempt}; retrying...`, error);
      await wait(1000 * attempt);
    }
  }

  throw lastError;
}

function richText(content) {
  if (!content) {
    return [];
  }

  return [
    {
      type: "text",
      text: { content: content.slice(0, 2000) }
    }
  ];
}

function paragraph(content) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: richText(content)
    }
  };
}

function telegramMessageMarker(telegramMessageKey) {
  return telegramMessageKey ? `[Telegram 메시지 ID: ${telegramMessageKey}]` : "";
}

export async function hasNotionRecord(telegramMessageKey) {
  const marker = telegramMessageMarker(telegramMessageKey);
  if (!marker) {
    return false;
  }

  const response = await withRetry("Notion duplicate check", () => notion.databases.query({
    database_id: config.NOTION_DATABASE_ID,
    filter: {
      property: "원문",
      rich_text: {
        contains: marker
      }
    },
    page_size: 1
  }));

  return response.results.length > 0;
}

export async function createNotionRecord({
  analysis,
  originalText,
  imageUrl,
  telegramUser,
  telegramMessageKey,
  createdAt
}) {
  const marker = telegramMessageMarker(telegramMessageKey);
  const originalTextWithMarker = [marker, originalText].filter(Boolean).join("\n\n");
  const children = [
    paragraph(analysis.summary),
    paragraph(`다음 경험: ${analysis.nextExperience}`)
  ];

  if (marker) {
    children.push(paragraph(marker));
  }

  if (imageUrl) {
    children.push({
      object: "block",
      type: "image",
      image: {
        type: "external",
        external: { url: imageUrl }
      }
    });
  }

  return withRetry("Notion page create", () => notion.pages.create({
    parent: { database_id: config.NOTION_DATABASE_ID },
    properties: {
      이름: {
        title: richText(analysis.title)
      },
      기록일: {
        date: { start: createdAt.toISOString() }
      },
      "기록 유형": {
        select: { name: analysis.recordType }
      },
      "성장 신호": {
        multi_select: analysis.growthSignals.map((name) => ({ name }))
      },
      "아이의 한 문장": {
        rich_text: richText(analysis.childQuote)
      },
      "부모 관찰 메모": {
        rich_text: richText(analysis.parentObservation)
      },
      "다음 경험": {
        rich_text: richText(analysis.nextExperience)
      },
      "대표 기록": {
        checkbox: analysis.isRepresentative
      },
      원문: {
        rich_text: richText(originalTextWithMarker)
      },
      "Telegram 사용자": {
        rich_text: richText(telegramUser)
      }
    },
    children
  }));
}
