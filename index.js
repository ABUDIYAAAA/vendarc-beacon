const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to parse JSON bodies
app.use(express.json());

app.get("*", (req, res) => {
  res.send("Hello, world!");
});

// Endpoint to handle notifications of email opens
app.post("/email-opened", async (req, res) => {
  console.log("Received POST request to /email-opened");
  console.log(req.body);
  const email_id = req.body?.email_id;
  console.log(email_id);
  const timestamp = new Date().toISOString();

  // Notify Discord bot of email open event
  io.emit("emailOpened", { email_id, timestamp });

  // Respond with a transparent 1x1 pixel GIF image
  res.set("Content-Type", "image/gif");
  res.send(
    Buffer.from(
      "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    )
  );
});

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("A bot has connected to the WebSocket server.");

  socket.on("disconnect", () => {
    console.log("A bot has disconnected from the WebSocket server.");
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
