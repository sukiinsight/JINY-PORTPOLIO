# JINY Portfolio - Telegram Notion Child Journal Bot

Telegram으로 보낸 손그림, 손글씨, 일기, 느낀 점, 아이의 말, 부모 관찰 메모, 사진 기록을 GPT가 분석하고 Notion 데이터베이스에 자동 저장하는 봇입니다.

사용할 Telegram 봇: [@Jiny_portf_bot](https://t.me/Jiny_portf_bot)

## 기능

- Telegram 텍스트, 사진, 이미지 파일 수신
- 사진 캡션과 이미지 내용을 함께 GPT로 분석
- 기록 유형, 성장 신호, 아이의 한 문장, 부모 관찰 메모, 다음 경험, 대표 기록 여부 자동 분류
- Notion 데이터베이스에 구조화된 속성으로 저장
- 이미지가 있으면 Notion 페이지 본문에 이미지 블록으로 첨부
- 허용 Telegram 사용자 ID 제한 옵션
- 개발 환경 polling, 운영 환경 webhook 지원

## GitHub Actions로 빠른 테스트

GitHub Actions에서는 장시간 실행되는 봇 서버를 켜지 않습니다. `npm run test:once`가 환경 변수를 확인하고 Telegram 테스트 메시지를 1회 전송한 뒤 바로 종료합니다.

GitHub Secrets에 아래 값을 넣은 뒤 테스트 워크플로를 수동 실행할 수 있습니다.

필수 Repository secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`

실행 순서:

1. GitHub repo에서 `Actions` 탭으로 이동
2. `Run Telegram bot test` workflow 선택
3. `Run workflow` 클릭
4. Telegram으로 테스트 메시지가 1회 도착하는지 확인

이 테스트 workflow는 실제 메시지 수신 봇을 실행하지 않으므로 Notion 저장까지 검증하지 않습니다. Telegram 메시지를 실시간 수신해서 Notion에 저장하는 운영 봇은 Render 또는 Railway 같은 상시 실행 서버에 배포해야 합니다.

## 실제 운영 배포

`npm start`는 `src/index.js`를 실행하며 Telegram 봇을 계속 켜두는 운영용 명령입니다. GitHub Actions에서는 사용하지 말고, Render 또는 Railway처럼 프로세스를 계속 실행할 수 있는 서버에서 사용하세요.

운영 환경 변수:

```env
TELEGRAM_BOT_TOKEN=...
OPENAI_API_KEY=...
NOTION_API_KEY=...
NOTION_DATABASE_ID=...
```

Render 또는 Railway 배포 예시:

1. GitHub 저장소를 Render 또는 Railway에 연결
2. 서비스 타입은 Node.js 웹 서비스 또는 워커로 생성
3. Install command는 `npm install`로 설정
4. Start command는 `npm start`로 설정
5. 위 운영 환경 변수를 서비스 환경 변수에 등록
6. webhook 운영을 원하면 `PUBLIC_WEBHOOK_URL`과 `PORT`도 설정

`PUBLIC_WEBHOOK_URL`이 없으면 polling 방식으로 동작하고, 설정되어 있으면 webhook 방식으로 동작합니다.

## Notion 데이터베이스 속성

아래 속성 이름과 타입을 Notion 데이터베이스에 만들어주세요.

| 속성명 | 타입 |
| --- | --- |
| 이름 | Title |
| 기록일 | Date |
| 기록 유형 | Select |
| 성장 신호 | Multi-select |
| 아이의 한 문장 | Rich text |
| 부모 관찰 메모 | Rich text |
| 다음 경험 | Rich text |
| 대표 기록 | Checkbox |
| 원문 | Rich text |
| Telegram 사용자 | Rich text |

추천 `기록 유형` 옵션:

- 손그림
- 손글씨
- 일기
- 느낀 점
- 아이의 말
- 부모 관찰 메모
- 사진 기록
- 복합 기록

추천 `성장 신호` 옵션:

- 언어 표현
- 감정 인식
- 상상력
- 문제 해결
- 사회성
- 신체 발달
- 자기조절
- 호기심
- 기억과 회상
- 독립성
- 가족 관계
- 예술 표현

Notion integration을 만든 뒤 해당 데이터베이스에 integration을 초대해야 저장됩니다.

## 설치

```bash
npm install
cp .env.example .env
```

`.env`를 채웁니다.

```env
TELEGRAM_BOT_TOKEN=...
OPENAI_API_KEY=...
NOTION_API_KEY=...
NOTION_DATABASE_ID=...
```

`TELEGRAM_BOT_TOKEN`에는 `@Jiny_portf_bot` 이름이 아니라 BotFather가 발급한 토큰 값을 넣어야 합니다.

## 실행

개발 환경에서는 polling으로 실행됩니다.

```bash
npm run dev
```

운영 환경에서 webhook을 쓰려면 `PUBLIC_WEBHOOK_URL`을 설정하세요.

```env
PUBLIC_WEBHOOK_URL=https://your-domain.example.com
PORT=3000
```

```bash
npm start
```

## 사용법

Telegram에서 [@Jiny_portf_bot](https://t.me/Jiny_portf_bot)에게 아래처럼 보내면 됩니다.

- 텍스트만 보내기: 아이의 말, 일기, 부모 메모 등
- 사진 + 캡션 보내기: 손그림, 손글씨, 사진 기록 등
- 이미지 파일 보내기: 원본 화질이 필요할 때

봇이 분석 후 Notion 페이지 URL을 답장합니다.

## 이미지 첨부 참고

현재 구현은 Telegram 파일 URL을 Notion 이미지 블록의 external URL로 저장합니다. Telegram 파일 URL은 영구 보관용 저장소가 아니므로 장기 보존이 꼭 필요하면 S3, Cloudflare R2 같은 이미지 저장소를 붙인 뒤 그 공개 URL을 Notion에 넣는 방식으로 확장하세요.

## 보안

`.env`는 절대 커밋하지 마세요. 이 저장소에는 `.env.example`만 포함합니다.
