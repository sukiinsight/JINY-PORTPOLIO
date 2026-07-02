import OpenAI from "openai";
import { z } from "zod";
import { config } from "./config.js";
import { analysisSystemPrompt, buildAnalysisUserPrompt } from "./prompts.js";

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

const recordTypes = [
  "손그림",
  "손글씨",
  "일기",
  "느낀 점",
  "아이의 말",
  "부모 관찰 메모",
  "사진 기록",
  "복합 기록"
];

const analysisSchema = z.object({
  title: z.string().min(1),
  recordType: z.enum(recordTypes),
  growthSignals: z.array(z.string()).min(1).max(5),
  childQuote: z.string(),
  parentObservation: z.string(),
  nextExperience: z.string(),
  isRepresentative: z.boolean(),
  summary: z.string()
});

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    recordType: { type: "string", enum: recordTypes },
    growthSignals: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" }
    },
    childQuote: { type: "string" },
    parentObservation: { type: "string" },
    nextExperience: { type: "string" },
    isRepresentative: { type: "boolean" },
    summary: { type: "string" }
  },
  required: [
    "title",
    "recordType",
    "growthSignals",
    "childQuote",
    "parentObservation",
    "nextExperience",
    "isRepresentative",
    "summary"
  ]
};

export async function analyzeRecord({ text, imageUrl }) {
  const content = [
    {
      type: "text",
      text: buildAnalysisUserPrompt({ text, hasImage: Boolean(imageUrl) })
    }
  ];

  if (imageUrl) {
    content.push({
      type: "image_url",
      image_url: { url: imageUrl }
    });
  }

  const response = await openai.chat.completions.create({
    model: config.OPENAI_MODEL,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "child_record_analysis",
        strict: true,
        schema: jsonSchema
      }
    },
    messages: [
      { role: "system", content: analysisSystemPrompt },
      { role: "user", content }
    ]
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty analysis response.");
  }

  return analysisSchema.parse(JSON.parse(raw));
}
