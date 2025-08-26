import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Hash, Users, Menu } from 'lucide-react';
import MessageInput from './MessageInput';
import type { Room, User, MessageWithUser } from '@shared/schema';

interface ChatAreaProps {
  user: User;
  currentRoom: Room | undefined;
  onToggleSidebar: () => void;
}

export default function ChatArea({ user, currentRoom, onToggleSidebar }: ChatAreaProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages, error: messagesError } = useQuery<MessageWithUser[]>({
    queryKey: ['/api/rooms', currentRoom?.id, 'messages'],
    enabled: !!currentRoom,
  });

  const { data: roomMembers } = useQuery<User[]>({
    queryKey: ['/api/rooms', currentRoom?.id, 'members'],
    enabled: !!currentRoom,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (messagesError && isUnauthorizedError(messagesError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [messagesError, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Polling for new messages every 3 seconds
  useEffect(() => {
    if (!currentRoom) return;

    const pollForMessages = async () => {
      if (lastMessageTime) {
        try {
          const res = await fetch(`/api/rooms/${currentRoom.id}/messages?since=${lastMessageTime.toISOString()}`, {
            credentials: 'include',
          });
          
          if (res.ok) {
            const newMessages = await res.json();
            if (newMessages.length > 0) {
              queryClient.invalidateQueries({ queryKey: ['/api/rooms', currentRoom.id, 'messages'] });
            }
          }
        } catch (error) {
          console.error('Error polling for messages:', error);
        }
      }
    };

    const interval = setInterval(pollForMessages, 3000);
    return () => clearInterval(interval);
  }, [currentRoom, lastMessageTime, queryClient]);

  // Update last message time when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      const latest = new Date(messages[messages.length - 1].createdAt);
      setLastMessageTime(latest);
    }
  }, [messages]);

  const formatTime = (date: string | Date | null) => {
    if (!date) return '';
    const dateStr = typeof date === 'string' ? date : date.toISOString();
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Unknown';
    const dateStr = typeof date === 'string' ? date : date.toISOString();
    const messageDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const getDisplayName = (user: User) => {
    return user.firstName || user.lastName 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : user.email || 'User';
  };

  const getInitials = (user: User) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getColorForUser = (userId: string) => {
    const colors = [
      'bg-chat-accent', 'bg-chat-green', 'bg-orange-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
      'bg-teal-500', 'bg-yellow-500', 'bg-red-500'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Group messages by date
  const groupedMessages = (messages || []).reduce((groups: { [key: string]: MessageWithUser[] }, message: MessageWithUser) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-dark">
        <div className="text-center">
          <Hash className="h-16 w-16 text-chat-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-chat-light mb-2">Welcome to ChatFlow</h2>
          <p className="text-chat-muted">Select a room to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="h-16 bg-chat-secondary border-b border-chat-tertiary flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="text-chat-muted hover:text-white transition-colors duration-200 md:hidden"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Hash className="h-5 w-5 text-chat-muted" />
          <h2 className="text-lg font-semibold text-white" data-testid="text-room-name">{currentRoom.name}</h2>
          {currentRoom.description && (
            <>
              <span className="text-chat-muted">|</span>
              <span className="text-sm text-chat-muted" data-testid="text-room-description">{currentRoom.description}</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-chat-muted" />
            <span className="text-sm text-chat-muted" data-testid="text-member-count">
              {roomMembers?.length || 0} member{(roomMembers?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        data-testid="container-messages"
      >
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Divider */}
            <div className="flex items-center justify-center my-6">
              <div className="bg-chat-tertiary text-chat-muted text-xs px-3 py-1 rounded-full" data-testid={`text-date-${date}`}>
                {date}
              </div>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message: MessageWithUser) => {
              const isOwnMessage = message.userId === user.id;
              const displayName = getDisplayName(message.user);
              const initials = getInitials(message.user);
              const userColor = getColorForUser(message.userId);

              return (
                <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : ''}`}>
                  {!isOwnMessage && (
                    <div className={`w-8 h-8 ${userColor} rounded-full flex items-center justify-center mr-3 mt-6 flex-shrink-0`}>
                      <span className="text-white text-sm font-medium" data-testid={`text-user-initials-${message.userId}`}>
                        {initials}
                      </span>
                    </div>
                  )}
                  <div className="max-w-md">
                    <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                      {isOwnMessage && (
                        <span className="text-xs text-chat-muted" data-testid={`text-message-time-${message.id}`}>
                          {formatTime(message.createdAt)}
                        </span>
                      )}
                      <span 
                        className={`text-sm font-medium ${isOwnMessage ? 'text-chat-accent' : 'text-chat-accent'}`}
                        data-testid={`text-message-sender-${message.id}`}
                      >
                        {isOwnMessage ? 'You' : displayName}
                      </span>
                      {!isOwnMessage && (
                        <span className="text-xs text-chat-muted" data-testid={`text-message-time-${message.id}`}>
                          {formatTime(message.createdAt)}
                        </span>
                      )}
                    </div>
                    <div 
                      className={`p-3 rounded-lg ${
                        isOwnMessage 
                          ? 'bg-chat-accent text-white rounded-tr-sm' 
                          : 'bg-chat-tertiary text-chat-text rounded-tl-sm'
                      }`}
                    >
                      <p data-testid={`text-message-content-${message.id}`}>{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {(!messages || messages.length === 0) && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Hash className="h-12 w-12 text-chat-muted mx-auto mb-2" />
              <p className="text-chat-muted" data-testid="text-no-messages">No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput user={user} currentRoom={currentRoom} />
    </div>
  );
}
