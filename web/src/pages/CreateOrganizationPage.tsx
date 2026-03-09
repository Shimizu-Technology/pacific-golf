import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthToken } from '../hooks/useAuthToken';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ImageUpload } from '../components/ImageUpload';
import { isValidWebsiteUrl, normalizeWebsiteUrl } from '../utils/url';
import {
  ArrowLeft,
  Building2,
  Loader2,
  Save,
  Palette,
  Mail,
  Phone,
  Globe,
  FileText,
  UserPlus,
  X,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface FormData {
  name: string;
  slug: string;
  description: string;
  primary_color: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  logo_url: string;
  banner_url: string;
}

const defaultFormData: FormData = {
  name: '',
  slug: '',
  description: '',
  primary_color: '#16a34a',
  contact_email: '',
  contact_phone: '',
  website_url: '',
  logo_url: '',
  banner_url: '',
};

// Preset brand colors
const colorPresets = [
  { name: 'Green', value: '#16a34a' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Pink', value: '#db2777' },
];

export const CreateOrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { getToken } = useAuthToken();
  const { loading: userLoading, isSuperAdmin } = useCurrentUser();
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [adminInviteEmails, setAdminInviteEmails] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const inviteDeliveryHint = 'Invite sent. If they do not see it, ask them to check spam/promotions.';

  useEffect(() => {
    if (!userLoading && !isSuperAdmin) {
      navigate('/');
    }
  }, [userLoading, isSuperAdmin, navigate]);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Special handling for slug - only allow lowercase, numbers, hyphens
    if (name === 'slug') {
      const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, [name]: cleanSlug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is edited
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'URL slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    if (formData.website_url && !isValidWebsiteUrl(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddInviteEmail = () => {
    const email = inviteEmailInput.trim().toLowerCase();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Please enter a valid email address');
      return;
    }

    if (adminInviteEmails.includes(email)) {
      setInviteError('That email has already been added');
      return;
    }

    setAdminInviteEmails(prev => [...prev, email]);
    setInviteEmailInput('');
    setInviteError(null);
  };

  const handleRemoveInviteEmail = (email: string) => {
    setAdminInviteEmails(prev => prev.filter(item => item !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);
    const normalizedFormData = {
      ...formData,
      website_url: normalizeWebsiteUrl(formData.website_url),
    };
    setFormData(normalizedFormData);

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organization: {
              ...normalizedFormData,
              admin_invite_emails: adminInviteEmails,
            },
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.errors?.join(', ') || 'Failed to create organization');
      }

      const org = await response.json();
      toast.success('Organization created successfully!');
      if (adminInviteEmails.length > 0) {
        toast.success(inviteDeliveryHint, { duration: 5000 });
      }
      
      // Navigate to the super admin dashboard to see the new org
      setTimeout(() => {
        navigate('/super-admin');
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b border-stone-800 bg-gradient-to-r from-stone-900 via-slate-900 to-stone-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <Link
            to="/super-admin"
            className="mb-4 inline-flex items-center gap-2 text-sm text-stone-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Create Organization</h1>
              <p className="text-sm text-stone-300">Set up a new golf organization</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
            <h2 className="mb-6 text-lg font-semibold text-stone-900">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Make-A-Wish Guam"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.name ? 'border-red-500' : 'border-stone-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 px-4 py-3 text-stone-500">
                    pacific-golf.com/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="make-a-wish-guam"
                    className={`flex-1 rounded-r-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.slug ? 'border-red-500' : 'border-stone-300'
                    }`}
                  />
                </div>
                {errors.slug ? (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                ) : (
                  <p className="mt-1 text-sm text-stone-500">
                    This will be the URL for your organization's tournaments
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description of your organization..."
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
            <h2 className="mb-6 text-lg font-semibold text-stone-900">
              <Palette className="w-5 h-5 inline mr-2" />
              Branding
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Brand Color
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  {colorPresets.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, primary_color: color.value }))}
                      className={`h-10 w-10 rounded-xl border-2 transition-all ${
                        formData.primary_color === color.value
                          ? 'scale-110 border-stone-900'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="h-10 w-10 cursor-pointer rounded-xl"
                    />
                    <span className="text-sm text-stone-500">{formData.primary_color}</span>
                  </div>
                </div>
              </div>

              <ImageUpload
                label="Logo"
                value={formData.logo_url}
                onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                getToken={getToken}
                placeholder="Upload logo (PNG or SVG recommended)"
                helpText="Square image works best. Max 5MB."
                recommendedSize="512x512px (minimum 256x256px)"
                usageNote="Admin header, organization cards, and public page branding"
              />

              <ImageUpload
                label="Banner Image"
                value={formData.banner_url}
                onChange={(url) => setFormData(prev => ({ ...prev, banner_url: url }))}
                getToken={getToken}
                placeholder="Upload banner image"
                helpText="Wide image (hero/background) works best. Max 5MB."
                recommendedSize="1600x600px (minimum 1200x400px)"
                usageNote="Public organization and tournament hero sections"
                previewClassName="h-24 w-full object-cover"
              />

              {/* Preview */}
              {(formData.name || formData.logo_url) && (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="mb-3 text-sm font-medium text-stone-500">Preview</p>
                  <div className="flex items-center gap-4">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="h-12 w-12 rounded-xl bg-white object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        {formData.name ? formData.name.charAt(0) : '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-stone-900">
                        {formData.name || 'Organization Name'}
                      </h3>
                      <p className="text-sm text-stone-500">
                        /{formData.slug || 'slug'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage preview */}
              <div className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="mb-3 text-sm font-medium text-stone-600">Public Hero Preview</p>
                <div
                  className="relative overflow-hidden rounded-xl border border-stone-200"
                  style={{
                    backgroundColor: formData.primary_color,
                    minHeight: '120px',
                  }}
                >
                  {formData.banner_url && (
                    <img
                      src={formData.banner_url}
                      alt="Banner preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="relative z-10 flex items-center gap-3 px-4 py-4 text-white">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="h-10 w-10 rounded-md border border-white/25 bg-white/90 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20 font-semibold">
                        {(formData.name || '?').charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{formData.name || 'Organization Name'}</p>
                      <p className="text-xs text-white/85">/{formData.slug || 'organization-slug'}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  This is a representative preview of how your branding appears on public-facing hero sections.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
            <h2 className="mb-6 text-lg font-semibold text-stone-900">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="events@example.org"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.contact_email ? 'border-red-500' : 'border-stone-300'
                  }`}
                />
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="671-555-0123"
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website
                </label>
                <input
                  type="text"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  onBlur={() =>
                    setFormData(prev => ({ ...prev, website_url: normalizeWebsiteUrl(prev.website_url) }))
                  }
                  placeholder="example.org"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.website_url ? 'border-red-500' : 'border-stone-300'
                  }`}
                />
                {!errors.website_url && (
                  <p className="mt-1 text-sm text-stone-500">We'll automatically add https:// if omitted</p>
                )}
                {errors.website_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>
                )}
              </div>
            </div>
          </div>

          {/* Optional Admin Invites */}
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
            <h2 className="mb-2 text-lg font-semibold text-stone-900">Initial Organization Admins (Optional)</h2>
            <p className="mb-4 text-sm text-stone-500">
              Invite admins now so they receive an email with instructions to create their account and sign in.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={inviteEmailInput}
                onChange={(e) => {
                  setInviteEmailInput(e.target.value);
                  if (inviteError) setInviteError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInviteEmail();
                  }
                }}
                placeholder="admin@example.org"
                className={`flex-1 rounded-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  inviteError ? 'border-red-500' : 'border-stone-300'
                }`}
              />
              <button
                type="button"
                onClick={handleAddInviteEmail}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <UserPlus className="h-4 w-4" />
                Add Admin
              </button>
            </div>
            {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}

            {adminInviteEmails.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {adminInviteEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveInviteEmail(email)}
                      className="rounded-full p-0.5 text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-stone-500">
              New admins receive an invite email with sign-up instructions. If not received, check spam/promotions.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link
              to="/super-admin"
              className="px-6 py-3 text-stone-700 transition-colors hover:text-stone-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-brand transition-colors hover:bg-emerald-700 disabled:bg-stone-300"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Organization
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateOrganizationPage;
