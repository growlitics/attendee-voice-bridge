import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 10000;
const SAMPLE_RATE = 16000;

let attendeeSocket = null;

async function speak(text) {
  if (!attendeeSocket || attendeeSocket.readyState !== attendeeSocket.OPEN) {
    console.log("No Attendee socket connected");
    return;
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_16000`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5"
      })
    }
  );

  if (!res.ok) {
    console.log("ElevenLabs error:", await res.text());
    return;
  }

  const pcmBuffer = Buffer.from(await res.arrayBuffer());

  attendeeSocket.send(JSON.stringify({
    trigger: "realtime_audio.bot_output",
    data: {
      chunk: pcmBuffer.toString("base64"),
      sample_rate: SAMPLE_RATE
    }
  }));

  console.log("Sent speech to meeting:", text);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/speak") {
    let body = "";

    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      const { text } = JSON.parse(body || "{}");
      await speak(text || "Hello, Claude is now speaking in the meeting.");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    return;
  }

  res.writeHead(200);
  res.end("Attendee voice bridge running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  attendeeSocket = ws;
  console.log("Attendee connected");

  ws.on("message", (msg) => {
    console.log("Received:", msg.toString().slice(0, 100));
  });

  ws.on("close", () => {
    console.log("Attendee disconnected");
    attendeeSocket = null;
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
