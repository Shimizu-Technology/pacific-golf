import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthToken } from '../hooks/useAuthToken';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ImageUpload } from '../components/ImageUpload';
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
  ExternalLink,
  Trophy,
  Users,
  Trash2,
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

interface Organization extends FormData {
  id: string;
  subscription_status: string;
  tournament_count: number;
  admin_count: number;
  created_at: string;
}

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

export const EditOrganizationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuthToken();
  const { loading: userLoading, isSuperAdmin } = useCurrentUser();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (!userLoading && !isSuperAdmin) {
      navigate('/');
    }
  }, [userLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    async function fetchOrganization() {
      if (!isSuperAdmin || !id) return;

      try {
        const token = await getToken();
        // Fetch all orgs and find the one with matching ID
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }

        const orgs = await response.json();
        const org = orgs.find((o: Organization) => o.id === id);

        if (!org) {
          throw new Error('Organization not found');
        }

        setOrganization(org);
        setFormData({
          name: org.name,
          slug: org.slug,
          description: org.description || '',
          primary_color: org.primary_color || '#16a34a',
          contact_email: org.contact_email || '',
          contact_phone: org.contact_phone || '',
          website_url: org.website_url || '',
          logo_url: org.logo_url || '',
          banner_url: org.banner_url || '',
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load organization');
        navigate('/super-admin');
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, [isSuperAdmin, id, getToken, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'slug') {
      const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData(prev => prev ? { ...prev, [name]: cleanSlug } : null);
    } else {
      setFormData(prev => prev ? { ...prev, [name]: value } : null);
    }

    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    if (!formData) return false;

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

    if (!validate() || !formData || !organization) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organization: formData }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.errors?.join(', ') || 'Failed to update organization');
      }

      const updatedOrg = await response.json();
      setOrganization({ ...organization, ...updatedOrg });
      toast.success('Organization updated successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isSuperAdmin || !formData || !organization) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="w-14 h-14 rounded-xl object-contain bg-gray-100"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: organization.primary_color }}
                >
                  {organization.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-gray-500">/{organization.slug}</p>
              </div>
            </div>
            <Link
              to={`/${organization.slug}/admin`}
              className="flex items-center gap-2 px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Org Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{organization.tournament_count}</p>
                <p className="text-sm text-gray-500">Tournaments</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{organization.admin_count}</p>
                <p className="text-sm text-gray-500">Admins</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                organization.subscription_status === 'active' ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                <Building2 className={`w-5 h-5 ${
                  organization.subscription_status === 'active' ? 'text-green-600' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 capitalize">{organization.subscription_status}</p>
                <p className="text-sm text-gray-500">Status</p>
              </div>
            </div>
          </div>
        </div>

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
                    className={`flex-1 px-4 py-3 border rounded-r-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.slug ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
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
                      onClick={() => setFormData(prev => prev ? { ...prev, primary_color: color.value } : null)}
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
                      onChange={(e) => setFormData(prev => prev ? { ...prev, primary_color: e.target.value } : null)}
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditOrganizationPage;
