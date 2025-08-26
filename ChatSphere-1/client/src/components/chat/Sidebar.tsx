import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Hash, LogOut } from 'lucide-react';
import type { Room, User } from '@shared/schema';

interface SidebarProps {
  user: User;
  rooms: Room[];
  allRooms: Room[];
  currentRoomId: number | null;
  onRoomSelect: (roomId: number) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ 
  user, 
  rooms, 
  allRooms, 
  currentRoomId, 
  onRoomSelect, 
  onLogout, 
  isOpen, 
  onClose 
}: SidebarProps) {
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest('POST', '/api/rooms', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/all'] });
      setIsCreateRoomOpen(false);
      setRoomName('');
      setRoomDescription('');
      toast({
        title: "Success",
        description: "Room created successfully!",
      });
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
        description: "Failed to create room",
        variant: "destructive",
      });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      await apiRequest('POST', `/api/rooms/${roomId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({
        title: "Success",
        description: "Joined room successfully!",
      });
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
        description: "Failed to join room",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    
    createRoomMutation.mutate({
      name: roomName.trim(),
      description: roomDescription.trim(),
    });
  };

  const handleJoinRoom = (roomId: number) => {
    joinRoomMutation.mutate(roomId);
  };

  const displayName = user.firstName || user.lastName 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : user.email || 'User';

  const userRoomIds = new Set(rooms.map(room => room.id));
  const availableRooms = allRooms.filter(room => !userRoomIds.has(room.id));

  return (
    <>
      <div className={`w-64 bg-chat-secondary flex flex-col h-full ${isOpen ? 'fixed z-50 md:static' : 'hidden md:flex'}`}>
        {/* User Profile Section */}
        <div className="p-4 border-b border-chat-tertiary">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-chat-accent rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium" data-testid="text-user-initials">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-white" data-testid="text-user-name">{displayName}</p>
              <p className="text-xs text-chat-muted">Online</p>
            </div>
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-chat-light uppercase tracking-wide">My Rooms</h3>
              <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-chat-muted hover:text-white p-1"
                    data-testid="button-create-room"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-chat-secondary border-chat-tertiary">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Room</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div>
                      <Label htmlFor="room-name" className="text-chat-light">Room Name</Label>
                      <Input
                        id="room-name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="bg-chat-tertiary border-chat-tertiary text-white"
                        required
                        data-testid="input-room-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="room-description" className="text-chat-light">Description (optional)</Label>
                      <Textarea
                        id="room-description"
                        value={roomDescription}
                        onChange={(e) => setRoomDescription(e.target.value)}
                        placeholder="Enter room description"
                        className="bg-chat-tertiary border-chat-tertiary text-white"
                        rows={3}
                        data-testid="input-room-description"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsCreateRoomOpen(false)}
                        className="text-chat-muted hover:text-white"
                        data-testid="button-cancel-create"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createRoomMutation.isPending || !roomName.trim()}
                        className="bg-chat-accent hover:bg-blue-600"
                        data-testid="button-submit-create"
                      >
                        {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {rooms.map((room) => (
              <div key={room.id} className="mb-2">
                <button
                  onClick={() => {
                    onRoomSelect(room.id);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200 ${
                    currentRoomId === room.id
                      ? 'bg-chat-accent text-white font-medium'
                      : 'text-chat-light hover:bg-chat-tertiary'
                  }`}
                  data-testid={`button-room-${room.id}`}
                >
                  <Hash className="h-4 w-4" />
                  <span>{room.name}</span>
                </button>
              </div>
            ))}

            {availableRooms.length > 0 && (
              <>
                <div className="mt-6 mb-3">
                  <h3 className="text-sm font-semibold text-chat-light uppercase tracking-wide">Available Rooms</h3>
                </div>
                {availableRooms.map((room) => (
                  <div key={room.id} className="mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <Hash className="h-4 w-4 text-chat-muted" />
                      <span className="text-chat-light text-sm">{room.name}</span>
                    </div>
                    <Button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={joinRoomMutation.isPending}
                      variant="ghost"
                      size="sm"
                      className="text-chat-accent hover:text-white text-xs"
                      data-testid={`button-join-room-${room.id}`}
                    >
                      {joinRoomMutation.isPending ? 'Joining...' : 'Join'}
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-chat-tertiary">
          <button
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-md text-chat-light hover:bg-chat-tertiary transition-colors duration-200 flex items-center space-x-2"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
