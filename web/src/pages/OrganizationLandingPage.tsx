import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrganization } from '../components/OrganizationProvider';
import { api, Tournament } from '../services/api';

export function OrganizationLandingPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { organization, isLoading: orgLoading } = useOrganization();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTournaments() {
      if (!orgSlug) return;
      
      setIsLoading(true);
      try {
        const data = await api.getOrganizationTournaments(orgSlug);
        setTournaments(data);
      } catch (err: any) {
        console.error('Failed to fetch tournaments:', err);
        setError(err.message || 'Failed to load tournaments');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTournaments();
  }, [orgSlug]);

  if (orgLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Organization Not Found</h1>
          <p className="mt-2 text-gray-600">The requested organization does not exist.</p>
        </div>
      </div>
    );
  }

  // Apply organization branding
  const primaryColor = organization.primary_color || '#1e40af';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with org branding */}
      <header 
        className="text-white py-12 px-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {organization.logo_url && (
            <img 
              src={organization.logo_url} 
              alt={organization.name}
              className="h-20 mx-auto mb-6 object-contain"
            />
          )}
          <h1 className="text-4xl font-bold mb-2">{organization.name}</h1>
          {organization.description && (
            <p className="text-lg opacity-90">{organization.description}</p>
          )}
        </div>
      </header>

      {/* Tournaments list */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Golf Tournaments</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-5xl mb-4">⛳</div>
            <p className="text-gray-600">No tournaments available at this time.</p>
            <p className="text-sm text-gray-500 mt-2">Check back soon for upcoming events!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament} 
                orgSlug={orgSlug!}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        )}

        {/* Contact info */}
        {(organization.contact_email || organization.contact_phone) && (
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2 text-gray-600">
              {organization.contact_email && (
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  <a href={`mailto:${organization.contact_email}`} className="text-brand-600 hover:underline">
                    {organization.contact_email}
                  </a>
                </p>
              )}
              {organization.contact_phone && (
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  <a href={`tel:${organization.contact_phone}`} className="text-brand-600 hover:underline">
                    {organization.contact_phone}
                  </a>
                </p>
              )}
              {organization.website_url && (
                <p>
                  <span className="font-medium">Website:</span>{' '}
                  <a 
                    href={organization.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {organization.website_url}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">
            Powered by <span className="text-white font-semibold">Pacific Golf</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Golf tournament management made simple
          </p>
        </div>
      </footer>
    </div>
  );
}

interface TournamentCardProps {
  tournament: Tournament;
  orgSlug: string;
  primaryColor: string;
}

function TournamentCard({ tournament, orgSlug, primaryColor }: TournamentCardProps) {
  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-brand-100 text-brand-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    open: 'Registration Open',
    closed: 'Registration Closed',
    in_progress: 'In Progress',
    completed: 'Completed',
    draft: 'Coming Soon',
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{tournament.display_name}</h3>
            {tournament.event_date && (
              <p className="text-gray-600 mt-1">{tournament.event_date}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[tournament.status] || 'bg-gray-100'}`}>
            {statusLabels[tournament.status] || tournament.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
          {tournament.location_name && (
            <div>
              <span className="font-medium">Location:</span>{' '}
              {tournament.location_name}
            </div>
          )}
          {tournament.format_name && (
            <div>
              <span className="font-medium">Format:</span>{' '}
              {tournament.format_name}
            </div>
          )}
          {tournament.entry_fee_dollars !== undefined && (
            <div>
              <span className="font-medium">Entry Fee:</span>{' '}
              ${tournament.entry_fee_dollars.toFixed(2)}
            </div>
          )}
          {tournament.max_capacity && (
            <div>
              <span className="font-medium">Capacity:</span>{' '}
              {tournament.confirmed_count || 0}/{tournament.max_capacity} registered
            </div>
          )}
        </div>

        {tournament.can_register && (
          <div className="mt-6">
            <Link
              to={`/${orgSlug}/tournaments/${tournament.slug}/register`}
              className="inline-block px-6 py-3 text-white font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              Register Now
            </Link>
          </div>
        )}

        {!tournament.can_register && tournament.status === 'open' && (
          <div className="mt-6">
            <Link
              to={`/${orgSlug}/tournaments/${tournament.slug}`}
              className="inline-block px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              View Details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
