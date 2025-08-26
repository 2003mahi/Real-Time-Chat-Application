import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Smile, Paperclip } from 'lucide-react';
import type { Room, User } from '@shared/schema';

interface MessageInputProps {
  user: User;
  currentRoom: Room;
}

export default function MessageInput({ user, currentRoom }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connected');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/rooms/${currentRoom.id}/messages`, {
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', currentRoom.id, 'messages'] });
      setMessage('');
      setConnectionStatus('Connected');
      setLastUpdate(new Date());
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setConnectionStatus('Error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(message.trim());
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
    
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="p-4 bg-chat-secondary border-t border-chat-tertiary">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <div className="relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-chat-tertiary border border-chat-tertiary rounded-lg text-white placeholder-chat-muted focus:border-chat-accent pr-20"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-chat-muted hover:text-chat-light p-1"
                disabled
                data-testid="button-emoji-picker"
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-chat-muted hover:text-chat-light p-1"
                disabled
                data-testid="button-file-upload"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <Button
          type="submit"
          disabled={sendMessageMutation.isPending || !message.trim()}
          className="bg-chat-accent hover:bg-blue-600 text-white p-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
          data-testid="button-send-message"
        >
          {sendMessageMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>

      {/* Connection Status */}
      <div className="flex items-center justify-center mt-2">
        <div className="flex items-center space-x-2 text-xs text-chat-muted">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-chat-green' : 'bg-red-500'}`} />
          <span data-testid="text-connection-status">
            {connectionStatus} • Last updated {formatLastUpdate()}
          </span>
        </div>
      </div>
    </div>
  );
}
