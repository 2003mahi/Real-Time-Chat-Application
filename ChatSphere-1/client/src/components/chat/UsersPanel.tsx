import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import type { User } from '@shared/schema';

interface UsersPanelProps {
  roomId: number | null;
}

export default function UsersPanel({ roomId }: UsersPanelProps) {
  const { data: members } = useQuery<User[]>({
    queryKey: ['/api/rooms', roomId, 'members'],
    enabled: !!roomId,
  });

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

  if (!roomId) {
    return null;
  }

  return (
    <div className="w-64 bg-chat-secondary border-l border-chat-tertiary hidden lg:flex flex-col" data-testid="panel-users">
      <div className="p-4 border-b border-chat-tertiary">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-chat-muted" />
          <h3 className="text-sm font-semibold text-chat-light uppercase tracking-wide">
            Online Users ({members?.length || 0})
          </h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {members?.map((user: User) => {
          const displayName = getDisplayName(user);
          const initials = getInitials(user);
          const userColor = getColorForUser(user.id);

          return (
            <div 
              key={user.id} 
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-chat-tertiary transition-colors duration-200"
              data-testid={`user-item-${user.id}`}
            >
              <div className="relative">
                <div className={`w-8 h-8 ${userColor} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium" data-testid={`text-user-initials-${user.id}`}>
                    {initials}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-chat-green border-2 border-chat-secondary rounded-full" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white" data-testid={`text-user-name-${user.id}`}>
                  {displayName}
                </p>
                <p className="text-xs text-chat-muted">Online</p>
              </div>
            </div>
          );
        })}

        {(!members || members.length === 0) && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Users className="h-12 w-12 text-chat-muted mx-auto mb-2" />
              <p className="text-chat-muted text-sm" data-testid="text-no-members">No members online</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
