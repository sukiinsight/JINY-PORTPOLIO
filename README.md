# JINY Portfolio - Telegram to Notion Automation

Telegram 봇으로 보낸 손그림, 손글씨, 일기, 느낀 점을 자동으로 Notion 데이터베이스에 저장하는 시스템입니다.

## 기능

- 📱 Telegram 봇 메시지 수신
- 🤖 OpenAI GPT를 통한 자동 분석 & 분류
- 📝 Notion 데이터베이스 자동 저장
- 🖼️ 이미지 첨부 및 관리
- 🏷️ 자동 태깅 (기록 유형, 성장 신호 등)

## 프로젝트 구조

```
telegram-notion-automation/
├── src/
│   ├── bot.js                 # Telegram 봇 메인 로직
│   ├── notion.js              # Notion API 연동
│   ├── gpt.js                 # GPT 분석 로직
│   ├── handlers/
│   │   ├── messageHandler.js
│   │   ├── photoHandler.js
│   │   └── fileHandler.js
│   └── utils/
│       ├── logger.js
│       └── config.js
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## 시작하기

자세한 설치 및 설정 방법은 `docs/SETUP.md`를 참고하세요.
