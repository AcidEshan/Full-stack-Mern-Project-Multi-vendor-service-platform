import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaArrowLeft, FaSearch, FaTimes } from 'react-icons/fa';
import { messageApi } from '../../api/messageApi';
import useAuthStore from '../../store/authStore';

const MessagingCenter = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.otherUser._id);
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.otherUser._id, true);
      }, 10000); // Poll messages every 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await messageApi.getConversations();
      const convoList = response.data?.conversations || response.data?.data?.conversations || [];
      setConversations(convoList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (userId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await messageApi.getConversation(userId, { page: 1, limit: 100 });
      const rawMsgs = response.data?.messages || response.data?.data?.messages || [];
      const msgs = rawMsgs.map((m) => ({
        ...m,
        sender: m.sender || m.senderId || m.from,
        recipient: m.recipient || m.recipientId || m.to,
      }));
      setMessages(msgs);
      if (!silent) setLoading(false);

      // Mark unread messages as read
      const unreadMessages = (msgs || []).filter(
        m => !m.isRead && (m.recipient?._id === user._id || m.recipientId?._id === user._id)
      );
      for (const msg of unreadMessages) {
        await messageApi.markAsRead(msg._id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await messageApi.sendMessage({
        recipientId: selectedConversation.otherUser._id,
        message: newMessage.trim(),
        messageType: 'text'
      });

      setNewMessage('');
      fetchMessages(selectedConversation.otherUser._id, true);
      fetchConversations();
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    (conv.otherUser?.firstName || conv.user?.firstName || conv.participant?.firstName || '')
      .toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.otherUser?.lastName || conv.user?.lastName || conv.participant?.lastName || '')
      .toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.otherUser?.companyName || conv.user?.companyName || conv.participant?.companyName || '')
      .toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="h-[600px] bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-500">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-white rounded-xl shadow-lg overflow-hidden flex">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 border-r border-gray-200`}>
        {/* Header */}
        <div className="p-4 bg-[#1B4B36] text-white">
          <h2 className="text-xl font-bold mb-3">Messages</h2>
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full px-4 py-2 pl-10 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FCDE70]"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="loading loading-spinner loading-md text-[#1B4B36]"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherUser = conv.otherUser || conv.user || conv.participant || conv.withUser || {};
              const lastMsg = conv.lastMessage || conv.last_message || {};
              const isActive = selectedConversation?.otherUser?._id === otherUser._id;
              return (
                <div
                  key={conv._id || otherUser._id}
                  onClick={() => handleSelectConversation({ ...conv, otherUser })}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-[#1B4B36] text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                        {(otherUser.firstName?.[0] || otherUser.companyName?.[0] || 'U')}
                        {otherUser.lastName?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {otherUser.companyName || `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'Conversation'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {lastMsg.message || lastMsg.text || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs text-gray-500">
                        {lastMsg.createdAt ? formatTime(lastMsg.createdAt) : ''}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-2/3`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-gray-600 hover:text-gray-800"
              >
                <FaArrowLeft />
              </button>
              <div className="w-10 h-10 bg-[#1B4B36] text-white rounded-full flex items-center justify-center font-semibold">
                {selectedConversation.otherUser.firstName?.[0]}{selectedConversation.otherUser.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.otherUser.companyName || 
                   `${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
                </h3>
                <p className="text-sm text-gray-600 capitalize">
                  {selectedConversation.otherUser.role?.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const sender = message.sender || message.senderId;
                  const isOwnMessage = sender?._id === user._id || sender === user._id;
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-[#1B4B36] text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <p className="break-words">{message.message}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-green-200' : 'text-gray-500'}`}>
                          {formatTime(message.createdAt)}
                          {isOwnMessage && (message.isRead ? ' • Read' : ' • Sent')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-2 bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <FaPaperPlane />
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingCenter;
