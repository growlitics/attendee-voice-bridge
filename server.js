import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 10000;
const SAMPLE_RATE = 16000;

function makeBeepPcmBase64(durationSeconds = 1, frequency = 440) {
  const samples = SAMPLE_RATE * durationSeconds;
  const buffer = Buffer.alloc(samples * 2);

  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.25;
    buffer.writeInt16LE(Math.floor(sample * 32767), i * 2);
  }

  return buffer.toString("base64");
}

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Attendee voice bridge running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Attendee connected");

  setTimeout(() => {
    console.log("Sending test beep to meeting");

    ws.send(JSON.stringify({
      trigger: "realtime_audio.bot_output",
      data: {
        chunk: makeBeepPcmBase64(),
        sample_rate: SAMPLE_RATE
      }
    }));
  }, 3000);

  ws.on("message", (msg) => {
    console.log("Received:", msg.toString().slice(0, 200));
  });

  ws.on("close", () => {
    console.log("Attendee disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
