import { useEffect } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useOrganization } from '../components/OrganizationProvider';
import { CheckCircle, Calendar, MapPin, Mail, CreditCard, ArrowLeft, Share2, Check, LayoutDashboard, LogIn } from 'lucide-react';
import { Button, Card } from '../components/ui';
import confetti from 'canvas-confetti';
import { SignedInAdminBar } from '../components/SignedInAdminBar';
import { adjustColor } from '../utils/colors';
import { resolveTournamentBranding } from '../utils/tournamentBranding';

export function OrgRegistrationSuccessPage() {
  const { orgSlug, tournamentSlug } = useParams<{ orgSlug: string; tournamentSlug: string }>();
  const { isLoaded, isSignedIn } = useAuth();
  const { organization } = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { golfer, tournament, paymentPending, paymentComplete } = location.state || {};
  
  const branding = resolveTournamentBranding(organization, tournament);
  const primaryColor = branding.primaryColor;
  const primaryDark = adjustColor(primaryColor, -0.15);

  // Confetti on mount
  useEffect(() => {
    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Fire again after a delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }, []);

  // If no state, redirect to tournament page
  useEffect(() => {
    if (!tournament && !golfer) {
      navigate(`/${orgSlug}/tournaments/${tournamentSlug}`);
    }
  }, [tournament, golfer, navigate, orgSlug, tournamentSlug]);

  if (!tournament) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <SignedInAdminBar dashboardPath={`/${orgSlug}/admin`} />
      {/* Header */}
      <header
        className="relative overflow-hidden px-4 py-10 text-white"
      >
        {branding.bannerUrl ? (
          <div className="absolute inset-0">
            <img src={branding.bannerUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(145deg, ${primaryDark} 0%, ${primaryColor} 40%, ${adjustColor(primaryColor, 0.08)} 100%)`,
            }}
          />
        )}
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="mb-4 flex justify-end gap-2">
            {isLoaded && isSignedIn ? (
              <button
                type="button"
                onClick={() => navigate(`/${orgSlug}/admin`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Staff Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                Staff Login
              </button>
            )}
          </div>
          <CheckCircle className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Registration Complete!</h1>
          <p className="text-lg text-white/90">
            You're registered for {tournament.display_name}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 -mt-4">
        <Card className="mb-6 rounded-2xl border border-stone-200 p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-bold text-stone-900">Registration Details</h2>
          
          {golfer && (
            <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-lg font-semibold text-stone-900">{golfer.name}</p>
              {golfer.email && (
                <p className="mt-1 flex items-center gap-2 text-stone-600">
                  <Mail size={16} />
                  {golfer.email}
                </p>
              )}
              {golfer.company && (
                <p className="mt-1 text-sm text-stone-500">{golfer.company}</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 text-stone-400" size={20} />
              <div>
                <p className="font-medium text-stone-900">{tournament.event_date || 'Date TBA'}</p>
                {tournament.registration_time && (
                  <p className="text-sm text-stone-500">Registration: {tournament.registration_time}</p>
                )}
                {tournament.start_time && (
                  <p className="text-sm text-stone-500">Start: {tournament.start_time}</p>
                )}
              </div>
            </div>

            {tournament.location_name && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 text-stone-400" size={20} />
                <div>
                  <p className="font-medium text-stone-900">{tournament.location_name}</p>
                  {tournament.location_address && (
                    <p className="text-sm text-stone-500">{tournament.location_address}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Payment Status Card */}
        <Card className="mb-6 rounded-2xl border border-stone-200 p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-1 text-stone-400" size={20} />
            <div className="flex-1">
              <h3 className="mb-2 font-bold text-stone-900">Payment Status</h3>
              
              {paymentComplete ? (
                <div className="bg-green-50 text-green-800 p-3 rounded-lg">
                  <p className="font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Payment Complete</p>
                  <p className="text-sm">Thank you! Your payment has been processed.</p>
                </div>
              ) : paymentPending ? (
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg">
                  <p className="font-medium">Payment Due on Tournament Day</p>
                  <p className="text-sm">
                    Please bring ${tournament.entry_fee_dollars?.toFixed(2)} 
                    {tournament.allow_cash && tournament.allow_check 
                      ? ' (cash or check)'
                      : tournament.allow_cash 
                      ? ' (cash)'
                      : ' (check)'}
                  </p>
                  {tournament.checks_payable_to && (
                    <p className="text-sm mt-1">
                      Checks payable to: {tournament.checks_payable_to}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-stone-100 p-3 text-stone-700">
                  <p className="text-sm">Payment status will be confirmed via email.</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* What's Next Card */}
        <Card className="mb-6 rounded-2xl border border-stone-200 p-6 shadow-soft">
          <h3 className="mb-4 font-bold text-stone-900">What's Next?</h3>
          <ul className="space-y-3 text-stone-600">
            <li className="flex items-start gap-3">
              <span className="bg-brand-100 text-brand-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
              <span>Check your email for a confirmation message</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-brand-100 text-brand-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
              <span>Mark your calendar for {tournament.event_date}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-brand-100 text-brand-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
              <span>
                Arrive at {tournament.location_name || 'the venue'} by {tournament.registration_time || 'the registration time'}
              </span>
            </li>
            {paymentPending && (
              <li className="flex items-start gap-3">
                <span className="bg-yellow-100 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">4</span>
                <span>Bring payment: ${tournament.entry_fee_dollars?.toFixed(2)}</span>
              </li>
            )}
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={`/${orgSlug}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <ArrowLeft size={18} className="mr-2" />
              View More Tournaments
            </Button>
          </Link>
          <Button 
            className="flex-1"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: tournament.display_name,
                  text: `I just registered for ${tournament.display_name}!`,
                  url: window.location.origin + `/${orgSlug}/tournaments/${tournamentSlug}`,
                });
              }
            }}
          >
            <Share2 size={18} className="mr-2" />
            Share
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-200 bg-stone-900 py-6 px-4 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-stone-400">
            Powered by <span className="text-white font-semibold">Pacific Golf</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
