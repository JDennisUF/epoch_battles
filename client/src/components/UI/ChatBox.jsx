import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  height: 300px;
  min-width: 280px;
`;

const ChatHeader = styled.h3`
  margin: 0 0 10px 0;
  color: #4ade80;
  font-size: 1rem;
  text-align: center;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const Message = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOwnMessage'
})`
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.3;
  background: ${props => props.isOwnMessage ? 
    'rgba(59, 130, 246, 0.3)' : 
    'rgba(239, 68, 68, 0.3)'};
  border-left: 3px solid ${props => props.isOwnMessage ? 
    '#3b82f6' : 
    '#ef4444'};
`;

const MessageHeader = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 2px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MessageText = styled.div`
  color: #ffffff;
  word-wrap: break-word;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4ade80;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SendButton = styled.button`
  background: linear-gradient(45deg, #4ade80, #22c55e);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 10px rgba(74, 222, 128, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  text-align: center;
  font-size: 0.9rem;
`;

function ChatBox({ messages = [], onSendMessage, currentUserId, players = [] }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    const trimmedText = inputText.trim();
    if (trimmedText && onSendMessage) {
      onSendMessage(trimmedText);
      setInputText('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getUsernameById = (userId) => {
    const player = players.find(p => p.userId === userId);
    return player?.username || 'Unknown Player';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <ChatContainer>
      <ChatHeader>Game Chat</ChatHeader>
      
      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyState>
            No messages yet.<br />
            Say hello to your opponent!
          </EmptyState>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.userId === currentUserId;
            return (
              <Message key={index} isOwnMessage={isOwnMessage}>
                <MessageHeader>
                  <span>{getUsernameById(message.userId)}</span>
                  <span>{formatTimestamp(message.timestamp)}</span>
                </MessageHeader>
                <MessageText>{message.text}</MessageText>
              </Message>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <ChatInput
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          maxLength={500}
        />
        <SendButton 
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
        >
          Send
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
}

export default ChatBox;