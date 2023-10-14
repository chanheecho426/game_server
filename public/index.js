//FRONTEND
//Coordinate frame
const mapImage = new Image();
mapImage.src = "/background.png";

const rougeImage = new Image();
rougeImage.src = "/rouge.png";

const ArrowImage = new Image();
ArrowImage.src = "/arrow.png";

const TestPixelImage = new Image();
TestPixelImage.src = "/SINGLEPIXEL.png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;

const canvas = canvasEl.getContext("2d");
const socket = io('ws://localhost:5000'); //CROS Error block here

const TILE_SIZE = 16;

socket.on("connect", () => { console.log("logged") });


let map = [[]];
let players = [];
let arrows = [];

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
    const angle = Math.atan2(
        e.clientY - canvasEl.height / 2,
        e.clientX - canvasEl.width / 2)
    socket.emit("arrow", angle
    );
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
    canvas.drawImage(mapImage, 0, 0, canvasEl.width, canvasEl.height, -cameraX, -cameraY, canvasEl.width, canvasEl.height); //TODO - understand how this works
    for (const player of players) {

        canvas.drawImage(rougeImage, player.x - cameraX, player.y - cameraY); //TODO - understand how this workss
        //canvas.drawImage(TestPixelImage, player.x - cameraX+20, player.y - cameraY+20);
    };

    for (const arrow of arrows) {

        canvas.drawImage(ArrowImage, arrow.x - cameraX, arrow.y - cameraY); //TODO - understand how this workss
        //canvas.drawImage(TestPixelImage, arrow.x - cameraX+11, arrow.y - cameraY+3);
    };
    window.requestAnimationFrame(loop);

}
//(has to be done after bringing map)
setTimeout(() => loop(), 3000);