import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/ui';
import { LiabilityWaiver } from '../components/LiabilityWaiver';
import { PaymentModal } from '../components/PaymentModal';
import { ChevronLeft, ChevronRight, Trophy, UserCheck, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { api, RegistrationStatus } from '../services/api';

interface FormData {
  fullName: string;
  company: string;
  mailingAddress: string;
  phone: string;
  email: string;
  paymentOption: 'pay-now' | 'pay-on-day' | '';
  waiverAccepted: boolean;
  isEmployee: boolean;
  employeeNumber: string;
}

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Employee validation state
  const [employeeValidation, setEmployeeValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    error: string | null;
    discountedFee: number | null;
  }>({ isValidating: false, isValid: null, error: null, discountedFee: null });
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    company: '',
    mailingAddress: '',
    phone: '',
    email: '',
    paymentOption: '',
    waiverAccepted: false,
    isEmployee: false,
    employeeNumber: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Fetch entry fee on mount
  useEffect(() => {
    api.getRegistrationStatus()
      .then(setRegistrationStatus)
      .catch(console.error);
  }, []);

  const regularFee = registrationStatus?.entry_fee_dollars ?? 125;
  const employeeFee = registrationStatus?.employee_entry_fee_dollars ?? 50;
  const entryFee = (formData.isEmployee && employeeValidation.isValid) ? employeeFee : regularFee;
  const stripePublicKey = registrationStatus?.stripe_public_key || '';

  // Validate employee number when it changes
  useEffect(() => {
    if (!formData.isEmployee || !formData.employeeNumber.trim()) {
      setEmployeeValidation({ isValidating: false, isValid: null, error: null, discountedFee: null });
      return;
    }

    // Debounce the validation
    const timeout = setTimeout(async () => {
      setEmployeeValidation(prev => ({ ...prev, isValidating: true, error: null }));
      
      try {
        const result = await api.validateEmployeeNumber(formData.employeeNumber.trim());
        if (result.valid) {
          setEmployeeValidation({
            isValidating: false,
            isValid: true,
            error: null,
            discountedFee: result.employee_fee_dollars || employeeFee,
          });
        } else {
          setEmployeeValidation({
            isValidating: false,
            isValid: false,
            error: result.error || 'Invalid employee number',
            discountedFee: null,
          });
        }
      } catch {
        setEmployeeValidation({
          isValidating: false,
          isValid: false,
          error: 'Failed to validate employee number',
          discountedFee: null,
        });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData.isEmployee, formData.employeeNumber, employeeFee]);

  // Format phone number: only format when we have enough digits, allow free typing
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // If empty, return empty
    if (digits.length === 0) return '';
    
    // Remove leading 1 if present (we'll add +1 in display)
    let cleanDigits = digits;
    if (digits.startsWith('1') && digits.length > 10) {
      cleanDigits = digits.slice(1);
    }
    
    // Limit to 10 digits
    cleanDigits = cleanDigits.slice(0, 10);
    
    // Format progressively
    if (cleanDigits.length <= 3) {
      return cleanDigits;
    } else if (cleanDigits.length <= 6) {
      return `(${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(3)}`;
    } else {
      return `(${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    if (name === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue,
    }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setSubmitError(null);
  };

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.mailingAddress.trim()) newErrors.mailingAddress = 'Mailing address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.waiverAccepted) {
      newErrors.waiverAccepted = 'You must accept the liability waiver to continue';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
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
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we're on step 4 and payment option is selected
    if (step !== 4 || !validateStep4()) {
      return;
    }

    // Check if we're in test mode (simulated payments)
    const isTestMode = registrationStatus?.payment_mode === 'test';

    // For Stripe payments in PRODUCTION mode, show the embedded checkout modal
    if (formData.paymentOption === 'pay-now' && !isTestMode) {
      // Check if Stripe is configured
      if (!stripePublicKey) {
        setSubmitError('Online payment is not available at this time. Please select "Pay on Day of Tournament".');
        return;
      }
      setShowPaymentModal(true);
      return;
    }
    
    // For "Pay on Day" OR test mode "Pay Now", register directly
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // In test mode with "Pay Now", register as stripe but simulate payment
      const paymentType = formData.paymentOption === 'pay-now' ? 'stripe' : 'pay_on_day';
      
      const result = await api.registerGolfer({
        golfer: {
          name: formData.fullName,
          company: formData.company,
          address: formData.mailingAddress,
          phone: formData.phone,
          email: formData.email,
          payment_type: paymentType,
        },
        waiver_accepted: formData.waiverAccepted,
        employee_number: formData.isEmployee && employeeValidation.isValid ? formData.employeeNumber : undefined,
      });

      // In test mode with Stripe, simulate marking as paid
      if (isTestMode && formData.paymentOption === 'pay-now' && result.golfer) {
        try {
          // Create a fake checkout session and confirm it to simulate payment
          const checkoutResult = await api.createCheckoutSession(result.golfer.id);
          if (checkoutResult.session_id) {
            await api.confirmPayment(checkoutResult.session_id);
            // Refetch the golfer to get updated payment status
            result.golfer.payment_status = 'paid';
          }
        } catch (simError) {
          console.log('Test mode payment simulation:', simError);
          // Continue anyway - golfer is registered
        }
      }

      navigate('/registration/success', { 
        state: { 
          registration: result.golfer,
          message: result.message,
          paymentType: formData.paymentOption,
          testMode: isTestMode,
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle successful payment from embedded checkout
  const handlePaymentSuccess = (sessionId: string) => {
    // The embedded checkout will redirect to /registration/success with session_id
    // which will then call confirm to create the golfer
    console.log('Payment completed, session:', sessionId);
  };

  // Show registration closed message
  if (registrationStatus && registrationStatus.registration_open === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 relative overflow-hidden py-6 sm:py-12 flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23166534' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 container mx-auto px-4 max-w-lg text-center">
          <Card className="p-8 sm:p-12">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-gray-400" size={40} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Registration Closed
              </h1>
              <p className="text-gray-600">
                Registration for the {registrationStatus?.tournament_name || 'golf tournament'} is currently closed.
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Return to Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-emerald-50 relative overflow-hidden py-6 sm:py-12">
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23166534' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center mb-3 sm:mb-4">
            <Trophy className="text-[#1e3a5f]" size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-1 sm:mb-2">
            Tournament Registration
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {registrationStatus?.tournament_name || 'Edward A.P. Muna II Memorial Golf Tournament'}
          </p>
        </div>

        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3, 4].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base shadow-sm transition-all duration-200 ${
                      step >= stepNumber
                        ? 'bg-[#1e3a5f] text-white shadow-[#1e3a5f]/25'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-2 font-medium ${
                    step >= stepNumber ? 'text-[#1e3a5f]' : 'text-gray-500'
                  }`}>
                    {stepNumber === 1 && 'Contact'}
                    {stepNumber === 2 && 'Details'}
                    {stepNumber === 3 && 'Waiver'}
                    {stepNumber === 4 && 'Payment'}
                  </span>
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full transition-colors duration-200 ${
                      step > stepNumber ? 'bg-[#1e3a5f]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Contact Information
                </h2>
                <Input
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +1
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="(671) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Additional Details
                </h2>
                <Input
                  label="Company/Organization (Optional)"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                />
                <Input
                  label="Mailing Address"
                  name="mailingAddress"
                  value={formData.mailingAddress}
                  onChange={handleChange}
                  error={errors.mailingAddress}
                  required
                />

                {/* Employee Discount Section */}
                {registrationStatus?.employee_discount_available && (
                  <div className="p-4 bg-brand-50 rounded-lg border border-brand-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isEmployee"
                        name="isEmployee"
                        checked={formData.isEmployee}
                        onChange={(e) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            isEmployee: e.target.checked,
                            employeeNumber: e.target.checked ? prev.employeeNumber : ''
                          }));
                          if (!e.target.checked) {
                            setEmployeeValidation({ isValidating: false, isValid: null, error: null, discountedFee: null });
                          }
                        }}
                        className="w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                      />
                      <label htmlFor="isEmployee" className="text-sm font-medium text-brand-800 flex items-center gap-2 cursor-pointer">
                        <UserCheck size={16} />
                        I am a GIAA employee
                      </label>
                    </div>

                    {formData.isEmployee && (
                      <div className="mt-3 pl-8">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="employeeNumber"
                            value={formData.employeeNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                              employeeValidation.isValid === true 
                                ? 'border-green-300 focus:ring-green-500' 
                                : employeeValidation.isValid === false 
                                  ? 'border-red-300 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-brand-500'
                            }`}
                            placeholder="Enter your employee number"
                          />
                          <div className="absolute right-3 top-2.5">
                            {employeeValidation.isValidating && (
                              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            {!employeeValidation.isValidating && employeeValidation.isValid === true && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {!employeeValidation.isValidating && employeeValidation.isValid === false && (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </div>
                        {employeeValidation.error && (
                          <p className="text-sm text-red-600 mt-1">{employeeValidation.error}</p>
                        )}
                        {employeeValidation.isValid && (
                          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Employee discount will be applied - You pay ${employeeFee.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Liability Waiver
                </h2>
                <LiabilityWaiver />
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="waiverAccepted"
                    name="waiverAccepted"
                    checked={formData.waiverAccepted}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-[#1e3a5f] border-gray-300 rounded focus:ring-[#1e3a5f]"
                  />
                  <label htmlFor="waiverAccepted" className="text-sm text-gray-700 font-medium">
                    I have read and agree to the Liability Waiver. I understand the risks
                    associated with participating in this golf tournament.
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                </div>
                {errors.waiverAccepted && (
                  <p className="text-sm text-red-600">{errors.waiverAccepted}</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Payment Selection <span className="text-red-500 text-lg">*</span>
                </h2>
                <div className={`rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 ${
                  formData.isEmployee && employeeValidation.isValid 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <p className="text-base sm:text-lg font-semibold text-gray-900">
                      Entry Fee: ${entryFee.toFixed(2)}
                    </p>
                    {formData.isEmployee && employeeValidation.isValid && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <UserCheck size={12} />
                        Employee Discount
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {formData.isEmployee && employeeValidation.isValid 
                      ? 'Green fees only (Employee rate)'
                      : 'Includes Green Fee, Ditty Bag, Drinks & Food on the Course'
                    }
                  </p>
                  {formData.isEmployee && employeeValidation.isValid && (
                    <p className="text-xs text-green-600 mt-1">
                      <span className="line-through text-gray-400">${regularFee.toFixed(2)}</span> → ${employeeFee.toFixed(2)} (You save ${(regularFee - employeeFee).toFixed(2)})
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${formData.paymentOption === 'pay-now' ? 'border-[#1e3a5f] bg-brand-50' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="pay-now"
                      checked={formData.paymentOption === 'pay-now'}
                      onChange={handleChange}
                      className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 text-[#1e3a5f] flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">Pay Now (Stripe)</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Secure payment via credit card. Your spot will be confirmed immediately.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${formData.paymentOption === 'pay-on-day' ? 'border-[#1e3a5f] bg-brand-50' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="pay-on-day"
                      checked={formData.paymentOption === 'pay-on-day'}
                      onChange={handleChange}
                      className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 text-[#1e3a5f] flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">Pay on Day of Tournament</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Pay by cash, check (payable to {registrationStatus?.checks_payable_to || 'GIAAEO'}), or credit card at check-in.
                      </p>
                    </div>
                  </label>
                </div>

                {errors.paymentOption && (
                  <p className="text-sm text-red-600">{errors.paymentOption}</p>
                )}

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {submitError}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between gap-3 mt-6 sm:mt-8">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
                >
                  <ChevronLeft size={16} />
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
                >
                  Cancel
                </Button>
              )}

              {step < 4 ? (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  disabled={step === 3 && !formData.waiverAccepted}
                  className="min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="min-w-[100px] sm:min-w-[120px] text-sm sm:text-base">
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                  <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      {/* Stripe Payment Modal */}
      {showPaymentModal && stripePublicKey && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          golferData={{
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            company: formData.company || undefined,
            address: formData.mailingAddress || undefined,
          }}
          entryFee={entryFee}
          stripePublicKey={stripePublicKey}
          employeeNumber={formData.isEmployee && employeeValidation.isValid ? formData.employeeNumber : undefined}
          isEmployee={formData.isEmployee && employeeValidation.isValid}
        />
      )}
    </div>
  );
};
