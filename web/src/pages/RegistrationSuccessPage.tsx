import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { CheckCircle, Clock, Trophy, Loader2, AlertCircle } from 'lucide-react';
import { api, RegistrationStatus, Golfer } from '../services/api';

export const RegistrationSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State from navigation (pay on day flow)
  const stateRegistration = location.state?.registration;
  const stateMessage = location.state?.message;
  const paymentType = location.state?.paymentType;
  const checkoutError = location.state?.checkoutError;
  
  // Check if we're coming from a Stripe redirect (has session_id)
  const sessionId = searchParams.get('session_id');
  const needsConfirmation = !!sessionId && !stateRegistration;
  
  // State for handling embedded checkout return
  const [registration, setRegistration] = useState<Golfer | null>(stateRegistration || null);
  const [message, setMessage] = useState<string | null>(stateMessage || null);
  const [isLoading, setIsLoading] = useState(needsConfirmation); // Start loading if we have session_id
  const [error, setError] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [confirmAttempted, setConfirmAttempted] = useState(false);

  // Handle embedded checkout return (session_id in URL)
  useEffect(() => {
    // Only run once and only if we have a session_id
    if (!sessionId || confirmAttempted || stateRegistration) {
      return;
    }
    
    console.log('[SuccessPage] Confirming payment for session:', sessionId);
    setConfirmAttempted(true);
    setIsLoading(true);
    setError(null);
    
    // Confirm the payment and create the golfer
    api.confirmPayment(sessionId)
      .then((result) => {
        console.log('[SuccessPage] Confirm result:', result);
        if (result.success && result.golfer) {
          setRegistration(result.golfer);
          setMessage(result.message || 'Payment confirmed! Your registration is complete.');
        } else {
          setError(result.message || 'Payment confirmation failed');
        }
      })
      .catch((err) => {
        console.error('[SuccessPage] Payment confirmation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to confirm payment');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionId, confirmAttempted, stateRegistration]);

  useEffect(() => {
    api.getRegistrationStatus()
      .then(setRegistrationStatus)
      .catch(console.error);
  }, []);

  const regularFee = registrationStatus?.entry_fee_dollars ?? 125;
  const employeeFee = registrationStatus?.employee_entry_fee_dollars ?? 50;
  const entryFee = registration?.is_employee ? employeeFee : regularFee;
  const isWaitlist = registration?.registration_status === 'waitlist';

  // Show loading state while confirming payment
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirming Your Payment</h2>
          <p className="text-gray-600">Please wait while we finalize your registration...</p>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something Went Wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/register')} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            If you were charged, please contact us and we'll resolve this.
          </p>
        </Card>
      </div>
    );
  }

  // No registration data
  if (!registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Registration Found</h2>
          <p className="text-gray-600 mb-6">It looks like you haven't completed registration yet.</p>
          <Button onClick={() => navigate('/register')} className="w-full">
            Register Now
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden py-6 sm:py-12">
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23166534' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center mb-3 sm:mb-4">
            <Trophy className="text-[#1e3a5f]" size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a5f]">
            Registration {isWaitlist ? 'Received' : 'Confirmed'}!
          </h1>
        </div>

        <Card>
          {/* Waitlist Banner - More prominent */}
          {isWaitlist && (
            <div className="bg-amber-50 border-b border-amber-200 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4 sm:mb-6 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl">
              <div className="flex items-center justify-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-amber-500 rounded-full">
                  <Clock className="text-white" size={14} />
                </span>
                <span className="font-semibold text-amber-800 text-sm sm:text-base">You're on the Waitlist</span>
              </div>
            </div>
          )}

          <div className="text-center mb-4 sm:mb-6">
            {isWaitlist ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Clock className="text-amber-600" size={32} />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
            )}

            {isWaitlist ? (
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Registration Received!
                </h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                  {message || "The tournament has reached capacity, but you're on our waitlist. We'll notify you immediately if a spot opens up!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Your Spot is Confirmed!
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {message || "Your spot is confirmed!"}
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3">Registration Details</h3>
            {registration && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{registration.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{registration.email}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    {isWaitlist ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        Waitlist
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Confirmed
                      </span>
                    )}
                    {registration.is_employee && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        👤 Employee
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600">Payment:</span>
                  {registration.payment_status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Paid{registration.is_employee && ' (Employee Rate)'}
                    </span>
                  ) : (
                    <span className="font-medium text-gray-900">
                      Pay on Day{registration.is_employee && ' (Employee Rate)'}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {checkoutError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="font-semibold text-amber-900 text-sm sm:text-base mb-2">Payment Notice</h3>
              <p className="text-xs sm:text-sm text-amber-700">{checkoutError}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h3 className="font-semibold text-[#1e3a5f] text-sm sm:text-base mb-2">What's Next?</h3>
            <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc list-inside">
              {isWaitlist ? (
                <>
                  <li>We'll email you if a spot becomes available</li>
                  <li>Keep an eye on your inbox for updates</li>
                  <li>You can contact us at {registrationStatus?.contact_phone || '671.689.8677'} for your position on the waitlist</li>
                </>
              ) : (
                <>
                  <li>Check your email for confirmation and additional details</li>
                  <li>Mark your calendar: {registrationStatus?.event_date || 'January 9, 2026'}</li>
                  {(paymentType === 'pay-on-day' || registration?.payment_type === 'pay_on_day') && (
                    <li>Remember to bring payment (${entryFee.toFixed(2)}) on the day of the tournament</li>
                  )}
                  <li>Arrive early for check-in (Registration starts at 11:00 am)</li>
                </>
              )}
            </ul>
          </div>

          <div className="text-center">
            <Button onClick={() => navigate('/')} className="w-full sm:w-auto text-sm sm:text-base">
              Return to Home
            </Button>
          </div>
        </Card>

        <div className="text-center mt-6 sm:mt-8 text-gray-600">
          <p className="text-sm">Questions? Contact {registrationStatus?.contact_name || 'Peter Torres'} at {registrationStatus?.contact_phone || '671.689.8677'}</p>
        </div>
      </div>
    </div>
  );
};
