const express = require("express");
const http = require("http");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB Atlas connection URI from environment variable
const uri =
  "mongodb+srv://91995:ey1OPz1YETc0kK48@cluster0.jgjq2cq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Using environment variable for URI

if (!uri) {
  console.error(
    "MongoDB Atlas URI not provided in environment variable MONGODB_URI"
  );
  process.exit(1);
}

const client = new MongoClient(uri);

// Connect to MongoDB Atlas with retry and error handling
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("Error connecting to MongoDB Atlas:", err);
    // Retry connection after a delay
    setTimeout(connectToDatabase, 5000); // Retry after 5 seconds
  }
}

connectToDatabase(); // Initial connection

// Endpoint to check for email existence
app.get("/check-email", async (req, res) => {
  console.log("Received GET request to /check-email");

  const email = req.query.email; // Get email parameter from query string

  if (!email) {
    return res.status(400).json({ error: "Missing email parameter" });
  }

  try {
    const emailExists = await client
      .db("emailTrackingDB")
      .collection("sentEmails")
      .findOne({ email }); // Check if email exists in the collection

    res.status(200).json({ exists: !!emailExists }); // Respond with existence flag
  } catch (err) {
    console.error("Error checking email existence:", err);
    res.status(500).json({ error: "Failed to check email existence" });
  }
});

// Endpoint to handle requests for the tracking pixel
app.get("/tracking/:emailId", async (req, res) => {
  console.log("Received request for tracking pixel");

  const emailId = req.params.emailId;
  const timestamp = new Date().toISOString();

  try {
    // Update email as opened in MongoDB Atlas
    const result = await client
      .db("emailTrackingDB")
      .collection("sentEmails")
      .updateOne(
        { email: emailId },
        { $set: { opened: true, openTimestamp: timestamp } }
      );

    if (result.modifiedCount === 1) {
      console.log("Email marked as opened in MongoDB Atlas");
      // Respond with a transparent 1x1 pixel GIF image
      res.set("Content-Type", "image/gif");
      res.send(
        Buffer.from(
          "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
          "base64"
        )
      );
    } else {
      console.log("Email not found in MongoDB Atlas");
      res.status(404).send("Email not found");
    }
  } catch (err) {
    console.error("Error marking email as opened in MongoDB Atlas:", err);
    res.status(500).json({ error: "Failed to mark email as opened" });
  }
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

// Endpoint to add a new email into the database
app.post("/add-email", async (req, res) => {
  console.log("Received POST request to /add-email");
  const { name, email } = req.body;
  const timestamp = new Date().toISOString();

  try {
    // Insert email into MongoDB Atlas
    await client
      .db("emailTrackingDB")
      .collection("sentEmails")
      .insertOne({ name, email, timestamp, opened: false });
    console.log("Email added to MongoDB Atlas");
    res.status(200).json({ message: "Email added successfully" });
  } catch (err) {
    console.error("Error adding email to MongoDB Atlas:", err);
    res.status(500).json({ error: "Failed to add email" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
