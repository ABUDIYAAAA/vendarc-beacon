const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB Atlas connection URI
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error(
    "MongoDB Atlas URI not provided in environment variable MONGODB_URI"
  );
  process.exit(1);
}
const client = new MongoClient(uri);

// Connect to MongoDB Atlas
client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

// Endpoint to handle notifications of email opens
app.post("/email-opened", async (req, res) => {
  console.log("Received POST request to /email-opened");
  console.log(req.body);
  const emailId = req.body?.emailId;
  const timestamp = new Date().toISOString();

  try {
    // Update email as opened in MongoDB Atlas
    await client
      .db("emailTrackingDB")
      .collection("sentEmails")
      .updateOne(
        { _id: emailId },
        { $set: { opened: true, openTimestamp: timestamp } }
      );
    console.log("Email marked as opened in MongoDB Atlas");
  } catch (err) {
    console.error("Error marking email as opened in MongoDB Atlas:", err);
    res.status(500).json({ error: "Failed to mark email as opened" });
    return;
  }

  // Notify Discord bot of email open event
  io.emit("emailOpened", { emailId, timestamp });

  // Respond with a transparent 1x1 pixel GIF image
  res.set("Content-Type", "image/gif");
  res.send(
    Buffer.from(
      "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    )
  );
});

// Endpoint to get the count of emails waiting to be viewed
app.get("/unopened-email-count", async (req, res) => {
  console.log("Received GET request to /unopened-email-count");

  try {
    const unopenedEmailCount = await client
      .db("emailTrackingDB")
      .collection("sentEmails")
      .countDocuments({ opened: { $ne: true } });
    res.status(200).json({ count: unopenedEmailCount });
  } catch (err) {
    console.error("Error getting count of unopened emails:", err);
    res.status(500).json({ error: "Failed to get count of unopened emails" });
  }
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
