import React, { useEffect, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './app.css';

const socketUrl = 'ws://localhost:5000';

function App() {
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [typingStatus, setTypingStatus] = useState('');
  const [unread, setUnread] = useState({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const messagesEndRef = useRef();

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'room-created') {
          setRoomId(data.roomId);
          setRoomName(data.roomName);
          alert(`Room "${data.roomName}" created! ID: ${data.roomId}`);
        }

        if (data.type === 'room-info') setRoomName(data.roomName);
        if (data.type === 'room-history') setMessages(data.messages);

        if (['message', 'private-message', 'system'].includes(data.type)) {
          const isCurrentChat =
            (!chatTarget && !data.receiver) ||
            (chatTarget &&
              ((data.sender === username && data.receiver === chatTarget) ||
               (data.sender === chatTarget && data.receiver === username)));

          setMessages((prev) => [...prev, data]);

          if (!isCurrentChat && data.sender && data.type !== 'system') {
            setUnread((prev) => ({
              ...prev,
              [data.sender]: (prev[data.sender] || 0) + 1
            }));
          }
        }

        if (data.type === 'user-list') {
          setUsers(data.users.filter((u) => u !== username));
        }

        if (data.type === 'typing') {
          if (data.sender !== username && (!chatTarget || data.receiver === username)) {
            setTypingStatus(`${data.sender} is typing...`);
            setTimeout(() => setTypingStatus(''), 2000);
          }
        }
      };
    }
  }, [ws, username, chatTarget]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectSocket = () => {
    const socket = new WebSocket(socketUrl);
    socket.onopen = () => {
      setWs(socket);
      socket.send(JSON.stringify({
        type: 'join-room',
        username,
        roomId: inputRoomId
      }));
      setRoomId(inputRoomId);
    };
  };

  const createRoom = () => {
    const name = prompt("Enter your name:");
    const label = prompt("Enter group name:");
    if (!name || !label) return alert("Both fields required.");
    setUsername(name);
    setRoomName(label);

    const socket = new WebSocket(socketUrl);
    socket.onopen = () => {
      setWs(socket);
      socket.send(JSON.stringify({
        type: 'create-room',
        username: name,
        roomName: label
      }));
    };
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    ws.send(JSON.stringify({
      type: 'message',
      sender: username,
      receiver: chatTarget || null,
      roomId,
      message
    }));
    setMessage('');
    setShowEmoji(false);
  };

  const handleTyping = () => {
    if (!ws || !username) return;
    ws.send(JSON.stringify({
      type: 'typing',
      sender: username,
      receiver: chatTarget || null,
      roomId,
      isTyping: true
    }));
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const openChat = (user) => {
    setChatTarget(user);
    setUnread((prev) => ({ ...prev, [user]: 0 }));
  };

  const getChatTitle = () => {
    return chatTarget ? `Chat with ${chatTarget}` : `Group: ${roomName || roomId}`;
  };

  const onEmojiClick = (e) => {
    setMessage((prev) => prev + e.emoji);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      ws.send(JSON.stringify({
        type: 'message',
        sender: username,
        receiver: chatTarget || null,
        roomId,
        message: `<file src="${base64}" name="${file.name}" type="${file.type}" />`
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`chat-container ${theme}`}>
      {!ws ? (
        <div className="login-box">
          <h2>Join a Room</h2>
          <input placeholder="Your name" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Enter Room ID" value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value)} />
          <button onClick={connectSocket}>Join Room</button>
          <hr />
          <h3>Or Create New Room</h3>
          <button onClick={createRoom}>Create Room</button>
        </div>
      ) : (
        <div className="chat-layout">
          <div className="sidebar">
            <h3>Users</h3>
            <label className="toggle">
              <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
              Dark Mode
            </label>
            <ul>
              <li onClick={() => openChat(null)} className={!chatTarget ? 'active' : ''}>
                {roomName || 'Group Chat'}
              </li>
              {users.map((u) => (
                <li key={u} onClick={() => openChat(u)} className={chatTarget === u ? 'active' : ''}>
                  {u}
                  {unread[u] > 0 && <span className="badge">{unread[u]}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="chat-box">
            <div className="chat-header">
              {chatTarget && <button className="back-btn" onClick={() => openChat(null)}>←</button>}
              {getChatTitle()}
              <div className="typing-indicator">{typingStatus}</div>
            </div>
            <div className="chat-window">
              {messages.map((msg, idx) => {
                if (msg.type === 'system') {
                  if (!chatTarget) {
                    return <div key={idx} className="system-message"><i>{msg.message}</i></div>;
                  }
                  return null;
                }

                const isPrivate = !!msg.receiver;
                const isChatMatch =
                  (!chatTarget && !isPrivate) ||
                  (chatTarget && (
                    (msg.sender === username && msg.receiver === chatTarget) ||
                    (msg.sender === chatTarget && msg.receiver === username)
                  ));

                if (!isChatMatch) return null;

                const isFile = msg.message.startsWith('<file');
                let content = null;

                if (isFile) {
                  const src = msg.message.match(/src="([^"]+)"/)?.[1];
                  const name = msg.message.match(/name="([^"]+)"/)?.[1];
                  const type = msg.message.match(/type="([^"]+)"/)?.[1];
                  if (type?.startsWith('image')) {
                    content = <img src={src} alt={name} className="media" />;
                  } else if (type?.startsWith('video')) {
                    content = <video controls src={src} className="media" />;
                  } else {
                    content = <a href={src} download={name}>{name}</a>;
                  }
                }

                return (
                  <div key={idx} className={`message ${msg.sender === username ? 'user' : 'other'}`}>
                    <div><b>{msg.sender === username ? 'you' : msg.sender}</b>: {isFile ? content : msg.message}</div>
                    <div className="timestamp">{formatTime(msg.timestamp)}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
  <div className="input-wrapper">
    <div className="input-tools">
      <button onClick={() => setShowEmoji(prev => !prev)}>😊</button>
      <input type="file" onChange={handleFileChange} />
    </div>
    <input
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') sendMessage();
        else handleTyping();
      }}
      placeholder="Type a message....."
    />
  </div>
  <button onClick={sendMessage}>Send</button>
  {showEmoji && <EmojiPicker onEmojiClick={onEmojiClick} />}
</div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
