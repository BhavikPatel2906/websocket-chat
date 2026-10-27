# DirectSocket Chat

A lightweight direct-message chat system connecting C++ terminal clients and browser clients through a Node.js WebSocket relay.

## Project links

- [View the project on GitHub](https://github.com/BhavikPatel2906/websocket-chat)
- [Download the project as a ZIP](https://github.com/BhavikPatel2906/websocket-chat/archive/refs/heads/main.zip)

## Install and run

```bash
npm install
npm start
```

Open `websocket-chat.html` in a browser. Pick a unique **My client ID** and enter the destination client ID in **Send messages to**.

The compiled `a.out` executable is not included. Build `websocket-only.cpp`
with libdatachannel and save the executable as `a.out`, then connect a C++
client with its own ID and an optional default recipient:

```bash
./a.out "ws://127.0.0.1:8080/?clientId=bhavik&to=web-client-1"
```

If no default recipient is provided, send a direct message from the C++ terminal with:

```text
@web-client-1 Hello
```

Every connected client must use a unique client ID.
