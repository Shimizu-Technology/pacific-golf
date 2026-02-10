import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { Button } from '../components/ui';
import { Calendar, MapPin, Users, LayoutDashboard, Phone, ChevronRight, Check } from 'lucide-react';
import { api, RegistrationStatus } from '../services/api';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);

  useEffect(() => {
    // Fetch registration status (public endpoint)
    api.getRegistrationStatus()
      .then(setRegistrationStatus)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden">
      {/* Subtle golf course pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23166534' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Admin bar at top when signed in */}
      {isLoaded && isSignedIn && (
        <div className="relative z-10 bg-[#1e3a5f] text-white py-2 px-3 md:px-4">
          <div className="container mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <LayoutDashboard size={16} className="flex-shrink-0" />
              <span className="text-xs md:text-sm truncate">
                Signed in as <strong className="font-semibold">{user?.firstName || user?.emailAddresses[0]?.emailAddress}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-xs md:text-sm hover:underline whitespace-nowrap"
              >
                Go to Dashboard →
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10">
        {/* GIAA Header - Official Logo */}
        <div className="text-center mb-6 md:mb-8">
          <img 
            src="/images/giaa-logo.png" 
            alt="A.B. Won Pat International Airport Guam"
            className="mx-auto h-24 md:h-36 lg:h-44 w-auto"
          />
        </div>

        {/* Main Title Section */}
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1e3a5f] mb-3 md:mb-4 tracking-wide">
            {registrationStatus?.tournament_year || '2026'} {registrationStatus?.tournament_title || 'AIRPORT WEEK'}
          </h1>
          
          {/* Elegant script for "Xth Annual" */}
          <p 
            className="text-2xl sm:text-3xl md:text-4xl text-[#1e3a5f]/80 mb-2 md:mb-3"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
          >
            {registrationStatus?.tournament_edition || '5th'} Annual
          </p>
          
          {/* Tournament name with Ed's golfer silhouette */}
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {/* Ed's golfer silhouette - using their actual image */}
            <img 
              src="/images/pete-silhouette.png" 
              alt="Edward A.P. Muna II silhouette"
              className="w-12 h-auto md:w-16 lg:w-20"
            />
            
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#1e3a5f] tracking-tight">
                {(registrationStatus?.tournament_name || 'Edward A.P. Muna II Memorial Golf Tournament').replace(' Memorial Golf Tournament', '').toUpperCase()}
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#c9a227] tracking-widest mt-1 md:mt-2">
                MEMORIAL GOLF TOURNAMENT
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-900/10 overflow-hidden">
            {/* Event Details Header */}
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] px-4 sm:px-6 md:px-8 py-4 md:py-5">
              <h3 className="text-white text-sm md:text-base font-semibold tracking-wider uppercase text-center">
                Event Details
              </h3>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 md:p-5 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#1e3a5f] rounded-lg">
                      <Calendar className="text-white" size={18} />
                    </div>
                    <h4 className="font-bold text-[#1e3a5f] text-sm md:text-base">Date</h4>
                  </div>
                  <p className="text-gray-900 font-semibold text-base md:text-lg">{registrationStatus?.event_date || 'January 9, 2026'}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs md:text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#c9a227] flex-shrink-0"></span>
                      <span>Showtime/Registration: {registrationStatus?.registration_time || '11:00 am'}</span>
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Shotgun Start: {registrationStatus?.start_time || '12:30 pm'}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 md:p-5 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#1e3a5f] rounded-lg">
                      <MapPin className="text-white" size={18} />
                    </div>
                    <h4 className="font-bold text-[#1e3a5f] text-sm md:text-base">Location</h4>
                  </div>
                  <p className="text-gray-900 font-semibold text-base md:text-lg">{registrationStatus?.location_name || 'Country Club of the Pacific'}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-2">{registrationStatus?.location_address || 'Windward Hills, Guam'}</p>
                </div>

                <div className={`rounded-xl p-4 md:p-5 border ${
                  registrationStatus?.registration_open === false
                    ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                    : registrationStatus?.at_capacity 
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' 
                    : 'bg-gradient-to-br from-slate-50 to-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      registrationStatus?.registration_open === false
                        ? 'bg-gray-400'
                        : registrationStatus?.at_capacity 
                        ? 'bg-amber-500' 
                        : 'bg-[#1e3a5f]'
                    }`}>
                      <Users className="text-white" size={18} />
                    </div>
                    <h4 className="font-bold text-[#1e3a5f] text-sm md:text-base">Format</h4>
                  </div>
                  <p className="text-gray-900 font-semibold text-base md:text-lg">{registrationStatus?.format_name || 'Individual Callaway'}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-2">
                    Limited to {registrationStatus?.public_capacity ?? registrationStatus?.max_capacity ?? '...'} Players
                  </p>
                  {registrationStatus && (
                    <div className="mt-2">
                      {registrationStatus.registration_open === false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Registration Closed
                        </span>
                      ) : registrationStatus.public_at_capacity ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                          Waitlist Only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          {registrationStatus.public_capacity_remaining} spots left
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Entry Fee Section */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-[#059669] rounded-r-xl p-4 md:p-6 mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                      Entry Fee: <span className="text-[#059669]">${registrationStatus?.entry_fee_dollars?.toFixed(2) ?? '125.00'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                      {(registrationStatus?.fee_includes || 'Green Fee, Ditty Bag, Drinks & Food').split(',').map((item, index) => (
                        <span key={index} className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-[#059669]" /> {item.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 md:text-right">
                    <p>Make checks payable to: <strong>{registrationStatus?.checks_payable_to || 'GIAAEO'}</strong></p>
                    <p className="text-gray-500 mt-1">Prize winners contacted post tournament</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {registrationStatus?.registration_open === false ? (
                  <div className="w-full sm:w-auto px-6 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-center">
                    <p className="text-gray-600 font-semibold">Registration Closed</p>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => navigate('/register')}
                    className="w-full sm:w-auto text-base bg-[#1e3a5f] hover:bg-[#2c5282] shadow-lg shadow-blue-900/20"
                  >
                    Register Now
                    <ChevronRight size={18} className="ml-1" />
                  </Button>
                )}
                
                {/* Only show Dashboard button if admin is signed in */}
                {isLoaded && isSignedIn && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/admin/dashboard')}
                    className="w-full sm:w-auto text-base border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
                  >
                    Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Footer */}
        <div className="max-w-2xl mx-auto text-center mt-8 md:mt-10 px-4">
          {/* Desktop: Single row pill */}
          <div className="hidden sm:inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-5 py-3 shadow-lg shadow-blue-900/5">
            <Phone size={16} className="text-[#1e3a5f]" />
            <span className="text-sm text-gray-600">For more information:</span>
            <span className="font-bold text-[#1e3a5f]">{registrationStatus?.contact_name || 'Peter Torres'}</span>
            <a href={`tel:+1${(registrationStatus?.contact_phone || '671.689.8677').replace(/\D/g, '')}`} className="text-[#c9a227] font-semibold hover:underline">
              {registrationStatus?.contact_phone || '671.689.8677'}
            </a>
          </div>
          
          {/* Mobile: Styled like other cards */}
          <div className="sm:hidden bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-blue-100 shadow-lg shadow-blue-900/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#1e3a5f] rounded-lg">
                <Phone className="text-white" size={18} />
              </div>
              <h4 className="font-bold text-[#1e3a5f] text-sm">Contact</h4>
            </div>
            <p className="text-gray-900 font-semibold text-base mb-1">{registrationStatus?.contact_name || 'Peter Torres'}</p>
            <a 
              href={`tel:+1${(registrationStatus?.contact_phone || '671.689.8677').replace(/\D/g, '')}`}
              className="inline-flex items-center gap-2 text-[#c9a227] font-semibold text-lg hover:underline"
            >
              <span>Call</span>
              <span>{registrationStatus?.contact_phone || '671.689.8677'}</span>
            </a>
          </div>

          {/* Staff Login Link - Subtle but findable */}
          <div className="mt-8 pt-4 border-t border-gray-200/50">
            <button
              onClick={() => navigate('/admin/login')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-[#1e3a5f] hover:bg-white/80 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Staff Portal
            </button>
          </div>

          {/* Shimizu Technology Credit */}
          <div className="mt-6 pb-4">
            <a
              href="https://shimizu-technology.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1e3a5f] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Built by <span className="font-medium">Shimizu Technology</span></span>
            </a>
          </div>
        </div>

        {/* Decorative golf ball in corner - desktop only */}
        <div className="hidden lg:block fixed bottom-10 right-10 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-32 h-32" fill="#1e3a5f">
            <circle cx="50" cy="50" r="45" />
            <circle cx="35" cy="35" r="3" fill="white" opacity="0.5"/>
            <circle cx="50" cy="30" r="3" fill="white" opacity="0.5"/>
            <circle cx="65" cy="35" r="3" fill="white" opacity="0.5"/>
            <circle cx="30" cy="50" r="3" fill="white" opacity="0.5"/>
            <circle cx="45" cy="45" r="3" fill="white" opacity="0.5"/>
            <circle cx="60" cy="50" r="3" fill="white" opacity="0.5"/>
            <circle cx="70" cy="45" r="3" fill="white" opacity="0.5"/>
            <circle cx="35" cy="65" r="3" fill="white" opacity="0.5"/>
            <circle cx="50" cy="60" r="3" fill="white" opacity="0.5"/>
            <circle cx="65" cy="65" r="3" fill="white" opacity="0.5"/>
            <circle cx="40" cy="75" r="3" fill="white" opacity="0.5"/>
            <circle cx="55" cy="75" r="3" fill="white" opacity="0.5"/>
          </svg>
        </div>
      </div>
    </div>
  );
};
