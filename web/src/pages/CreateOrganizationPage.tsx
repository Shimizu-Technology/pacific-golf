import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthToken } from '../hooks/useAuthToken';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ImageUpload } from '../components/ImageUpload';
import {
  ArrowLeft,
  Building2,
  Loader2,
  Save,
  AlertCircle,
  Palette,
  Mail,
  Phone,
  Globe,
  FileText,
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

    if (formData.website_url && !formData.website_url.startsWith('http')) {
      newErrors.website_url = 'Website URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);

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
          body: JSON.stringify({ organization: formData }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.errors?.join(', ') || 'Failed to create organization');
      }

      const org = await response.json();
      toast.success('Organization created successfully!');
      
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/super-admin"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
              <p className="text-gray-500">Set up a new golf organization</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Make-A-Wish Guam"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-500">
                    pacificgolf.io/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="make-a-wish-guam"
                    className={`flex-1 px-4 py-3 border rounded-r-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.slug ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.slug ? (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    This will be the URL for your organization's tournaments
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description of your organization..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              <Palette className="w-5 h-5 inline mr-2" />
              Branding
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Color
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  {colorPresets.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, primary_color: color.value }))}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        formData.primary_color === color.value
                          ? 'border-gray-900 scale-110'
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
                      className="w-10 h-10 rounded-xl cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">{formData.primary_color}</span>
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
              />

              <ImageUpload
                label="Banner Image"
                value={formData.banner_url}
                onChange={(url) => setFormData(prev => ({ ...prev, banner_url: url }))}
                getToken={getToken}
                placeholder="Upload banner image"
                helpText="Wide image (e.g. 1200×400) works best. Max 5MB."
              />

              {/* Preview */}
              {(formData.name || formData.logo_url) && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-500 mb-3">Preview</p>
                  <div className="flex items-center gap-4">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="w-12 h-12 rounded-xl object-contain bg-white"
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
                      <h3 className="font-semibold text-gray-900">
                        {formData.name || 'Organization Name'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        /{formData.slug || 'slug'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="events@example.org"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.contact_email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="671-555-0123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://example.org"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.website_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.website_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link
              to="/super-admin"
              className="px-6 py-3 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-green-600/25"
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
