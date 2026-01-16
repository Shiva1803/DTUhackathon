import { useAuth0 } from '@auth0/auth0-react';
import { User, Loader2 } from 'lucide-react';

export default function UserProfile() {
  const { user, isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      {user.picture ? (
        <img
          src={user.picture}
          alt={user.name || 'User'}
          className="w-10 h-10 rounded-full border-2 border-purple-500"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-white font-medium text-sm">{user.name}</span>
        <span className="text-gray-400 text-xs">{user.email}</span>
      </div>
    </div>
  );
}
