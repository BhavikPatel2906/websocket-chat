const { WebSocket, WebSocketServer } = require("ws");
const { randomUUID } = require("crypto");

const port = Number(process.argv[2] ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("Usage: node websocket-server.js [port]");
  process.exit(1);
}

const server = new WebSocketServer({ host: "127.0.0.1", port });
const clientsById = new Map();

server.on("listening", () => {
  console.log(`WebSocket server listening on ws://127.0.0.1:${port}`);
  console.log("Press Ctrl+C to stop.");
});

server.on("connection", (client, request) => {
  const connectionUrl = new URL(request.url, "ws://localhost");
  const requestedId = connectionUrl.searchParams.get("clientId");
  const clientId = requestedId?.trim() || randomUUID();
  const defaultRecipientId = connectionUrl.searchParams.get("to")?.trim();

  if (clientsById.has(clientId)) {
    client.close(1008, "A client with this ID is already connected");
    return;
  }

  clientsById.set(clientId, client);
  console.log(`Client connected: ${clientId}`);
  client.send(JSON.stringify({ type: "Welcome", clientId }));

  client.on("message", (data, isBinary) => {
    let recipientId;
    let message;

    if (isBinary) {
      client.send(JSON.stringify({ type: "DeliveryError", message: "Binary messages are not supported." }));
      return;
    }

    const text = data.toString();
    try {
      const packet = JSON.parse(text);
      if (packet.type === "DirectMessage" && typeof packet.to === "string" && typeof packet.message === "string") {
        recipientId = packet.to.trim();
        message = packet.message;
      }
    } catch {
      // Plain text from the C++ console is expected here.
    }

    if (!recipientId) {
      // The C++ console client can use either @recipient-id message text,
      // or a default recipient supplied as ?to=recipient-id in its URL.
      const match = text.match(/^@(\S+)\s+([\s\S]+)$/);
      if (match) {
        [, recipientId, message] = match;
      } else if (defaultRecipientId) {
        recipientId = defaultRecipientId;
        message = text;
      }
    }

    if (!recipientId || !message) {
      client.send(JSON.stringify({ type: "DeliveryError", message: "Choose a recipient. Console format: @clientId message" }));
      return;
    }

    const recipient = clientsById.get(recipientId);
    if (!recipient || recipient.readyState !== WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "DeliveryError", message: `Client '${recipientId}' is not connected.` }));
      return;
    }

    recipient.send(JSON.stringify({ type: "ChatMessage", senderId: clientId, message }));
    client.send(JSON.stringify({ type: "DeliveryStatus", message: `Delivered to ${recipientId}.` }));
    console.log(`Message from ${clientId} to ${recipientId}`);
  });

  client.on("close", () => {
    if (clientsById.get(clientId) === client) clientsById.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });
  client.on("error", (error) => console.error("WebSocket error:", error.message));
});

server.on("error", (error) => {
  console.error("Server error:", error.message);
  process.exitCode = 1;
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
