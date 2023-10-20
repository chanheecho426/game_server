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
const inputsMap = {};
let players = [];
let arrows = [];
let slashes = [];
let thrusts = [];
let rocks=[
  {x:150,y:148},
  {x:1400,y:448},
  {x:250,y:408},
  {x:1300,y:137},
  {x:658,y:589},
  {x:784,y:371},
  {x:374,y:14},
  {x:710,y:90},
  {x:1249,y:127}];
  let randomRespawn =0;
  


function colliding(rect1,rect2) {
  return (rect1.x < rect2.x + rect2.w &&
  rect1.x + rect1.w > rect2.x &&
  rect1.y < rect2.y + rect2.h &&
  rect1.y + rect1.h > rect2.y)
}
function isCollidingWithRock(player) {
  for (const rock of rocks) {
    if (colliding({...player,w:40,h:40},{...rock,w:80,h:70})) {
      return true;
    }
  }
}


function tick(delta) {
  //movement
  for (const player of players) {
    const previousX=player.x;
    const previousY=player.y;
    const inputs = inputsMap[player.id];
    if (inputs.up) {
      if (player.y > 0) {
        player.y -= player.speed * player.speedTimes;
      } else {
        player.y = 0;
      }
    } else if (inputs.down) {
      if (player.y < 700) {
        player.y += player.speed * player.speedTimes;
      } else {
        player.y = 700;
      }
    }

    if (isCollidingWithRock(player)) {
      player.y= previousY
    }

    if (inputs.right) {
      if (player.x < 1500) {
        player.direction = "right";
        player.x += player.speed * player.speedTimes;
      } else {
        player.x = 1500;
      }
    } else if (inputs.left) {
      if (player.x > 0) {
        player.direction = "left"
        player.x -= player.speed * player.speedTimes
      } else {
        player.x = 0;
      }
    }
    if (isCollidingWithRock(player)) {
      player.x= previousX
    }
  }

  for (const player of players) {
    if (player.slowTimer > 0) {
      player.speedTimes = 0.5
      player.slowTimer -= delta;
    } else {
      player.speedTimes = 1;
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
      if (distance <= 40) {

        if (player.playerType == 3 && player.skillUse > 0) {
          io.emit("upGradeAttack",10);
          player.attack=10;
          player.skillUse = -1;
        } else if (arrow.slow) {
          player.slowTimer = 1500;
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
      if (distance <= 75 && slash.hitPlayer == 0) {

        if (player.playerType == 3 && player.skillUse > 0) {
          io.emit("upGradeAttack",10);
          player.attack=10;
          player.skillUse = -1;
        }
        player.Hp -= slash.damage * player.takenAttack;


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
      const distance = Math.sqrt(((player.x + 20) - (thrust.x + 13 + (25 * Math.cos(thrust.angle)))) ** 2 + ((player.y + 20) - (thrust.y - 22 + (25 * Math.sin(thrust.angle)))) ** 2);
      if (distance <= 60 && thrust.hitPlayer == 0) {

        if (player.playerType == 3 && player.skillUse > 0) {
          io.emit("upGradeAttack",10);
          player.attack=10;
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
      randomRespawn = parseInt(Math.random()*100%4) //이거 보셈
      player.x = 10+1480*parseInt(randomRespawn/2); //존나 지능 플레이
      player.y = 10+655*parseInt(randomRespawn%2); //보셈 존나 개쩖
      player.Hp = 20;
      if (player.playerType==3) {
        player.attack=5;
      }
    }
  }
  //skills
  for (const player of players) {
    //default settings
    player.speed = 5;
    player.takenAttack = 1;
    if (player.skillUse > 0) {
      if (player.playerType == 1) {
        player.speed = 25;
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
  io.emit("rocks", rocks);
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
    randomRespawn = parseInt(Math.random()*100%4) //이거 보셈!
    players.push({
      id: socket.id,
      x: 10+1480*parseInt(randomRespawn/2), //존나 지능 플레이
      y: 10+655*parseInt(randomRespawn%2), //보셈 존나 개쩖
      playerType: 0,
      Hp: 20,
      skillUse: 0,
      speed: 5,
      speedTimes: 1,
      takenAttack: 1,
      attack: 0,
      direction: "right",
      slowTimer: 0
    });

    socket.emit('map', map2D);
    //key movements
    socket.on('inputs', (inputs) => {
      inputsMap[socket.id] = inputs;
    });
    //arrow
    socket.on('arrow', (angle, slow) => {
      const player = players.find(player => player.id === socket.id)
      arrows.push({
        angle,
        x: player.x + 10,
        y: player.y + 20,
        timeLeft: 1000,
        playerId: socket.id,
        slow: slow
      })
    })
    //slash
    socket.on('slash', (angle,playerDamage) => {
      const player = players.find(player => player.id === socket.id)
      slashes.push({
        angle,
        hitPlayer: 0,
        x: player.x,
        y: player.y - 40,
        timeLeft: 200,
        damage: playerDamage,
        playerId: socket.id
      })
      player.attack=5;
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
      player.skillUse = 200;
    })
    //knockback arrow
    //shield
    socket.on('shield', (id) => {
      const player = players.find(player => player.id === id)
      player.skillUse = 1500;
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