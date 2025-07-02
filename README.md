#  Real-Time Chat App-frontend

This is the **React frontend** for the Real-Time Chat App that connects to a WebSocket-based backend. It supports group chats, private 1-to-1 messaging, typing indicators, dark mode, emoji picker, and a WhatsApp-inspired layout.


##  Features

1.  Group chat with a unique sharable room ID
2.  Room creator gets a copyable ID, others must enter it to join
3.  Private chat available via sidebar user list
4.  Sidebar + Chat window toggle (like WhatsApp)
5.  Typing indicator below chat title
6.  System messages for user joined/left events
7.  Media/file sharing support (optional)
8.  Emoji picker integrated
9.  Dark mode toggle
10. Timestamps on messages
11.  Auto-scroll to latest messages
12.  Clean separation of group and private chats



##  Tech Stack

- **React 18+**
- **WebSocket (native browser API)**
- **emoji-mart** for emoji picker
- **uuid** for generating IDs
- **Tailwind CSS** or custom styles

##  Getting Started (Locally)

1. **Clone the repository**

```bash
git clone https://github.com/priyanka0123456/chat-app.git
cd frontend
npm install
