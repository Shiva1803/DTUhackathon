import { useAuth0 } from '@auth0/auth0-react';
import { LogOut, Loader2 } from 'lucide-react';

interface LogoutButtonProps {
  compact?: boolean;
}

export default function LogoutButton({ compact = false }: LogoutButtonProps) {
  const { logout, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 rounded-lg bg-gray-700 text-white font-medium opacity-70 cursor-not-allowed ${
          compact ? 'px-3 py-1.5 text-sm' : 'px-6 py-2.5'
        }`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && 'Loading...'}
      </button>
    );
  }

  return (
    <button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className={`flex items-center gap-2 rounded-lg bg-gray-700 text-gray-300 font-medium hover:bg-gray-600 hover:text-white transition-all ${
        compact ? 'px-3 py-1.5 text-sm' : 'px-6 py-2.5'
      }`}
    >
      <LogOut className="w-4 h-4" />
      {!compact && 'Log Out'}
    </button>
  );
}
