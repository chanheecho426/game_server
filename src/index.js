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
const ARROW_SPEED = 30;
const TICK_RATE = 60;


let players = [];
let arrows = [];
let slashes = [];
let thrusts = [];
const inputsMap = {};

function tick(delta) {
  for (const player of players) {
    const inputs = inputsMap[player.id];
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
  //arrows
  for (const arrow of arrows) {
    arrow.x += Math.cos(arrow.angle) * ARROW_SPEED;
    arrow.y += Math.sin(arrow.angle) * ARROW_SPEED;
    arrow.timeLeft -= delta;

    for (const player of players) {
      if (player.id === arrow.playerId) continue;
      const distance = Math.sqrt((((player.x + 20) - (arrow.x + 11))) ** 2 + ((player.y + 20) - (arrow.y + 3)) ** 2);
      if (distance <= 20) {
        player.Hp -= 4
        arrow.timeLeft = -1;
        break;
      }

    }
  }
  //slashes
  for (const slash of slashes) {
    slash.timeLeft -= delta;
    for (const player of players) {
      if (player.id === slash.playerId) continue;
      const distance = Math.sqrt(((player.x + 20) - (slash.x + 10 + (30 * Math.cos(slash.angle)))) ** 2 + ((player.y + 20) - (slash.y + 60 + (30 * Math.sin(slash.angle)))) ** 2);
      if (distance <= 50 && slash.hitPlayer==0) {
        player.Hp -= 5
        slash.hitPlayer =1;
        break;
      }
    }

  }
  //thrusts
  for (const thrust of thrusts) {
    thrust.timeLeft -= delta;
    for (const player of players) {
      if (player.id === thrust.playerId) continue;
      const distance = Math.sqrt(((player.x + 20) - (thrust.x + 1 + (45 * Math.cos(thrust.angle)))) ** 2 + ((player.y + 20) - (thrust.y - 22 + (45 * Math.sin(thrust.angle)))) ** 2);
      if (distance <= 25 && thrust.hitPlayer==0) {
        player.Hp -= 2
        thrust.hitPlayer = 1;
        break;
      }
    }

  }

  for (const player of players) {
    if (player.Hp <= 0) {
      player.x = 0;
      player.y = 0;
      player.Hp = 20;
    }
  }
  arrows = arrows.filter((arrow) => arrow.timeLeft > 0)
  slashes = slashes.filter((slash) => slash.timeLeft > 0)
  thrusts = thrusts.filter((thrust) => thrust.timeLeft > 0)
  io.emit("players", players);
  io.emit("arrows", arrows);
  io.emit("slashes", slashes);
  io.emit("thrusts", thrusts);
};


async function main() { //map loading(takes a long time,so use a promise method)
  const map2D = await loadMap()
  //player
  io.on("connect", (socket) => {
    console.log("user connected", socket.id);

    inputsMap[socket.id] = {
      'up': false,
      'down': false,
      'left': false,
      'right': false
    };

    players.push({
      id: socket.id,
      x: 0,
      y: 0,
      playerType: 0,
      Hp: 20
    });

    socket.emit('map', map2D);
    //key movements
    socket.on('inputs', (inputs) => {
      inputsMap[socket.id] = inputs;
    });
    //arrow
    socket.on('arrow', (angle) => {
      const player = players.find(player => player.id === socket.id)
      arrows.push({
        angle,
        x: player.x + 10,
        y: player.y + 20,
        timeLeft: 1000,
        playerId: socket.id
      })
    })
    //slash
    socket.on('slash', (angle) => {
      const player = players.find(player => player.id === socket.id)
      slashes.push({
        angle,
        hitPlayer: 0,
        x: player.x,
        y: player.y - 40,
        timeLeft: 200,
        playerId: socket.id
      })
    })
    //thrust
    socket.on('thrust', (angle) => {
      const player = players.find(player => player.id === socket.id)
      thrusts.push({
        angle,
        hitPlayer: 0,
        x: player.x + 10,
        y: player.y + 38,
        timeLeft: 90,
        playerId: socket.id
      })
    })
    //disconnect
    socket.on("disconnect", () => {
      players = players.filter((player) => player.id !== socket.id);
    })

    socket.on('arrows', (serverArrows) => {
      arrows = serverArrows
    })

    socket.on('character_change', (PlayerId, CharacterNumber) => {
      const player = players.find(player => player.id === PlayerId)
      if (player.id == PlayerId) {
        player.playerType = CharacterNumber
      }

    })
  });



  app.use(express.static("public"));

  httpServer.listen(5000, () => { console.log("server running") });

  let lastUpdate = Date.now();
  setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdate;
    tick(delta);
    lastUpdate = now
  }, 1000 / TICK_RATE);
}

main();
