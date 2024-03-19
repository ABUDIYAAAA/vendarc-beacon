import { post } from "axios";

export async function handler(event, context) {
  const emailId = event.queryStringParameters.email_id;

  // Notify Discord bot of email open event
  try {
    await post("https://your-discord-bot-endpoint.com/email-opened", {
      email_id: emailId,
      timestamp: new Date().toISOString(),
    });
    console.log("Successfully notified Discord bot of email open event.");
  } catch (error) {
    console.error("Error notifying Discord bot:", error.message);
  }

  // Respond with a transparent 1x1 pixel GIF image
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/gif",
    },
    body: Buffer.from(
      "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    ).toString("base64"),
    isBase64Encoded: true,
  };
}
