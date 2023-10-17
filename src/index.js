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
const ARROW_SPEED = 30;
const TICK_RATE = 60;

//attack,players
let players = [];
let arrows = [];
let slashes = [];
let thrusts = [];
const inputsMap = {};

function tick(delta) {
  //movement
  for (const player of players) {
    const inputs = inputsMap[player.id];//1510 675
    if (inputs.up) {
      if (player.y>0) {
        player.y -= player.speed
      } else { 
        player.y = 0
      }

    } else if (inputs.down) {
      if (player.y<675) {
        player.y += player.speed
      } else {
        player.y = 675;
      }
    }
    if (inputs.right) {
      player.direction="right"
      if (player.x<1510) {
        player.x += player.speed
      } else {
        player.x =1510
      }
    } else if (inputs.left) {
      player.direction="left"
      if (player.x>0) {
        player.x -= player.speed
      } else {
        player.x=0;
      }
    }

  }

  for (const player of players) {
    if (player.kbtime > 0) {
      player.x -= Math.cos(player.kbangle) * 30
      player.y -= Math.sin(player.kbangle) * 30
      player.kbtime -= delta
    }
  }

  //arrows
  for (const arrow of arrows) {
    arrow.x += Math.cos(arrow.angle) * ARROW_SPEED;
    arrow.y += Math.sin(arrow.angle) * ARROW_SPEED;
    arrow.timeLeft -= delta;

    for (const player of players) {
      if (player.id === arrow.playerId) continue;
      const [attacker] = players.filter((player) => player.id === arrow.playerId);
      const distance = Math.sqrt((((player.x + 20) - (arrow.x + 11))) ** 2 + ((player.y + 20) - (arrow.y + 3)) ** 2);
      if (distance <= 20) {

        if (player.playerType == 3 && player.skillUse > 0) {
          player.attack = 10;
          player.skillUse = -1;
        } else if (arrow.kbArrow) {
          player.kbangle = arrow.angle + 3.14;
          player.kbtime = 100;
        }

        player.Hp -= attacker.attack * player.takenAttack
        if (player.Hp <= 0) {
          attacker.Hp += 5
          if (attacker.Hp > 20) {
            attacker.Hp = 20
          }
        }

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
      const [attacker] = players.filter((player) => player.id === slash.playerId);
      const distance = Math.sqrt(((player.x + 20) - (slash.x + 20 + (30 * Math.cos(slash.angle)))) ** 2 + ((player.y + 20) - (slash.y + 60 + (30 * Math.sin(slash.angle)))) ** 2);
      if (distance <= 50 && slash.hitPlayer == 0) {

        if (player.playerType == 3 && player.skillUse > 0) {
          player.attack = 10;
          player.skillUse = -1;
        }

        player.Hp -= attacker.attack * player.takenAttack;

        if (attacker.attack == 10) {
          attacker.attack = 5;
        }

        if (player.Hp <= 0) {
          attacker.Hp += 5
          if (attacker.Hp > 20) {
            attacker.Hp = 20
          }
        }

        slash.hitPlayer = 1;
        break;
      }
    }

  }
  //thrusts
  for (const thrust of thrusts) {
    thrust.timeLeft -= delta;
    for (const player of players) {
      if (player.id === thrust.playerId) continue;
      const [attacker] = players.filter((player) => player.id === thrust.playerId);
      const distance = Math.sqrt(((player.x + 20) - (thrust.x + 13 + (45 * Math.cos(thrust.angle)))) ** 2 + ((player.y + 20) - (thrust.y - 22 + (45 * Math.sin(thrust.angle)))) ** 2);
      if (distance <= 25 && thrust.hitPlayer == 0) {

        if (player.playerType == 3 && player.skillUse > 0) {
          player.attack = 10;
          player.skillUse = -1;
        }

        player.Hp -= attacker.attack * player.takenAttack;

        if (player.Hp <= 0) {
          attacker.Hp += 5
          if (attacker.Hp > 20) {
            attacker.Hp = 20
          }
        }

        thrust.hitPlayer = 1;
        break;
      }
    }

  }

  for (const player of players) {
    if (player.Hp <= 0) {
      player.x = 1510/2;
      player.y = 675/2;
      player.Hp = 20;
    }
  }
  //skills
  for (const player of players) {
    //default settings
    player.speed = 5;
    player.takenAttack = 1;
    if (player.skillUse > 0) {
      if (player.playerType == 1) {
        player.speed = 15;
        player.takenAttack = 0;
        player.skillUse -= delta
      } else if (player.playerType == 2) {

        player.skillUse -= delta
      } else if (player.playerType == 3) {
        player.takenAttack = 0;
        player.skillUse -= delta
      }
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
      x: 20,
      y: 20,
      playerType: 0,
      Hp: 20,
      skillUse: 0,
      speed: 5,
      takenAttack: 1,
      attack: 0,
      kbtime: -1,
      kbangle: 0,
      direction: "right"
    });

    socket.emit('map', map2D);
    //key movements
    socket.on('inputs', (inputs) => {
      inputsMap[socket.id] = inputs;
    });
    //arrow
    socket.on('arrow', (angle, kb) => {
      const player = players.find(player => player.id === socket.id)
      arrows.push({
        angle,
        x: player.x + 10,
        y: player.y + 20,
        timeLeft: 1000,
        playerId: socket.id,
        kbArrow: kb
      })
      if (kb == true) {
        player.kbangle = angle
        player.kbtime = 50
      }
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
        x: player.x + 15,
        y: player.y + 38,
        timeLeft: 90,
        playerId: socket.id
      })
    })
    //roll
    socket.on('roll', (id) => {
      const player = players.find(player => player.id === id)
      player.skillUse = 100;
    })
    //knockback arrow
    //shield
    socket.on('shield', (id) => {
      const player = players.find(player => player.id === id)
      player.skillUse = 750;
    })


    //disconnect
    socket.on("disconnect", () => {
      players = players.filter((player) => player.id !== socket.id);
    })

    socket.on('arrows', (serverArrows) => {
      arrows = serverArrows
    })

    socket.on('character_change', (PlayerId, CharacterNumber, CharacterAttack) => {
      const player = players.find(player => player.id === PlayerId)
      if (player.id == PlayerId) {
        player.playerType = CharacterNumber
        player.attack = CharacterAttack
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