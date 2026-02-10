import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrganization } from '../components/OrganizationProvider';
import { api, Tournament, Sponsor } from '../services/api';
import { 
  Calendar, MapPin, Users, DollarSign, Clock, 
  Trophy, Loader2, AlertCircle, ChevronLeft, Star, Building2, ExternalLink, Check
} from 'lucide-react';
import { Button, Card } from '../components/ui';

export function OrgTournamentPage() {
  const { orgSlug, tournamentSlug } = useParams<{ orgSlug: string; tournamentSlug: string }>();
  const { organization, isLoading: orgLoading } = useOrganization();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTournament() {
      if (!orgSlug || !tournamentSlug) return;
      
      setIsLoading(true);
      try {
        const data = await api.getOrganizationTournament(orgSlug, tournamentSlug);
        setTournament(data);
      } catch (err: any) {
        console.error('Failed to fetch tournament:', err);
        setError(err.message || 'Failed to load tournament');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTournament();
  }, [orgSlug, tournamentSlug]);

  const primaryColor = organization?.primary_color || '#1e40af';

  if (orgLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tournament Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The tournament does not exist.'}</p>
          <Link to={`/${orgSlug}`}>
            <Button>Back to Tournaments</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    open: 'Registration Open',
    closed: 'Registration Closed',
    in_progress: 'Tournament In Progress',
    completed: 'Completed',
    draft: 'Coming Soon',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="text-white py-12 px-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-4xl mx-auto">
          <Link 
            to={`/${orgSlug}`}
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ChevronLeft size={20} />
            <span>Back to {organization?.name || 'Tournaments'}</span>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <Trophy className="h-12 w-12 mb-4" />
              <h1 className="text-4xl font-bold mb-2">{tournament.display_name}</h1>
              {tournament.event_date && (
                <p className="text-xl opacity-90">{tournament.event_date}</p>
              )}
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[tournament.status]}`}>
              {statusLabels[tournament.status] || tournament.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 -mt-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <Card className="md:col-span-2 p-6">
            <h2 className="text-xl font-bold mb-4">Tournament Details</h2>
            
            <div className="space-y-4">
              {tournament.location_name && (
                <div className="flex items-start gap-3">
                  <MapPin className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="font-medium">{tournament.location_name}</p>
                    {tournament.location_address && (
                      <p className="text-gray-500 text-sm">{tournament.location_address}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="font-medium">{tournament.event_date || 'Date TBA'}</p>
                  {tournament.registration_time && (
                    <p className="text-gray-500 text-sm">Registration: {tournament.registration_time}</p>
                  )}
                  {tournament.start_time && (
                    <p className="text-gray-500 text-sm">Start: {tournament.start_time}</p>
                  )}
                </div>
              </div>

              {tournament.format_name && (
                <div className="flex items-start gap-3">
                  <Trophy className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="font-medium">Format: {tournament.format_name}</p>
                    {tournament.tournament_format && (
                      <p className="text-gray-500 text-sm capitalize">
                        {tournament.tournament_format.replace('_', ' ')} 
                        {tournament.team_size && tournament.team_size > 1 && ` (${tournament.team_size}-person teams)`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {tournament.fee_includes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-2">Entry Fee Includes:</p>
                  <p className="text-gray-600">{tournament.fee_includes}</p>
                </div>
              )}

              {tournament.contact_name && (
                <div className="mt-6 pt-4 border-t">
                  <p className="font-medium">Contact</p>
                  <p className="text-gray-600">{tournament.contact_name}</p>
                  {tournament.contact_phone && (
                    <p className="text-gray-500">{tournament.contact_phone}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Registration Card */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Registration</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Entry Fee</span>
                  <span className="font-bold text-lg">
                    ${tournament.current_fee_dollars?.toFixed(2) || tournament.entry_fee_dollars?.toFixed(2)}
                  </span>
                </div>

                {tournament.early_bird_active && tournament.early_bird_deadline && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded flex items-center gap-1">
                    <Check className="w-4 h-4" /> Early bird pricing active until {new Date(tournament.early_bird_deadline).toLocaleDateString()}
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Capacity</span>
                  <span>
                    {tournament.confirmed_count || 0} / {tournament.public_capacity || tournament.max_capacity} registered
                  </span>
                </div>

                {tournament.waitlist_count > 0 && (
                  <div className="text-sm text-yellow-600">
                    {tournament.waitlist_count} on waitlist
                  </div>
                )}
              </div>

              {tournament.can_register ? (
                <Link to={`/${orgSlug}/tournaments/${tournamentSlug}/register`}>
                  <Button 
                    className="w-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Register Now
                  </Button>
                </Link>
              ) : tournament.at_capacity ? (
                <Button className="w-full" disabled>
                  At Capacity
                </Button>
              ) : tournament.status === 'open' ? (
                <Button className="w-full" disabled>
                  Registration Opening Soon
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  Registration Closed
                </Button>
              )}

              {tournament.registration_deadline && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Registration deadline: {new Date(tournament.registration_deadline).toLocaleDateString()}
                </p>
              )}
            </Card>

            {/* Payment Info */}
            <Card className="p-6">
              <h3 className="font-bold mb-3">Payment Options</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {tournament.allow_card && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> Credit/Debit Card
                  </li>
                )}
                {tournament.allow_cash && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> Cash (on tournament day)
                  </li>
                )}
                {tournament.allow_check && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> Check
                    {tournament.checks_payable_to && (
                      <span className="text-gray-400">
                        (payable to {tournament.checks_payable_to})
                      </span>
                    )}
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </main>

      {/* Sponsors Section */}
      {tournament.sponsors && tournament.sponsors.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="text-yellow-500" />
            Our Sponsors
          </h2>
          
          {/* Major Sponsors (Title, Platinum, Gold) */}
          {tournament.sponsors.filter(s => s.major).length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tournament.sponsors
                  .filter(s => s.major)
                  .map(sponsor => (
                    <SponsorCard key={sponsor.id} sponsor={sponsor} size="large" />
                  ))}
              </div>
            </div>
          )}
          
          {/* Other Sponsors (Silver, Bronze) */}
          {tournament.sponsors.filter(s => !s.major && s.tier !== 'hole').length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Supporting Sponsors</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {tournament.sponsors
                  .filter(s => !s.major && s.tier !== 'hole')
                  .map(sponsor => (
                    <SponsorCard key={sponsor.id} sponsor={sponsor} size="small" />
                  ))}
              </div>
            </div>
          )}
          
          {/* Hole Sponsors */}
          {tournament.sponsors.filter(s => s.tier === 'hole').length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Hole Sponsors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tournament.sponsors
                  .filter(s => s.tier === 'hole')
                  .sort((a, b) => (a.hole_number || 0) - (b.hole_number || 0))
                  .map(sponsor => (
                    <div 
                      key={sponsor.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                        {sponsor.hole_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{sponsor.name}</p>
                        {sponsor.website_url && (
                          <a 
                            href={sponsor.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Visit Website
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">
            Powered by <span className="text-white font-semibold">Pacific Golf</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Sponsor Card Component
function SponsorCard({ sponsor, size }: { sponsor: Sponsor; size: 'large' | 'small' }) {
  const tierColors: Record<string, string> = {
    title: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300',
    platinum: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300',
    gold: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300',
    silver: 'bg-gray-50 border-gray-200',
    bronze: 'bg-orange-50 border-orange-200',
  };

  const tierBadgeColors: Record<string, string> = {
    title: 'bg-yellow-500 text-white',
    platinum: 'bg-slate-500 text-white',
    gold: 'bg-amber-500 text-white',
    silver: 'bg-gray-400 text-white',
    bronze: 'bg-orange-400 text-white',
  };

  const content = (
    <div 
      className={`
        relative p-4 rounded-xl border-2 transition-all hover:shadow-md
        ${tierColors[sponsor.tier] || 'bg-white border-gray-200'}
        ${size === 'large' ? 'min-h-[120px]' : 'min-h-[80px]'}
      `}
    >
      {/* Tier Badge */}
      <span className={`
        absolute -top-2 -right-2 text-xs font-bold px-2 py-0.5 rounded-full
        ${tierBadgeColors[sponsor.tier] || 'bg-gray-500 text-white'}
      `}>
        {sponsor.tier === 'title' ? '★ Title' : sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
      </span>

      {/* Logo or Name */}
      {sponsor.logo_url ? (
        <div className="flex items-center justify-center h-full">
          <img 
            src={sponsor.logo_url} 
            alt={sponsor.name}
            className={`max-w-full object-contain ${size === 'large' ? 'max-h-16' : 'max-h-10'}`}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Building2 className={`text-gray-400 mb-1 ${size === 'large' ? 'w-8 h-8' : 'w-5 h-5'}`} />
          <p className={`font-semibold text-gray-700 ${size === 'large' ? 'text-sm' : 'text-xs'}`}>
            {sponsor.name}
          </p>
        </div>
      )}

      {/* Website Link Indicator */}
      {sponsor.website_url && (
        <ExternalLink className="absolute bottom-2 right-2 w-3 h-3 text-gray-400" />
      )}
    </div>
  );

  if (sponsor.website_url) {
    return (
      <a 
        href={sponsor.website_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}
