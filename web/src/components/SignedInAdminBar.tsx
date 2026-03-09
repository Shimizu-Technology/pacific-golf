import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { LayoutDashboard } from 'lucide-react';
import { resolveBestDashboardPath } from '../utils/dashboardRouting';

interface SignedInAdminBarProps {
  dashboardPath?: string;
}

export const SignedInAdminBar: React.FC<SignedInAdminBarProps> = ({ dashboardPath }) => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  if (!isLoaded || !isSignedIn) return null;

  const displayName = user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User';

  const goToBestDashboard = async () => {
    const path = await resolveBestDashboardPath(getToken, dashboardPath);
    navigate(path);
  };

  return (
    <div className="relative z-30 border-b border-stone-800 bg-stone-900/95 text-stone-100 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutDashboard size={15} className="flex-shrink-0 text-emerald-400" />
          <span className="truncate text-xs md:text-sm">
            Signed in as <strong className="font-semibold text-white">{displayName}</strong>
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 md:gap-3">
          <button
            onClick={goToBestDashboard}
            className="whitespace-nowrap rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20 md:text-sm"
          >
            Go to Dashboard →
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
};
