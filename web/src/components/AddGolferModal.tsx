import React, { useState } from 'react';
import { X, UserPlus, ChevronDown, ChevronUp, UserCheck, Loader2, CheckCircle, AlertCircle, Send, Clock, CreditCard } from 'lucide-react';
import { Button } from './ui';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AddGolferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentName?: string;
}

// Payment options that make sense
type PaymentOption = 'pay_on_day' | 'send_payment_link' | 'already_paid';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  paymentOption: PaymentOption;
  notes: string;
  waiverAccepted: boolean;
  isEmployee: boolean;
  employeeNumber: string;
}

export const AddGolferModal: React.FC<AddGolferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tournamentName = 'Edward A.P. Muna II Memorial Golf Tournament',
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    paymentOption: 'pay_on_day',
    notes: '',
    waiverAccepted: false,
    isEmployee: false,
    employeeNumber: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [employeeValidation, setEmployeeValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    error: string | null;
  }>({ isValidating: false, isValid: null, error: null });

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    
    let cleanDigits = digits;
    if (digits.startsWith('1') && digits.length > 10) {
      cleanDigits = digits.slice(1);
    }
    cleanDigits = cleanDigits.slice(0, 10);
    
    if (cleanDigits.length <= 3) {
      return cleanDigits;
    } else if (cleanDigits.length <= 6) {
      return `(${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(3)}`;
    } else {
      return `(${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let processedValue = value;
    if (name === 'phone') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue,
    }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    
    // Clear employee validation when employee checkbox is unchecked
    if (name === 'isEmployee' && !checked) {
      setEmployeeValidation({ isValidating: false, isValid: null, error: null });
    }
  };

  // Validate employee number
  const handleEmployeeNumberChange = async (value: string) => {
    setFormData(prev => ({ ...prev, employeeNumber: value }));
    
    if (!value.trim()) {
      setEmployeeValidation({ isValidating: false, isValid: null, error: null });
      return;
    }

    setEmployeeValidation({ isValidating: true, isValid: null, error: null });
    
    try {
      const result = await api.validateEmployeeNumber(value.trim());
      if (result.valid) {
        setEmployeeValidation({ isValidating: false, isValid: true, error: null });
      } else {
        setEmployeeValidation({ isValidating: false, isValid: false, error: result.error || 'Invalid employee number' });
      }
    } catch {
      setEmployeeValidation({ isValidating: false, isValid: false, error: 'Failed to validate' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.waiverAccepted) {
      newErrors.waiverAccepted = 'Waiver must be accepted';
    }
    
    // Validate employee number if employee checkbox is checked
    if (formData.isEmployee) {
      if (!formData.employeeNumber.trim()) {
        newErrors.employeeNumber = 'Employee number is required';
      } else if (!employeeValidation.isValid) {
        newErrors.employeeNumber = employeeValidation.error || 'Please validate employee number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Determine payment_type and payment_status based on the payment option
      let payment_type: 'stripe' | 'pay_on_day';
      let payment_status: 'paid' | 'unpaid';

      switch (formData.paymentOption) {
        case 'send_payment_link':
          payment_type = 'stripe';
          payment_status = 'unpaid';
          break;
        case 'already_paid':
          payment_type = 'pay_on_day'; // Could also be 'cash' if we add that option
          payment_status = 'paid';
          break;
        case 'pay_on_day':
        default:
          payment_type = 'pay_on_day';
          payment_status = 'unpaid';
          break;
      }

      // First, register the golfer
      const result = await api.registerGolfer({
        golfer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company || undefined,
          address: formData.address,
          payment_type,
          payment_status,
          notes: formData.notes || undefined,
        },
        waiver_accepted: formData.waiverAccepted,
        is_employee: formData.isEmployee,
        employee_number: formData.isEmployee ? formData.employeeNumber : undefined,
      });

      // If "Send Payment Link" was selected, automatically send the payment link
      if (formData.paymentOption === 'send_payment_link' && result.golfer?.id) {
        try {
          await api.sendPaymentLink(result.golfer.id);
          toast.success(`${formData.name} registered and payment link sent!`);
        } catch (linkError) {
          console.error('Failed to send payment link:', linkError);
          toast.success(`${formData.name} registered! (Payment link will need to be sent manually)`);
        }
      } else if (formData.paymentOption === 'already_paid') {
        toast.success(`${formData.name} registered as paid${formData.isEmployee ? ' (Employee)' : ''}!`);
      } else {
        toast.success(`${formData.name} registered successfully${formData.isEmployee ? ' (Employee)' : ''}!`);
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      paymentOption: 'pay_on_day',
      notes: '',
      waiverAccepted: false,
      isEmployee: false,
      employeeNumber: '',
    });
    setErrors({});
    setShowWaiver(false);
    setEmployeeValidation({ isValidating: false, isValid: null, error: null });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <UserPlus className="text-blue-900" size={20} />
            <h3 className="text-lg font-bold text-gray-900">Add Golfer</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-4">
            {/* Contact Info Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Contact Information
              </h4>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +1
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`flex-1 px-3 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(671) 123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Additional Details
              </h4>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company/Organization
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="Optional"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mailing Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123 Main St, Tamuning, GU 96913"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Employee Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Employee Discount
              </h4>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isEmployee"
                    name="isEmployee"
                    checked={formData.isEmployee}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isEmployee" className="text-sm font-medium text-blue-900 flex items-center gap-2 cursor-pointer">
                    <UserCheck size={16} />
                    This is a GIAA employee
                  </label>
                </div>
                
                {formData.isEmployee && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Employee Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.employeeNumber}
                        onChange={(e) => handleEmployeeNumberChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                          errors.employeeNumber ? 'border-red-500' : 
                          employeeValidation.isValid ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter employee number"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {employeeValidation.isValidating && (
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        )}
                        {employeeValidation.isValid === true && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                        {employeeValidation.isValid === false && (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                      </div>
                    </div>
                    {employeeValidation.isValid && (
                      <p className="mt-1 text-xs text-green-600">✓ Valid employee number - $50 rate will apply</p>
                    )}
                    {employeeValidation.error && (
                      <p className="mt-1 text-xs text-red-600">{employeeValidation.error}</p>
                    )}
                    {errors.employeeNumber && !employeeValidation.error && (
                      <p className="mt-1 text-xs text-red-600">{errors.employeeNumber}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Payment
              </h4>

              <div className="space-y-2">
                {/* Pay on Day Option */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.paymentOption === 'pay_on_day'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentOption"
                    value="pay_on_day"
                    checked={formData.paymentOption === 'pay_on_day'}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" />
                      <span className="font-medium text-gray-900">Pay on Day of Tournament</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Golfer will pay at check-in (cash, check, or card)
                    </p>
                  </div>
                </label>

                {/* Send Payment Link Option */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.paymentOption === 'send_payment_link'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentOption"
                    value="send_payment_link"
                    checked={formData.paymentOption === 'send_payment_link'}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Send size={16} className="text-blue-500" />
                      <span className="font-medium text-gray-900">Send Payment Link</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Stripe</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Email golfer a secure link to pay online
                    </p>
                  </div>
                </label>

                {/* Already Paid Option */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.paymentOption === 'already_paid'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentOption"
                    value="already_paid"
                    checked={formData.paymentOption === 'already_paid'}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-green-500" />
                      <span className="font-medium text-gray-900">Already Paid</span>
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Cash/Check</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Payment already received (mark as paid immediately)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
                placeholder="Optional admin notes..."
              />
            </div>

            {/* Waiver Section */}
            <div className="pt-2 space-y-3">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Liability Waiver
              </h4>

              {/* Collapsible Waiver Text */}
              <button
                type="button"
                onClick={() => setShowWaiver(!showWaiver)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span>View Waiver Text</span>
                {showWaiver ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showWaiver && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-32 overflow-y-auto border border-gray-200">
                  <p className="font-semibold mb-2">WAIVER OF LIABILITY AND ASSUMPTION OF RISK</p>
                  <p className="mb-2">
                    In consideration of being permitted to participate in the {tournamentName}, I hereby waive, release, and discharge any and all
                    claims for damages for death, personal injury, or property damage which I may
                    have, or which may hereafter accrue to me, against the Guam International
                    Airport Authority, its officers, employees, and agents.
                  </p>
                  <p className="mb-2">
                    I acknowledge that golf is a potentially hazardous activity that could cause
                    injury or death. I voluntarily assume full responsibility for any risks of
                    loss, property damage, or personal injury that may be sustained as a result
                    of participating in this tournament.
                  </p>
                  <p>
                    I agree to abide by all rules and regulations of the tournament and the golf
                    course. I certify that I am physically fit and have no medical conditions
                    that would prevent my participation.
                  </p>
                </div>
              )}

              {/* Waiver Checkbox */}
              <div
                className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
                  errors.waiverAccepted
                    ? 'border-red-300 bg-red-50'
                    : formData.waiverAccepted
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  id="waiverAccepted"
                  name="waiverAccepted"
                  checked={formData.waiverAccepted}
                  onChange={handleChange}
                  className="mt-0.5 w-5 h-5 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                />
                <label
                  htmlFor="waiverAccepted"
                  className="text-sm text-gray-700 font-medium cursor-pointer"
                >
                  Golfer has read and agrees to the Liability Waiver
                </label>
              </div>
              {errors.waiverAccepted && (
                <p className="text-sm text-red-600">{errors.waiverAccepted}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 lg:px-6 py-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.waiverAccepted}
            >
              {isSubmitting 
                ? (formData.paymentOption === 'send_payment_link' ? 'Adding & Sending...' : 'Adding...') 
                : (formData.paymentOption === 'send_payment_link' ? 'Add & Send Link' : 'Add Golfer')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

