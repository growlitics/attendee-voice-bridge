import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Attendee voice bridge running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Attendee connected");

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
