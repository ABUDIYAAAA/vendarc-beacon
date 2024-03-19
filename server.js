const express = require("express");
const axios = require("axios");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

router.use(express.json());

router.post("/email-opened", async (req, res) => {
  const { email_id } = req.body;
  const timestamp = new Date().toISOString();

  // Notify Discord bot of email open event
  try {
    await axios.post("https://your-discord-bot-endpoint.com/email-opened", {
      email_id,
      timestamp,
    });
    console.log("Successfully notified Discord bot of email open event.");
  } catch (error) {
    console.error("Error notifying Discord bot:", error.message);
  }

  // Respond with a transparent 1x1 pixel GIF image
  res.set("Content-Type", "image/gif");
  res.send(
    Buffer.from(
      "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    )
  );
});

// Mount the router at the specific base path
app.use("/.netlify/functions/api", router);

module.exports.handler = serverless(app);
