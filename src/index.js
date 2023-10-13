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
const SPEED = 5;
const TICK_RATE = 60;


let players= [];
const inputsMap = {};

function tick() {
  for (const player of players) {
    const inputs=inputsMap[player.id];
    if (inputs.up) {
      player.y -= SPEED
    } else if (inputs.down) {
      player.y += SPEED
    } 
    if (inputs.right) {
      player.x += SPEED
    } else if (inputs.left) {
      player.x -= SPEED
    }
  }

  io.emit("players",players);
};


async function main() { //map loading(takes a long time,so use a promise method)
  const map2D = await loadMap()
  //console.log(map2D)
  io.on("connect", (socket) => {
      console.log("user connected",socket.id); 

      inputsMap[socket.id]={
        'up':false,
        'down':false,
        'left':false,
        'right':false
      };

      players.push({
        id:socket.id,
        x:0,
        y:0,
      });

      socket.emit('map',map2D);

      socket.on('inputs',(inputs)=>{
        inputsMap[socket.id]=inputs;
      });

      socket.on("disconnect",()=>{
        players = players.filter((player)=> player.id !==socket.id);
      })


  });



  app.use(express.static("public"));

  httpServer.listen(5000,()=>{console.log("server running")});
  setInterval(tick,1000/TICK_RATE);
}

main();
