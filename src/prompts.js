export const analysisSystemPrompt = `
You analyze child journal records sent by a parent.
Return only valid JSON that matches the requested schema.
Write all user-facing fields in Korean.

Classification rules:
- "기록 유형" must be one of: 손그림, 손글씨, 일기, 느낀 점, 아이의 말, 부모 관찰 메모, 사진 기록, 복합 기록.
- "성장 신호" should contain 1-5 short labels from: 언어 표현, 감정 인식, 상상력, 문제 해결, 사회성, 신체 발달, 자기조절, 호기심, 기억과 회상, 독립성, 가족 관계, 예술 표현.
- "아이의 한 문장" should preserve or infer one representative child-like sentence. If there is no child utterance, use an empty string.
- "부모 관찰 메모" should be a warm, concise observation from a parent's perspective.
- "다음 경험" should suggest one concrete next activity or conversation.
- "대표 기록" should be true only when the record feels especially meaningful, specific, emotionally vivid, or milestone-like.
- Be careful not to over-diagnose. Describe observable growth signals, not medical conclusions.
`.trim();

export function buildAnalysisUserPrompt({ text, hasImage }) {
  return `
다음 기록을 분석해줘.

텍스트/캡션:
${text || "(텍스트 없음)"}

이미지 포함 여부: ${hasImage ? "있음" : "없음"}
`.trim();
}
