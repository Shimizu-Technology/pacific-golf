import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import { LiabilityWaiver } from '../components/LiabilityWaiver';
import { PaymentModal } from '../components/PaymentModal';
import { ChevronLeft, ChevronRight, Trophy, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api, Tournament } from '../services/api';
import { useOrganization } from '../components/OrganizationProvider';

interface FormData {
  fullName: string;
  company: string;
  mailingAddress: string;
  phone: string;
  email: string;
  paymentOption: 'pay-now' | 'pay-on-day' | '';
  waiverAccepted: boolean;
  handicap?: string;
}

export const OrgRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { orgSlug, tournamentSlug } = useParams<{ orgSlug: string; tournamentSlug: string }>();
  const { organization } = useOrganization();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    company: '',
    mailingAddress: '',
    phone: '',
    email: '',
    paymentOption: '',
    waiverAccepted: false,
    handicap: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Fetch tournament data on mount
  useEffect(() => {
    async function fetchTournament() {
      if (!orgSlug || !tournamentSlug) return;
      
      setIsLoading(true);
      try {
        const data = await api.getOrganizationTournament(orgSlug, tournamentSlug);
        setTournament(data);
      } catch (err: any) {
        console.error('Failed to fetch tournament:', err);
        setSubmitError(err.message || 'Failed to load tournament');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTournament();
  }, [orgSlug, tournamentSlug]);

  const entryFee = tournament?.current_fee_dollars ?? tournament?.entry_fee_dollars ?? 0;
  const primaryColor = organization?.primary_color || '#1e40af';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.waiverAccepted) {
      newErrors.waiverAccepted = 'You must accept the waiver to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.paymentOption) {
      newErrors.paymentOption = 'Please select a payment option';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3() || !tournament) return;
    
    if (formData.paymentOption === 'pay-now') {
      setShowPaymentModal(true);
    } else {
      await submitRegistration();
    }
  };

  const submitRegistration = async () => {
    if (!tournament) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const result = await api.registerGolfer({
        golfer: {
          name: formData.fullName,
          company: formData.company,
          address: formData.mailingAddress,
          phone: formData.phone,
          email: formData.email,
          payment_type: formData.paymentOption === 'pay-now' ? 'stripe' : 'pay_on_day',
          notes: formData.handicap ? `Handicap: ${formData.handicap}` : undefined,
        },
        waiver_accepted: formData.waiverAccepted,
      });

      // Navigate to success page
      navigate(`/${orgSlug}/tournaments/${tournamentSlug}/success`, {
        state: {
          golfer: result.golfer,
          tournament: tournament,
          paymentPending: formData.paymentOption === 'pay-on-day',
        }
      });
    } catch (error: any) {
      setSubmitError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    navigate(`/${orgSlug}/tournaments/${tournamentSlug}/success`, {
      state: {
        tournament: tournament,
        paymentComplete: true,
      }
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading registration...</p>
        </div>
      </div>
    );
  }

  // Error state or no tournament
  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tournament Not Found</h1>
          <p className="text-gray-600 mb-4">{submitError || 'The tournament you are looking for does not exist.'}</p>
          <Button onClick={() => navigate(`/${orgSlug}`)}>
            Back to Tournaments
          </Button>
        </Card>
      </div>
    );
  }

  // Registration closed
  if (!tournament.can_register) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Registration Closed</h1>
          <p className="text-gray-600 mb-4">
            Registration for {tournament.display_name} is currently closed.
            {tournament.at_capacity && ' The tournament is at capacity.'}
          </p>
          <Button onClick={() => navigate(`/${orgSlug}`)}>
            View Other Tournaments
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="text-white py-8 px-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">{tournament.display_name}</h1>
          <p className="text-lg opacity-90">{tournament.event_date}</p>
          <p className="opacity-75">{tournament.location_name}</p>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Your Info' },
            { num: 2, label: 'Waiver' },
            { num: 3, label: 'Payment' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= s.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.num ? <CheckCircle size={20} /> : s.num}
                </div>
                <span className="text-xs mt-1 text-gray-600">{s.label}</span>
              </div>
              {idx < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s.num ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {submitError}
          </div>
        )}

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Golfer Information</h2>
            <div className="space-y-4">
              <Input
                label="Full Name *"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                error={errors.fullName}
                placeholder="John Smith"
              />
              <Input
                label="Company/Organization"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Optional"
              />
              <Input
                label="Mailing Address"
                name="mailingAddress"
                value={formData.mailingAddress}
                onChange={handleInputChange}
                placeholder="Optional"
              />
              <Input
                label="Phone Number *"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
                placeholder="671-123-4567"
              />
              <Input
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                placeholder="john@example.com"
              />
              {tournament.handicap_required && (
                <Input
                  label="Handicap Index"
                  name="handicap"
                  value={formData.handicap}
                  onChange={handleInputChange}
                  placeholder="e.g., 15.2"
                />
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleNext}>
                Continue <ChevronRight size={18} className="ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Waiver */}
        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Liability Waiver</h2>
            <LiabilityWaiver 
              organizationName={organization?.name || 'the tournament organizer'}
            />
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="waiverAccepted"
                  checked={formData.waiverAccepted}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the terms of the liability waiver above.
                </span>
              </label>
              {errors.waiverAccepted && (
                <p className="text-red-500 text-sm mt-2">{errors.waiverAccepted}</p>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft size={18} className="mr-1" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!formData.waiverAccepted}>
                Continue <ChevronRight size={18} className="ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Payment</h2>
            
            {/* Fee Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Entry Fee</span>
                <span className="text-2xl font-bold">${entryFee.toFixed(2)}</span>
              </div>
              {tournament.early_bird_active && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Early bird pricing applied
                </p>
              )}
              {tournament.fee_includes && (
                <p className="text-sm text-gray-500 mt-2">
                  Includes: {tournament.fee_includes}
                </p>
              )}
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              {tournament.allow_card && (
                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                  formData.paymentOption === 'pay-now' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="paymentOption"
                    value="pay-now"
                    checked={formData.paymentOption === 'pay-now'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Pay Now with Card</span>
                    <p className="text-sm text-gray-500">Secure payment via Stripe</p>
                  </div>
                </label>
              )}

              {(tournament.allow_cash || tournament.allow_check) && (
                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
                  formData.paymentOption === 'pay-on-day' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="paymentOption"
                    value="pay-on-day"
                    checked={formData.paymentOption === 'pay-on-day'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Pay on Tournament Day</span>
                    <p className="text-sm text-gray-500">
                      {tournament.allow_cash && tournament.allow_check 
                        ? 'Cash or check accepted'
                        : tournament.allow_cash 
                        ? 'Cash accepted'
                        : 'Check accepted'}
                      {tournament.checks_payable_to && ` (checks payable to ${tournament.checks_payable_to})`}
                    </p>
                  </div>
                </label>
              )}
            </div>
            {errors.paymentOption && (
              <p className="text-red-500 text-sm mt-2">{errors.paymentOption}</p>
            )}

            {tournament.payment_instructions && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                {tournament.payment_instructions}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft size={18} className="mr-1" /> Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Processing...
                  </>
                ) : (
                  formData.paymentOption === 'pay-now' ? 'Proceed to Payment' : 'Complete Registration'
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        golferData={{
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          address: formData.mailingAddress,
        }}
        amount={entryFee}
        tournamentName={tournament.display_name}
      />

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 px-4 mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-400">
            Powered by <span className="text-white font-semibold">Pacific Golf</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
