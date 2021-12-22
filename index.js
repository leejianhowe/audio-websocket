const fs = require("fs");
const ws = require("ws");
const path = require("path");
const express = require("express");
const http = require("http");
const server = new ws.WebSocketServer({ port: 8080 });

server.on("connection", (wsConn, req) => {
  console.log("connection open");
  const music = fs.createReadStream(__dirname + "/assets/sample.mp3");
  const duplex = ws.createWebSocketStream(wsConn);
  music.pipe(duplex);
  // music.on("data", (chunk) => {
  //   console.log(chunk.length)
  //   wsConn.send(chunk);
  // });
  // const id = setInterval(() => {
  //   const buffer = music.read(10000);
  //   console.log(buffer);
  //   if (buffer === null) {
  //     clearInterval(id);
  //   }
  //   wsConn.send(buffer);
  // }, 1000);
  music.on("ready",()=>console.log('ready'))
  music.on("end", () => console.log("stream ended"));
  music.on("close", () => {
    console.log("stream close");
  });
  wsConn.on("error", (err) => {
    console.log(error);
  });
  wsConn.on("close", () => {
    console.log("client disconnected");
  });
});

server.on("close", (code, reason) => {
  console.log("connection close", code, reason);
});
const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.listen(3001, () => {
  console.log("server started");
});
