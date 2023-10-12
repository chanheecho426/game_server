//FRONTEND
const mapImage = new Image();
mapImage.src = "/snowy-sheet.png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth*4;
canvasEl.height = window.innerHeight*4;

const canvas = canvasEl.getContext("2d");
const socket = io('ws://172.30.1.41:5000'); //CROS Error block here

const TILE_SIZE = 16;

socket.on("connect",()=>{console.log("logged")});

let map = [[]];

//bring map(must be done before the show screen process!!!)
socket.on('map',(loadedMap) => { 
    map = loadedMap;
    console.log(map.length)
});

//show screen
function loop() {
    canvas.clearRect(0,0,canvas.width,canvas.height);

    const TILES_IN_ROW=8;

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
    }
    window.requestAnimationFrame(loop);
}
//(has to be done after bringing map)
setTimeout(()=>loop(),3000);