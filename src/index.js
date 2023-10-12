//BACKEND

//CROS 방지로 직접 ip 주소를 적어넣는 방법을 이용함, 따라서 매번 주소 바꿀 필요 있음
//server running is 'npm run dev' btw if you forget

//socket creating 
const { rejects } = require("assert");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");    

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const loadMap = require("./mapLoader.js");

async function main() { //map loading(takes a long time,so use a promise method)
  const map2D = await loadMap()
  //console.log(map2D)
  io.on("connect", (socket) => {
      console.log("user connected",socket.id);
      socket.emit('map',map2D);
  });



  app.use(express.static("public"));

  httpServer.listen(5000,()=>{console.log("server running")});
}

main();
