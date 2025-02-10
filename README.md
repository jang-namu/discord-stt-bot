# Discord STT Bot

음성 채널의 대화 내용을 실시간으로 텍스트로 변환하고 저장하는 디스코드 봇입니다. Amazon Transcribe API를 활용하여 고품질의 음성-텍스트 변환을 제공하며, 회의록 작성 자동화에 활용할 수 있습니다.

## 주요 기능

- 실시간 음성-텍스트 변환
- 변환된 텍스트의 채팅창 출력
- 음성 파일 로컬 저장 (`recordings/` 디렉토리)
- 변환 텍스트 누적 저장 (`transcribe/` 디렉토리)
- 세션 단위의 기록 관리

## 시작하기

### 필수 요구사항

- Node.js 16.9.0 이상
- AWS 계정 및 API 접근 권한
- Discord 개발자 계정

### 설치

1. 저장소 클론
```bash
git clone https://github.com/your-username/discord-stt-bot.git
cd discord-stt-bot
```

2. 필요한 패키지 설치
```bash
npm install discord.js @discordjs/voice @aws-sdk/client-transcribe-streaming prism-media dotenv
```

3. 환경 설정
   - `.env.example` 파일을 `.env`로 복사하고 필요한 정보 입력
   ```
   DISCORD_TOKEN=your-discord-token
   AWS_REGION=your-aws-region
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   ```

### Discord 봇 설정

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 새 애플리케이션 생성
2. Bot 섹션에서 봇 생성 및 토큰 발급
3. 다음 봇 권한 활성화:
   - Read Messages/View Channels
   - Send Messages
   - Connect
   - Speak
4. OAuth2 URL 생성하여 원하는 서버에 봇 초대

### 실행

```bash
node index.js
```

## 사용 방법

### 기본 명령어

- `!join`: 현재 음성 채널에 봇 참가
- `!record`: 음성 변환 시작
- `!leave`: 봇 종료 및 채널 퇴장

### 파일 저장 구조

```
project/
├── recordings/        # 원본 음성 파일
│   └── {sessionId}_{username}_{timestamp}.pcm
├── transcribe/        # 변환된 텍스트 파일
│   └── session_{sessionId}.txt
└── index.js
```

## 기술적 세부사항

### 사용된 API 및 라이브러리

- Discord.js: 디스코드 봇 구현
- @discordjs/voice: 음성 채널 접근 및 음성 데이터 처리
- AWS Transcribe: 음성-텍스트 변환
- Prism-media: 음성 인코딩/디코딩

### API 선택 이유

현재 AWS Transcribe API를 사용하는 이유:
- 높은 정확도의 음성 인식
- 실시간 스트리밍 지원
- 한국어 포함 다양한 언어 지원

> **참고**: Vosk 등 로컬 모델을 실험적으로 적용해보았으나, 변환 정확도가 낮아 상용 API 채택

## 향후 계획

- [ ] 자동 회의록 요약 기능 (Anthropic API 연동)
- [ ] 다중 음성 채널 동시 지원
- [ ] 사용자별 음성 프로필 최적화
- [ ] 웹 인터페이스 추가
