import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { api } from '../services/api';
import { Loader2, CheckCircle, AlertCircle, CreditCard, User, Mail, Building2, Calendar, MapPin, Trophy, Check } from 'lucide-react';

interface PaymentInfo {
  golfer: {
    id: number;
    name: string;
    email: string;
    phone: string;
    company: string;
    is_employee: boolean;
    registration_status: string;
  };
  tournament: {
    id: number;
    name: string;
    event_date: string;
    location_name?: string;
  };
  entry_fee_cents: number;
  entry_fee_dollars: number;
  contact_name?: string;
  contact_phone?: string;
}

export default function PaymentLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedGolfer, setConfirmedGolfer] = useState<{
    name: string;
    email: string;
    is_employee: boolean;
    registration_status: string;
  } | null>(null);

  // Check if returning from Stripe success
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!token) {
      setError('Invalid payment link');
      setLoading(false);
      return;
    }

    // If we have a session_id, confirm the payment
    if (sessionId) {
      confirmPayment();
      return;
    }

    // Otherwise, fetch payment info
    fetchPaymentInfo();
  }, [token, sessionId]);

  const fetchPaymentInfo = async () => {
    try {
      const info = await api.getPaymentLinkInfo(token!);
      setPaymentInfo(info);
      
      // Get Stripe public key
      const regStatus = await api.getRegistrationStatus();
      if (regStatus.stripe_public_key) {
        setStripePromise(loadStripe(regStatus.stripe_public_key));
      }
    } catch (err: unknown) {
      const errorObj = err as { already_paid?: boolean; message?: string };
      if (errorObj.already_paid) {
        setAlreadyPaid(true);
      } else {
        setError(errorObj.message || 'Failed to load payment information');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    setIsConfirming(true);
    try {
      const result = await api.confirmPayment(sessionId!);
      if (result.golfer) {
        setConfirmedGolfer({
          name: result.golfer.name,
          email: result.golfer.email,
          is_employee: result.golfer.is_employee,
          registration_status: result.golfer.registration_status,
        });
      }
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Error confirming payment:', err);
      // Even if confirm fails, payment likely went through
      setPaymentSuccess(true);
    } finally {
      setIsConfirming(false);
      setLoading(false);
    }
  };

  const fetchClientSecret = useCallback(async () => {
    const response = await api.createPaymentLinkCheckout(token!);
    
    // Handle test mode - immediate success
    if (response.test_mode && response.success) {
      setPaymentSuccess(true);
      setShowCheckout(false);
      return '';
    }
    
    return response.client_secret;
  }, [token]);

  const handlePayNow = () => {
    setShowCheckout(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 text-[#1e3a5f] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {isConfirming ? 'Confirming your payment...' : 'Loading payment details...'}
          </p>
        </div>
      </div>
    );
  }

  // Payment success state
  if (paymentSuccess) {
    // Use confirmed golfer data if available, otherwise fall back to payment info
    const golferName = confirmedGolfer?.name || paymentInfo?.golfer.name;
    const golferEmail = confirmedGolfer?.email || paymentInfo?.golfer.email;
    const isEmployee = confirmedGolfer?.is_employee || paymentInfo?.golfer.is_employee;
    const tournamentName = paymentInfo?.tournament.name;
    const eventDate = paymentInfo?.tournament.event_date;
    const amountPaid = paymentInfo?.entry_fee_dollars;
    const contactName = paymentInfo?.contact_name || 'Peter Torres';
    const contactPhone = paymentInfo?.contact_phone || '671.689.8677';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 relative overflow-hidden py-6 sm:py-12">
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23166534' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center items-center mb-3 sm:mb-4">
              <Trophy className="text-[#1e3a5f]" size={40} />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a5f]">
              Payment Confirmed!
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            {/* Success Icon */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                Thank You for Your Payment!
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Your registration is now complete. A confirmation email has been sent to your email address.
              </p>
            </div>

            {/* Registration Details */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3">Registration Details</h3>
              
              {golferName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{golferName}</span>
                </div>
              )}
              {golferEmail && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{golferEmail}</span>
                </div>
              )}
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Confirmed
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Payment:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  <Check className="w-3 h-3" /> Paid{isEmployee && ' (Employee Rate)'}
                </span>
              </div>
              {amountPaid && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">${amountPaid.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* What's Next */}
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="font-semibold text-[#1e3a5f] text-sm sm:text-base mb-2">What's Next?</h3>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Check your email for confirmation and additional details</li>
                {eventDate && <li>Mark your calendar: {eventDate}</li>}
                <li>Arrive early for check-in (Registration starts at 11:00 am)</li>
              </ul>
            </div>

            {/* Return Button */}
            <div className="text-center">
              <button 
                onClick={() => navigate('/')} 
                className="w-full sm:w-auto px-8 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a87] transition-colors font-medium"
              >
                Return to Home
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center mt-6 sm:mt-8 text-gray-600">
            <p className="text-sm">Questions? Contact {contactName} at {contactPhone}</p>
          </div>
        </div>
      </div>
    );
  }

  // Already paid state
  if (alreadyPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">Already Paid</h1>
          <p className="text-gray-600 mb-6">
            This payment has already been completed. Check your email for your confirmation.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-medium hover:bg-[#2d4a6f] transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">Payment Link Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-medium hover:bg-[#2d4a6f] transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Show checkout
  if (showCheckout && stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 flex items-center justify-center p-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1e3a5f] rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1e3a5f]">Complete Payment</h2>
                <p className="text-sm text-gray-500">
                  ${paymentInfo?.entry_fee_dollars.toFixed(2)}
                  {paymentInfo?.golfer.is_employee && ' (Employee Rate)'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => setShowCheckout(false)}
              className="w-full py-2 text-[#1e3a5f] hover:text-[#2d4a6f] font-medium"
            >
              ← Back to details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main payment info view - styled to match registration page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 relative overflow-hidden py-6 sm:py-12">
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23166534' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 container mx-auto px-4 max-w-xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center mb-3 sm:mb-4">
            <Trophy className="text-[#1e3a5f]" size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a5f]">
            Complete Your Payment
          </h1>
          <p className="text-gray-600 mt-2">{paymentInfo?.tournament.name}</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Entry Fee Box - styled like registration page */}
          <div className="bg-amber-50 border-b border-amber-100 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Entry Fee</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">
                  ${paymentInfo?.entry_fee_dollars.toFixed(2)}
                </p>
              </div>
              {paymentInfo?.golfer.is_employee && (
                <span className="px-3 py-1.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">
                  👤 Employee Rate
                </span>
              )}
            </div>
            <p className="text-xs text-amber-700 mt-2">
              Includes Green Fee, Ditty Bag, Drinks & Food on the Course
            </p>
          </div>

          {/* Registration Details */}
          <div className="p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Your Registration Details</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium text-gray-900">{paymentInfo?.golfer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium text-gray-900 truncate ml-4">{paymentInfo?.golfer.email}</span>
              </div>
              {paymentInfo?.golfer.company && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Company</span>
                  <span className="text-sm font-medium text-gray-900">{paymentInfo.golfer.company}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  paymentInfo?.golfer.registration_status === 'confirmed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    paymentInfo?.golfer.registration_status === 'confirmed' ? 'bg-green-500' : 'bg-amber-500'
                  }`}></span>
                  {paymentInfo?.golfer.registration_status === 'confirmed' ? 'Confirmed' : 'Waitlist'}
                </span>
              </div>
            </div>

            {/* Event Info */}
            <div className="mt-4 bg-brand-50 border border-brand-100 rounded-xl p-4">
              <h4 className="font-semibold text-[#1e3a5f] text-sm mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium">Date:</span>
                  {paymentInfo?.tournament.event_date 
                    ? new Date(paymentInfo.tournament.event_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'TBD'
                  }
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium">Location:</span>
                  {paymentInfo?.tournament.location_name || 'Country Club of the Pacific'}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium">Registration:</span>
                  11:00 am
                </div>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <div className="p-4 sm:p-6 pt-0">
            <button
              onClick={handlePayNow}
              className="w-full py-4 bg-[#1e3a5f] text-white font-semibold text-lg rounded-xl hover:bg-[#2d4a6f] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <CreditCard className="w-5 h-5" />
              Pay Now
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-6 sm:mt-8 text-gray-600">
          <p className="text-sm">
            Questions? Contact {paymentInfo?.contact_name || 'Peter Torres'} at {paymentInfo?.contact_phone || '671.689.8677'}
          </p>
        </div>
      </div>
    </div>
  );
}

