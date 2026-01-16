import { useAuth0 } from '@auth0/auth0-react';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginButton() {
  const { loginWithRedirect, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium opacity-70 cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={() => loginWithRedirect()}
      className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
    >
      <LogIn className="w-4 h-4" />
      Log In
    </button>
  );
}
