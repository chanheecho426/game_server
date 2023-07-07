//BACKEND

//TODO - Know the fuck what this does
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
//TODO - Know the fuck what this does
const app = express();
const httpServer = createServer(app);
//TODO - Know the fuck what this does
const io = new Server(httpServer);
//TODO - Know the fuck what this does
io.on("connect", (socket) => {
    console.log("user connected",socket.id);
});
//TODO - Know the fuck what this does
app.use(express.static("public"));

httpServer.listen(5000,()=>{console.log("server running")});