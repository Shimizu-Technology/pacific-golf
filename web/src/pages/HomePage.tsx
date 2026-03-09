import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  History,
  LayoutDashboard,
  Mail,
  MapPin,
  Quote,
  RefreshCw,
  Search,
  Send,
  Ticket,
  Trophy
} from 'lucide-react';
import { Button } from '../components/ui';
import { SignedInAdminBar } from '../components/SignedInAdminBar';
import { api, type AccessRequestPayload, type PublicTournamentListing } from '../services/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const [orgSlug, setOrgSlug] = useState('');
  const [openTournaments, setOpenTournaments] = useState<PublicTournamentListing[]>([]);
  const [discoverableLoading, setDiscoverableLoading] = useState(true);
  const [discoverableError, setDiscoverableError] = useState<string | null>(null);
  const [discoverableQuery, setDiscoverableQuery] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [accessForm, setAccessForm] = useState<AccessRequestPayload>({
    organization_name: '',
    contact_name: '',
    email: '',
    phone: '',
    notes: '',
    source: 'homepage',
  });
  const [honeypot, setHoneypot] = useState('');
  const cleanedSlug = useMemo(
    () => orgSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
    [orgSlug]
  );

  const goToOrg = () => {
    if (!cleanedSlug) return;
    navigate(`/${cleanedSlug}`);
  };

  useEffect(() => {
    let active = true;

    const loadDiscoverable = async () => {
      setDiscoverableLoading(true);
      setDiscoverableError(null);
      try {
        const items = await api.getDiscoverableTournaments();
        if (!active) return;
        setOpenTournaments(items);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Could not load open tournaments.';
        setDiscoverableError(message);
      } finally {
        if (active) setDiscoverableLoading(false);
      }
    };

    loadDiscoverable();
    return () => {
      active = false;
    };
  }, []);

  const filteredOpenTournaments = useMemo(() => {
    const term = discoverableQuery.trim().toLowerCase();
    if (!term) return openTournaments;

    return openTournaments.filter((item) =>
      `${item.organization_name} ${item.name} ${item.organization_slug}`.toLowerCase().includes(term)
    );
  }, [discoverableQuery, openTournaments]);

  const submitAccessRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestSuccess(null);
    setRequestError(null);

    if (
      !accessForm.organization_name.trim() ||
      !accessForm.contact_name.trim() ||
      !accessForm.email.trim()
    ) {
      setRequestError('Organization, contact name, and email are required.');
      return;
    }

    setRequestSubmitting(true);
    try {
      await api.submitAccessRequest({
        ...accessForm,
        organization_name: accessForm.organization_name.trim(),
        contact_name: accessForm.contact_name.trim(),
        email: accessForm.email.trim(),
        phone: accessForm.phone?.trim(),
        notes: accessForm.notes?.trim(),
        source: 'homepage',
      }, honeypot);
      setRequestSuccess("Thanks. We received your request and will contact you soon.");
      setAccessForm({
        organization_name: '',
        contact_name: '',
        email: '',
        phone: '',
        notes: '',
        source: 'homepage',
      });
      setHoneypot('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit request right now.';
      setRequestError(message);
    } finally {
      setRequestSubmitting(false);
    }
  };

  const resetAccessRequestForm = () => {
    setRequestSuccess(null);
    setRequestError(null);
    setAccessForm({
      organization_name: '',
      contact_name: '',
      email: '',
      phone: '',
      notes: '',
      source: 'homepage',
    });
    setHoneypot('');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <SignedInAdminBar />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />
        </div>

        <section className="relative max-w-6xl mx-auto px-6 py-16 lg:py-24">
          <header className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Trophy size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-stone-900">Pacific Golf</p>
                <p className="text-xs text-stone-600">Multi-tenant tournament platform</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 text-sm md:flex">
              <Link
                to="/legacy"
                className="rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:bg-stone-100"
              >
                Legacy View
              </Link>
              {isLoaded && isSignedIn && (
                <Link
                  to="/super-admin"
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 font-medium text-white transition-colors hover:bg-stone-700"
                >
                  <LayoutDashboard size={16} />
                  Admin Dashboard
                </Link>
              )}
            </div>
          </header>
          <div className="mb-8 flex flex-wrap items-center gap-2 text-sm md:hidden">
            <Link
              to="/legacy"
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-stone-700 transition-colors hover:bg-stone-100"
            >
              Legacy View
            </Link>
            <Link
              to="/admin/login"
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-stone-700 transition-colors hover:bg-stone-100"
            >
              Staff Login
            </Link>
            {isLoaded && isSignedIn && (
              <Link
                to="/super-admin"
                className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 font-medium text-white transition-colors hover:bg-stone-700"
              >
                <LayoutDashboard size={14} />
                Admin
              </Link>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Organization-first experience
              </p>
              <h1 className="mb-6 text-4xl font-display font-bold tracking-tight text-stone-900 md:text-5xl lg:text-6xl">
                One platform for every tournament host.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-stone-700">
                Pacific Golf replaces manual spreadsheets and disconnected workflows with one secure system for
                registration, check-in, scoring, raffles, sponsor workflows, and operations.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <QuickStat icon={Globe} label="Tenant routing" value="Path-based today" />
                <QuickStat icon={RefreshCw} label="Live sync" value="Shared real-time updates" />
                <QuickStat icon={History} label="Audit logs" value="Track who changed what" />
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-5">
              <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-stone-900">
                <Building2 size={20} />
                Open your organization portal
              </h2>
              <p className="mb-4 text-sm text-stone-600">
                Enter your organization slug to go directly to your branded tournament page.
              </p>
              <label htmlFor="org-slug" className="mb-2 block text-sm font-medium text-stone-700">
                Organization slug
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="org-slug"
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && goToOrg()}
                  placeholder="rotary-guam"
                  className="flex-1 rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button onClick={goToOrg} className="inline-flex items-center justify-center px-5">
                  Open
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                URL preview:{' '}
                <span className="font-medium text-stone-700">
                  pacific-golf.com/{cleanedSlug || 'your-organization'}
                </span>
              </p>

              <div className="mt-5 border-t border-stone-200 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Common examples</p>
                <div className="flex flex-wrap gap-2">
                  {['rotary-guam', 'chamber-guam', 'gngf'].map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setOrgSlug(slug)}
                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100"
                    >
                      /{slug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-stone-200/80 bg-white/70">
          <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
            <h2 className="mb-3 text-2xl font-display font-semibold tracking-tight text-stone-900">How organizations use Pacific Golf</h2>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-stone-600">
              Built from real tournament operations in Guam. Teams move from manual coordination to one shared
              platform where updates are immediate and every critical action is visible.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard
                title="Publish a branded portal"
                description="Each host runs on its own path and controls registration details, branding, and event settings."
              />
              <FeatureCard
                title="Centralize tournament operations"
                description="Replace cross-referenced spreadsheets with one source of truth for admin staff and volunteers."
              />
              <FeatureCard
                title="Seamless check-in flow"
                description="Check-in is fast and consistent on tournament day, so teams can process golfers without bottlenecks."
              />
              <FeatureCard
                icon={History}
                title="Audit log accountability"
                description="Every key admin change is logged so organizations can track who did what, when, and where."
              />
              <FeatureCard
                icon={Ticket}
                title="Raffles and extras in-platform"
                description="Handle raffle board and related event workflows in the same system as registration and scoring."
              />
              <FeatureCard
                icon={CheckCircle2}
                title="Live leaderboard and status"
                description="Players and guests can follow live updates while authorized staff manage entry and operations."
              />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-display font-semibold tracking-tight text-stone-900">
                  Open tournaments
                </h2>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
                  Public registration list
                </span>
              </div>

              <label htmlFor="open-tournament-search" className="mb-2 block text-sm font-medium text-stone-700">
                Search by organization or tournament
              </label>
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
                <Search size={16} className="text-stone-500" />
                <input
                  id="open-tournament-search"
                  type="text"
                  value={discoverableQuery}
                  onChange={(e) => setDiscoverableQuery(e.target.value)}
                  placeholder="Rotary, Chamber, memorial..."
                  className="w-full bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
                />
              </div>

              {discoverableLoading ? (
                <p className="text-sm text-stone-500">Loading open tournaments...</p>
              ) : discoverableError ? (
                <p className="text-sm text-red-600">{discoverableError}</p>
              ) : filteredOpenTournaments.length === 0 ? (
                <p className="text-sm text-stone-600">
                  No publicly listed tournaments match your search right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredOpenTournaments.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                          {item.organization_name}
                        </p>
                        <p className="text-base font-semibold text-stone-900">{item.name}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={13} />
                            {item.location_name || 'Location TBD'}
                          </span>
                          <span>{item.event_date || 'Date TBD'}</span>
                          <span>${item.entry_fee_dollars.toFixed(2)}</span>
                          {item.public_capacity_remaining != null && (
                            <span>{item.public_capacity_remaining} spots remaining</span>
                          )}
                        </p>
                      </div>
                      <Link
                        to={`/${item.organization_slug}/tournaments/${item.slug}`}
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        View tournament
                        <ArrowRight size={14} className="ml-1.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-5">
              <h2 className="mb-2 flex items-center gap-2 text-2xl font-display font-semibold tracking-tight text-stone-900">
                <Mail size={20} />
                Request access
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-stone-600">
                New organizations can request onboarding here. We respond with next steps, setup timing, and pricing.
              </p>

              {requestSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <CheckCircle2 size={18} className="mt-0.5 text-emerald-700" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Request sent</p>
                      <p className="text-sm text-emerald-800">{requestSuccess}</p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700">
                    You should also receive a follow-up by email once we review your request.
                  </p>
                  <Button type="button" className="mt-4 inline-flex items-center" onClick={resetAccessRequestForm}>
                    Submit another request
                  </Button>
                </div>
              ) : (
                <form onSubmit={submitAccessRequest} className="space-y-3">
                  <input
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Organization name"
                    value={accessForm.organization_name}
                    onChange={(e) => setAccessForm((prev) => ({ ...prev, organization_name: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={accessForm.contact_name}
                    onChange={(e) => setAccessForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={accessForm.email}
                    onChange={(e) => setAccessForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={accessForm.phone}
                    onChange={(e) => setAccessForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <textarea
                    placeholder="What kind of tournaments do you run?"
                    value={accessForm.notes}
                    onChange={(e) => setAccessForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  {requestError && <p className="text-sm text-red-600">{requestError}</p>}

                  <Button type="submit" className="inline-flex items-center" disabled={requestSubmitting || honeypot.length > 0}>
                    {requestSubmitting ? 'Submitting...' : 'Submit request'}
                    <Send size={14} className="ml-2" />
                  </Button>
                </form>
              )}
            </article>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              Guam International Airport Authority
            </p>
            <h2 className="mb-4 text-2xl font-display font-semibold tracking-tight text-stone-900">
              Digital transformation outcome
            </h2>
            <blockquote className="rounded-2xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
              <Quote size={18} className="mb-3 text-emerald-700" />
              <p className="text-base leading-relaxed text-stone-700 sm:text-lg">
                "Transitioning to a digital system was a significant milestone for us. The rollout was smooth,
                user-friendly for registrants, and efficient for our team. We immediately saw the benefits of a
                streamlined workflow."
              </p>
              <footer className="mt-4 border-t border-stone-200 pt-4 text-sm text-stone-600">
                Guam International Airport Authority - Golf Tournament Registration System
              </footer>
            </blockquote>
            <p className="mt-4 text-xs text-stone-500">
              Source: Shimizu Technology delivery feedback from airport tournament rollout.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-10 text-sm text-stone-600">
          <div className="flex flex-col gap-4 border-t border-stone-200 pt-6 md:flex-row md:items-center md:justify-between">
            <p>
              Subdomain support (for example <span className="font-medium text-stone-800">rotary.pacific-golf.com</span>)
              is planned as a future enhancement.
            </p>
            <a
              href="https://shimizu-technology.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-stone-700 underline-offset-2 transition-colors hover:text-emerald-700 hover:underline"
            >
              Built by Shimizu Technology
              <ArrowRight size={14} />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

type QuickStatProps = {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  value: string;
};

const QuickStat: React.FC<QuickStatProps> = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <Icon size={16} className="mb-2 text-emerald-700" />
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="text-sm font-medium text-stone-900">{value}</p>
    </div>
  );
};

type FeatureCardProps = {
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  description: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5">
      {Icon && <Icon size={16} className="mb-2 text-emerald-700" />}
      <h3 className="mb-2 font-semibold text-stone-900">{title}</h3>
      <p className="text-sm leading-relaxed text-stone-600">{description}</p>
    </article>
  );
};
