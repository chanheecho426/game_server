//FRONTEND
//Local variables
let playerTypeLocal=0;
let arrowRecharge=0;
let slashRecharge=0





//Buttons
const RougeSelectButton = document.querySelector("#RougeSelect");
const ArcherSelectButton = document.querySelector("#ArcherSelect");
const KnightSelectButton = document.querySelector("#KnightSelect");
const DEFAULT = "default";
const HIDDEN = "hidden";


RougeSelectButton.addEventListener("click", selectRouge);
ArcherSelectButton.addEventListener("click", selectArcher);
KnightSelectButton.addEventListener("click", selectKnight);
/*playerType
0 : unselected
1 : rouge
2 : archer
3 : knight
*/
function selectRouge() {
    RougeSelectButton.classList.remove(DEFAULT);
    RougeSelectButton.classList.add(HIDDEN);
    ArcherSelectButton.classList.remove(DEFAULT);
    ArcherSelectButton.classList.add(HIDDEN);
    KnightSelectButton.classList.remove(DEFAULT);
    KnightSelectButton.classList.add(HIDDEN);
    socket.emit("character_change",socket.id,1);
    playerTypeLocal=1;
}

function selectArcher() {
    RougeSelectButton.classList.remove(DEFAULT);
    RougeSelectButton.classList.add(HIDDEN);
    ArcherSelectButton.classList.remove(DEFAULT);
    ArcherSelectButton.classList.add(HIDDEN);
    KnightSelectButton.classList.remove(DEFAULT);
    KnightSelectButton.classList.add(HIDDEN);
    socket.emit("character_change",socket.id,2);
    playerTypeLocal=2;
}

function selectKnight() {
    RougeSelectButton.classList.remove(DEFAULT);
    RougeSelectButton.classList.add(HIDDEN);
    ArcherSelectButton.classList.remove(DEFAULT);
    ArcherSelectButton.classList.add(HIDDEN);
    KnightSelectButton.classList.remove(DEFAULT);
    KnightSelectButton.classList.add(HIDDEN);
    socket.emit("character_change",socket.id,3);
    playerTypeLocal=3;
}
//Showing Basics
const mapImage = new Image();
mapImage.src = "/background.png";

const rougeImage = new Image();
rougeImage.src = "/rouge.png";

const archerImage = new Image();
archerImage.src = "/archer.png";

const knightImage = new Image();
knightImage.src = "/knight.png";

const ArrowImage = new Image();
ArrowImage.src = "/arrow.png";

const SlashImage = new Image();
SlashImage.src = "/slash.png";

const ThrustImage = new Image();
ThrustImage.src = "/thrust.png";

const TestPixelImage = new Image();
TestPixelImage.src = "/SINGLEPIXEL.png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;

const canvas = canvasEl.getContext("2d");
const socket = io('ws://10.244.165.34:5000'); //CROS Error block here

const TILE_SIZE = 16;

socket.on("connect", () => { console.log("logged") });


let map = [[]];
let players = [];
let arrows = [];
let slashes = [];
let thrusts = [];
//drawing function
function drawArrow(canvas, image, x, y, w, h, degrees){
    canvas.save();
    canvas.translate(x+w/2, y+h/2);
    canvas.rotate(degrees);
    canvas.translate(-x-w/2, -y-h/2);
    canvas.drawImage(image, x, y, w, h);
    canvas.restore();
  }
function drawSlash(canvas, image, x, y, w, h, degrees){
    canvas.save();
    canvas.translate(x+15, y+65);
    canvas.rotate(degrees);
    canvas.translate(-x-15, -y-65);
    canvas.drawImage(image, x, y, w, h);
    canvas.restore();
  }
  function drawThrust(canvas, image, x, y, w, h, degrees){
    canvas.save();
    canvas.translate(x+5, y-20);
    canvas.rotate(degrees);
    canvas.translate(-x-5, -y+20);
    canvas.drawImage(image, x, y, w, h);
    canvas.restore();
  }

//bring map(must be done before the show screen process!!!)
socket.on('map', (loadedMap) => {
    map = loadedMap;
});

socket.on('players', (serverPlayers) => {
    players = serverPlayers
})

socket.on('arrows', (serverArrows) => {
    arrows = serverArrows
})

socket.on('slashes',(serverSlashes)=>{
    slashes = serverSlashes
})

socket.on('thrusts',(serverThrusts)=>{
    thrusts = serverThrusts
})

//movement
const inputs = {
    'up': false,
    'down': false,
    'left': false,
    'right': false
};

window.addEventListener('keydown', (e) => {
    if (e.key == 'w') {
        inputs['up'] = true;

    } else if (e.key == 's') {
        inputs['down'] = true;

    } else if (e.key == 'a') {
        inputs['left'] = true;

    } else if (e.key == 'd') {
        inputs['right'] = true;

    }
    socket.emit('inputs', inputs);
});
window.addEventListener('keyup', (e) => {
    if (e.key == 'w') {
        inputs['up'] = false;

    } else if (e.key == 's') {
        inputs['down'] = false;

    } else if (e.key == 'a') {
        inputs['left'] = false;

    } else if (e.key == 'd') {
        inputs['right'] = false;

    }
    socket.emit('inputs', inputs);
});

window.addEventListener('click', (e) => {
    if (playerTypeLocal==1) {
        const angle = Math.atan2(
            e.clientY - (canvasEl.height / 2+20),
            e.clientX - (canvasEl.width / 2+20))
        socket.emit("thrust", angle);
        console.log(e.clientX - (canvasEl.width / 2+20))
        console.log(e.clientY - (canvasEl.height / 2+20))
    }
    
    
    
    if (playerTypeLocal==2) {
        if (Date.now() - arrowRecharge>1500) {
            arrowRecharge=Date.now();
            const angle = Math.atan2(
                e.clientY - (canvasEl.height / 2+20),
                e.clientX - (canvasEl.width / 2+20))
                socket.emit("arrow", angle);
            }
        }
        
        if (playerTypeLocal==3) {
            if (Date.now()-slashRecharge>500) {
                slashRecharge=Date.now();
                const angle = Math.atan2(
                    e.clientY - (canvasEl.height / 2+20),
                    e.clientX - (canvasEl.width / 2+20))
                socket.emit("slash", angle);
            }
        }
})


//show screen
function loop() {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);
    const myPlayer = players.find((player) => player.id == socket.id);
    let cameraX = 0;
    let cameraY = 0;
    if (myPlayer) {
        cameraX = myPlayer.x - canvasEl.width / 2;
        cameraY = myPlayer.y - canvasEl.height / 2;

    }


    /*const TILES_IN_ROW = 8;
    
    for (let row=0; row < 100; row++) {
        for (let col=0; col < 100; col++) {
            const { id } = map[row][col];
            const imageRow = parseInt(id/TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            canvas.drawImage(mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE,
                row * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
                )

        }
    } */
    //canvas.drawImage(TestPixelImage,canvasEl.width / 2, canvasEl.height / 2);

    canvas.drawImage(mapImage, 0, 0, canvasEl.width, canvasEl.height, -cameraX, -cameraY, canvasEl.width, canvasEl.height); 
    for (const player of players) {
        if (player.playerType == 1) {   //Draw Rouge
            canvas.drawImage(rougeImage, player.x - cameraX, player.y - cameraY); 
        }
        if (player.playerType == 2) {   //Draw Archer
            canvas.drawImage(archerImage, player.x - cameraX, player.y - cameraY); 
        }
        if (player.playerType == 3) {   //Draw Knight
            canvas.drawImage(knightImage, player.x - cameraX, player.y - cameraY); 
        }
        //canvas.drawImage(TestPixelImage, player.x - cameraX+20, player.y - cameraY+20);
    };
    for (const arrow of arrows) {
        drawArrow(canvas,ArrowImage, arrow.x - cameraX, arrow.y - cameraY,22,6,arrow.angle);
        //canvas.drawImage(TestPixelImage, arrow.x - cameraX+11, arrow.y - cameraY+3);
    };
    for (const slash of slashes) {
        drawSlash(canvas,SlashImage, slash.x - cameraX, slash.y - cameraY,75,93,slash.angle);
        //canvas.drawImage(TestPixelImage, slash.x+10 - cameraX+(30*Math.cos(slash.angle)), slash.y+60 - cameraY+(30*Math.sin(slash.angle)));
    };
    for (const thrust of thrusts) {
        drawThrust(canvas,ThrustImage, thrust.x - cameraX, thrust.y - cameraY,10,46,thrust.angle-1.57);
        //canvas.drawImage(TestPixelImage, thrust.x+3 - cameraX+(45*Math.cos(thrust.angle)), thrust.y-22 - cameraY+(45*Math.sin(thrust.angle)));
    };
    window.requestAnimationFrame(loop);

}
//(has to be done after bringing map)
setTimeout(() => loop(), 1000);