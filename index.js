const { parse } = require("url");
const { json } = require("micro");
const { send } = require("micro");
const http = require("http");
const socketIo = require("socket.io");

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);

  // Handle only POST requests to "/email-opened" endpoint
  if (parsedUrl.pathname === "/email-opened" && req.method === "POST") {
    const body = await json(req);
    console.log("Received POST request to /email-opened");
    console.log(body);
    const email_id = body?.email_id;
    console.log(email_id);
    const timestamp = new Date().toISOString();

    // Notify Discord bot of email open event
    io.emit("emailOpened", { email_id, timestamp });

    // Respond with a transparent 1x1 pixel GIF image
    res.setHeader("Content-Type", "image/gif");
    res.end(
      Buffer.from(
        "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
        "base64"
      )
    );
  } else {
    send(res, 404, "Not Found");
  }
});

// Create Socket.IO server
const io = socketIo(server);

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("A bot has connected to the WebSocket server.");

  socket.on("disconnect", () => {
    console.log("A bot has disconnected from the WebSocket server.");
  });
});

// Export handler function
module.exports = async (req, res) => {
  server(req, res);
};
