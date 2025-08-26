import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';
import UsersPanel from '@/components/chat/UsersPanel';
import type { Room, User } from '@shared/schema';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: rooms, error: roomsError } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
    enabled: isAuthenticated,
  });

  const { data: allRooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms/all"],
    enabled: isAuthenticated,
  });

  // Auto-select first room if none selected
  useEffect(() => {
    if (rooms && rooms.length > 0 && !currentRoomId) {
      setCurrentRoomId(rooms[0].id);
    }
  }, [rooms, currentRoomId]);

  // Handle unauthorized errors
  useEffect(() => {
    if (roomsError && isUnauthorizedError(roomsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [roomsError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-chat-dark">
        <div className="text-chat-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const currentRoom = rooms?.find((room: Room) => room.id === currentRoomId);

  return (
    <div className="h-screen flex bg-chat-dark text-chat-text" data-testid="container-chat-app">
      <Sidebar
        user={user!}
        rooms={rooms || []}
        allRooms={allRooms || []}
        currentRoomId={currentRoomId}
        onRoomSelect={setCurrentRoomId}
        onLogout={() => window.location.href = '/api/logout'}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatArea
          user={user!}
          currentRoom={currentRoom}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      <UsersPanel roomId={currentRoomId} />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          data-testid="overlay-mobile-sidebar"
        >
          <div className="absolute left-0 top-0 h-full w-64">
            {/* Sidebar content is already rendered above */}
          </div>
        </div>
      )}
    </div>
  );
}
