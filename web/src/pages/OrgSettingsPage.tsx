import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrganization } from '../components/OrganizationProvider';
import { useAuthToken } from '../hooks/useAuthToken';
import { OrgAdminLayout } from '../components/OrgAdminLayout';
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
  Settings,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Crown,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface OrgMember {
  id: string;
  user_id: number;
  name: string;
  email: string;
  role: string;
  signed_in: boolean;
  created_at: string;
}

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

export const OrgSettingsPage: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { organization } = useOrganization();
  const { getToken } = useAuthToken();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [resendingMemberId, setResendingMemberId] = useState<string | null>(null);
  const inviteDeliveryHint = 'Invite sent. If they do not see it, ask them to check spam/promotions.';

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        slug: organization.slug || '',
        description: organization.description || '',
        primary_color: organization.primary_color || '#16a34a',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website_url: organization.website_url || '',
        logo_url: organization.logo_url || '',
        banner_url: organization.banner_url || '',
      });
    }
  }, [organization]);

  // Fetch members
  const fetchMembers = async () => {
    if (!organization?.slug) return;
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  useEffect(() => {
    if (organization?.slug) {
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.slug]);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !organization?.slug) return;
    setAddingMember(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newMemberEmail.trim(), role: 'admin' }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMembers(prev => [...prev, data.member]);
        setNewMemberEmail('');
        toast.success('Admin added successfully');
        toast.success(inviteDeliveryHint, { duration: 5000 });
      } else {
        toast.error(data.error || 'Failed to add admin');
      }
    } catch (err) {
      toast.error('Failed to add admin');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization?.slug) return;
    if (!confirm('Are you sure you want to remove this admin?')) return;
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members/${memberId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        toast.success('Admin removed');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove admin');
      }
    } catch (err) {
      toast.error('Failed to remove admin');
    }
  };

  const handleResendInvite = async (memberId: string) => {
    if (!organization?.slug) return;
    setResendingMemberId(memberId);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members/${memberId}/resend_invite`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend invite');
      }
      if (data.member) {
        setMembers(prev => prev.map((member) => (member.id === memberId ? data.member : member)));
      }
      toast.success('Invite resent. Ask them to check spam/promotions if needed.', { duration: 5000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invite');
    } finally {
      setResendingMemberId(null);
    }
  };

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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    if (name !== 'website_url') return;
    setFormData(prev => (prev ? { ...prev, website_url: normalizeWebsiteUrl(prev.website_url) } : prev));
  };

  const validate = (): boolean => {
    if (!formData) return false;
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Organization name is required';
    if (!formData.slug.trim()) newErrors.slug = 'URL slug is required';
    else if (!/^[a-z0-9-]+$/.test(formData.slug))
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email))
      newErrors.contact_email = 'Invalid email format';
    if (formData.website_url && !isValidWebsiteUrl(formData.website_url))
      newErrors.website_url = 'Please enter a valid website URL';

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
    const normalizedFormData = {
      ...formData,
      website_url: normalizeWebsiteUrl(formData.website_url),
    };
    setFormData(normalizedFormData);
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
          body: JSON.stringify({ organization: normalizedFormData }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.errors?.join(', ') || 'Failed to update organization');
      }

      toast.success('Organization settings saved!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!organization || !formData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <OrgAdminLayout
      orgName={organization.name}
      orgSlug={organization.slug}
      primaryColor={organization.primary_color}
      title="Organization Settings"
      subtitle="Branding, contact information, and admin access"
      rightActions={
        <Link
          to={`/${orgSlug}/admin`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      }
    >
      <Toaster position="top-right" />
      <main className="max-w-5xl">
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
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
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
                onChange={(url) => setFormData(prev => prev ? { ...prev, logo_url: url } : null)}
                getToken={getToken}
                placeholder="Upload logo (PNG or SVG recommended)"
                helpText="Square image works best. Max 5MB."
              />

              <ImageUpload
                label="Banner Image"
                value={formData.banner_url}
                onChange={(url) => setFormData(prev => prev ? { ...prev, banner_url: url } : null)}
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
                  <Mail className="w-4 h-4 inline mr-1" /> Contact Email
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
                {errors.contact_email && <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" /> Contact Phone
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
                  <Globe className="w-4 h-4 inline mr-1" /> Website
                </label>
                <input
                  type="text"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="example.org"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.website_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {!errors.website_url && (
                  <p className="mt-1 text-sm text-gray-500">We'll automatically add https:// if omitted</p>
                )}
                {errors.website_url && <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link
              to={`/${orgSlug}/admin`}
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
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>

        {/* Admin Management Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Organization Admins</h2>
              <p className="text-sm text-gray-500">Manage who can administer this organization</p>
            </div>
          </div>

          {/* Add admin */}
          <div className="flex gap-3 mb-6">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter email address..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            />
            <button
              onClick={handleAddMember}
              disabled={addingMember || !newMemberEmail.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
            >
              {addingMember ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add Admin
            </button>
          </div>
          <p className="mb-6 text-xs text-gray-500">
            Invited admins receive an email with sign-up instructions. If they do not receive it, check spam/promotions.
          </p>

          {/* Member list */}
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No admins configured yet.</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      {member.role === 'admin' ? (
                        <Crown className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Shield className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      member.signed_in
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {member.signed_in ? 'Signed in' : 'Pending'}
                    </span>
                    <button
                      onClick={() => handleResendInvite(member.id)}
                      disabled={resendingMemberId === member.id || member.signed_in}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      title={member.signed_in ? 'User already signed in' : 'Resend invitation email'}
                    >
                      {resendingMemberId === member.id ? 'Sending...' : 'Resend Invite'}
                    </button>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      member.role === 'admin'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {member.role}
                    </span>
                    {!(member.role === 'admin' && members.filter(m => m.role === 'admin').length <= 1) && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </OrgAdminLayout>
  );
};

export default OrgSettingsPage;
