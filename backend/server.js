require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const setupSocket = require("./socket/socket");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes =
    require("./routes/uploadRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

connectDB();

// Make Socket.IO available to controllers (req.app.get("io"))
app.set("io", io);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
    res.send("Realtime Chat Server is Running");
});

setupSocket(io);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});