import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ChatContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'gamePhase'
})`
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #4a5d4a 0%, #3e4a3b 100%);
  border: 2px solid #5a6c57;
  border-radius: 10px;
  padding: 15px;
  height: ${props => props.gamePhase === 'playing' ? '450px' : '300px'};
  min-width: 280px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
`;

const ChatHeader = styled.h3`
  margin: 0 0 10px 0;
  color: #c19a6b;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  border-bottom: 2px solid #8b7355;
  padding-bottom: 5px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(135deg, #2d3436 0%, #1e2328 100%);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #5a6c57;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #3e4a3b;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #8b7355;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a0845a;
  }
`;

const Message = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOwnMessage'
})`
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.3;
  background: ${props => props.isOwnMessage ? 
    'linear-gradient(135deg, rgba(107, 142, 35, 0.4) 0%, rgba(85, 107, 47, 0.4) 100%)' : 
    'linear-gradient(135deg, rgba(139, 69, 19, 0.4) 0%, rgba(101, 67, 33, 0.4) 100%)'};
  border-left: 3px solid ${props => props.isOwnMessage ? 
    '#6b8e23' : 
    '#8b4513'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const MessageHeader = styled.div`
  font-size: 0.75rem;
  color: #c19a6b;
  margin-bottom: 2px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
`;

const MessageText = styled.div`
  color: #e8f4f8;
  word-wrap: break-word;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  background: linear-gradient(135deg, #3e4a3b 0%, #2d3436 100%);
  border: 2px solid #5a6c57;
  border-radius: 6px;
  color: #e8f4f8;
  font-size: 0.9rem;
  
  &::placeholder {
    color: #a8b2a5;
  }
  
  &:focus {
    outline: none;
    border-color: #8b7355;
    background: linear-gradient(135deg, #4a5d4a 0%, #3e4a3b 100%);
    box-shadow: 0 0 8px rgba(139, 115, 85, 0.3);
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #8b7355 0%, #6b5b3c 100%);
  border: 2px solid #5a4a3a;
  color: #f1f3f4;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #a0845a 0%, #7d6843 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 115, 85, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: linear-gradient(135deg, #6a6a6a 0%, #4a4a4a 100%);
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

function ChatBox({ messages = [], onSendMessage, currentUserId, players = [], gamePhase = 'setup' }) {
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
    <ChatContainer gamePhase={gamePhase}>
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