#include "rtc/rtc.hpp"

#include <iostream>
#include <string>
#include <variant>

int main(int argc, char *argv[]) {


#if 1
  if (argc != 2) {
    std::cerr << "Usage: " << argv[0] << " <ws:// or wss:// server URL>\n";
    return 1;
  }
#endif

  rtc::WebSocket websocket;

  websocket.onOpen([] {
    std::cout << "Connected. Type a message and press Enter to send it.\n";
    std::cout << "Press Ctrl+D to disconnect.\n";
  });

  websocket.onMessage([](rtc::message_variant message) {
    if (const auto *text = std::get_if<std::string>(&message)) {
      std::cout << "\nReceived: " << *text << "\n";
    } else {
      std::cout << "\nReceived a binary message.\n";
    }
  });

  websocket.onError([](std::string error) {
    std::cerr << "WebSocket error: " << error << '\n';
  });

  websocket.onClosed([] {
    std::cout << "Connection closed.\n";
  });

  websocket.open(argv[1]);
  std::cout << "Connecting to " << argv[1] << "...\n";

  std::string message;
  while (std::getline(std::cin, message)) {
    if (!websocket.isOpen()) {
      std::cerr << "Not connected; message was not sent.\n";
      continue;
    }
    websocket.send(message);
  }

  websocket.close();
  return 0;
}
