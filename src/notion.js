import { Client } from "@notionhq/client";
import { config } from "./config.js";

const notion = new Client({ auth: config.NOTION_API_KEY });

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

export async function createNotionRecord({
  analysis,
  originalText,
  imageUrl,
  telegramUser,
  createdAt
}) {
  const children = [
    paragraph(analysis.summary),
    paragraph(`다음 경험: ${analysis.nextExperience}`)
  ];

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

  return notion.pages.create({
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
        rich_text: richText(originalText)
      },
      "Telegram 사용자": {
        rich_text: richText(telegramUser)
      }
    },
    children
  });
}
