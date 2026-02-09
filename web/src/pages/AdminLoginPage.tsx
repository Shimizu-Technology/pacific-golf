import React, { useEffect, useState } from 'react';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { api } from '../services/api';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const [tournamentName, setTournamentName] = useState<string | null>(null);

  // Fetch tournament name
  useEffect(() => {
    api.getRegistrationStatus()
      .then(status => setTournamentName(status.tournament_name))
      .catch(() => {});
  }, []);

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isSignedIn, isLoaded, navigate]);

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  // If already signed in, show loading (redirect will happen via useEffect)
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Trophy className="text-blue-900" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600">
            {tournamentName || 'Edward A.P. Muna II Memorial Golf Tournament'}
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn 
            forceRedirectUrl="/admin/dashboard"
            signUpForceRedirectUrl="/admin/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-lg rounded-lg",
                headerTitle: "text-blue-900",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton: "border-gray-300 hover:bg-gray-50",
                formButtonPrimary: "bg-blue-900 hover:bg-blue-800",
                footerActionLink: "text-blue-900 hover:text-blue-800",
              },
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-900 hover:underline text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
