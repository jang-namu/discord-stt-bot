require('dotenv').config();
const { Client, GatewayIntentBits } = require("discord.js");
const { 
    joinVoiceChannel, 
    getVoiceConnection, 
    EndBehaviorType 
} = require("@discordjs/voice");
const { 
    TranscribeStreamingClient,
    StartStreamTranscriptionCommand 
} = require("@aws-sdk/client-transcribe-streaming");
const prism = require("prism-media");
const fs = require("fs");
const path = require("path");

// 환경변수 유효성 검사
const requiredEnvVars = [
    'DISCORD_TOKEN',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ 필수 환경변수가 없습니다: ${envVar}`);
        console.error('올바른 .env 파일을 설정해주세요.');
        process.exit(1);
    }
}

// 디렉토리 생성 함수
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// 녹음 및 변환 텍스트 저장 디렉토리 생성
ensureDirectoryExists("recordings");
ensureDirectoryExists("transcribe");

// AWS 설정
const transcribeClient = new TranscribeStreamingClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 현재 녹음 세션 관리를 위한 Map
const activeRecordingSessions = new Map();

client.on("messageCreate", async message => {
    if (message.content === "!join") {
        if (message.member.voice.channel) {
            const connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });
            message.reply("🎙️ 음성 채널에 접속했습니다!");
        } else {
            message.reply("❌ 먼저 음성 채널에 들어가 주세요!");
        }
    }

    if (message.content === "!leave") {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            // 녹음 세션 정보 삭제
            activeRecordingSessions.delete(message.guild.id);
            message.reply("👋 음성 채널에서 나갔습니다!");
        } else {
            message.reply("❌ 음성 채널에 접속해 있지 않습니다!");
        }
    }

    if (message.content === "!record") {
        const connection = getVoiceConnection(message.guild.id);
        if (!connection) {
            message.reply("❌ 먼저 `!join`으로 봇을 음성 채널에 추가하세요!");
            return;
        }

        // 새로운 녹음 세션 시작
        const sessionId = Date.now().toString();
        const transcribeFile = path.join("transcribe", `session_${sessionId}.txt`);
        
        // 세션 정보 저장
        activeRecordingSessions.set(message.guild.id, {
            sessionId,
            transcribeFile
        });

        // 세션 시작 정보 기록
        fs.writeFileSync(transcribeFile, `=== 음성 인식 세션 시작: ${new Date().toLocaleString()} ===\n\n`);

        const receiver = connection.receiver;
        receiver.speaking.on("start", userId => {
            recordUserAudio(userId, receiver, message, sessionId);
        });

        message.reply("🎙️ 음성 녹음을 시작합니다...");
    }
});

async function* generateTranscribeInput(audioStream) {
    for await (const chunk of audioStream) {
        yield { AudioEvent: { AudioChunk: chunk } };
    }
}

async function recordUserAudio(userId, receiver, message, sessionId) {
    const user = client.users.cache.get(userId);
    if (!user) return;

    const session = activeRecordingSessions.get(message.guild.id);
    if (!session) return;

    console.log(`🎤 ${user.username}의 음성 감지됨`);

    // 녹음 파일 경로 설정
    const recordingFile = path.join("recordings", `${sessionId}_${user.username}_${Date.now()}.pcm`);
    
    const audioStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000
        }
    });

    const pcmStream = new prism.opus.Decoder({ 
        frameSize: 960, 
        channels: 1, 
        rate: 16000 
    });
    
    // 음성 데이터를 파일로 저장
    const fileStream = fs.createWriteStream(recordingFile);
    pcmStream.pipe(fileStream);
    audioStream.pipe(pcmStream);

    try {
        const transcribeCommand = new StartStreamTranscriptionCommand({
            LanguageCode: "ko-KR",
            MediaEncoding: "pcm",
            MediaSampleRateHertz: 16000,
            AudioStream: generateTranscribeInput(pcmStream)
        });

        const transcribeResponse = await transcribeClient.send(transcribeCommand);

        for await (const event of transcribeResponse.TranscriptResultStream) {
            if (event.TranscriptEvent?.Transcript?.Results?.[0]) {
                const result = event.TranscriptEvent.Transcript.Results[0];
                if (result.IsPartial === false && result.Alternatives?.[0]?.Transcript) {
                    const transcribedText = result.Alternatives[0].Transcript;
                    const timestamp = new Date().toLocaleString();
                    
                    // 콘솔에 출력
                    // console.log(`📝 ${user.username}: ${transcribedText}`);
                    
                    // 디스코드 채널에 전송
                    // message.channel.send(`📝 **${user.username}**: ${transcribedText}`);
                    
                    // 파일에 저장
                    const textToWrite = `[${timestamp}] ${user.username}: ${transcribedText}\n`;
                    fs.appendFileSync(session.transcribeFile, textToWrite);
                }
            }
        }
    } catch (error) {
        console.error("Amazon Transcribe 오류:", error);
        message.channel.send(`❌ 음성 인식 중 오류가 발생했습니다: ${error.message}`);
        
        // 오류 정보도 파일에 기록
        const errorText = `[${new Date().toLocaleString()}] 오류 발생: ${error.message}\n`;
        fs.appendFileSync(session.transcribeFile, errorText);
    }
}

client.once("ready", () => {
    console.log(`✅ 로그인 성공! 봇 ID: ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);