const express = require("express");
const http = require("http");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB Atlas connection URI from environment variable
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error(
    "MongoDB Atlas URI not provided in environment variable MONGODB_URI"
  );
  process.exit(1);
}

const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("Error connecting to MongoDB Atlas:", err);
    setTimeout(connectToDatabase, 5000); // Retry after 5 seconds
  }
}

connectToDatabase();

// Endpoint to check for email existence
app.get("/check-email", async (req, res) => {
  console.log("Received GET request to /check-email");

  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: "Missing email parameter" });
  }

  try {
    const emailExists = await client
      .db("emailTrackingDB")
      .collection("sentEmails")
      .findOne({ email });
    res.status(200).json({ exists: !!emailExists });
  } catch (err) {
    console.error("Error checking email existence:", err);
    res.status(500).json({ error: "Failed to check email existence" });
  }
});

// Other endpoints...

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
