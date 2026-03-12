import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  ExternalLink,
  Trophy,
  Users,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  RefreshCw,
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

interface OrgMember {
  id: string;
  user_id: number;
  name: string;
  email: string;
  role: string;
  signed_in: boolean;
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
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const inviteDeliveryHint = 'Invite sent. If they do not see it, ask them to check spam/promotions.';

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

  const syncAdminCountFromMembers = (nextMembers: OrgMember[]) => {
    setOrganization((prev) => {
      if (!prev) return prev;
      const adminCount = nextMembers.filter((member) => member.role === 'admin').length;
      return { ...prev, admin_count: adminCount };
    });
  };

  const fetchMembers = async (orgSlug: string) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${orgSlug}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to load organization admins');
      }
      const data = await response.json();
      const nextMembers = (data.members || []) as OrgMember[];
      setMembers(nextMembers);
      syncAdminCountFromMembers(nextMembers);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load organization admins');
    } finally {
      setMembersLoaded(true);
    }
  };

  useEffect(() => {
    if (organization?.slug) {
      fetchMembers(organization.slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.slug]);

  const handleAddMember = async () => {
    if (!organization?.slug) return;
    const email = newMemberEmail.trim().toLowerCase();
    if (!email) return;

    setAddingMember(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, role: 'admin' }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add organization admin');
      }

      const nextMembers = [...members, data.member];
      setMembers(nextMembers);
      syncAdminCountFromMembers(nextMembers);
      setNewMemberEmail('');
      toast.success('Organization admin invited successfully');
      toast.success(inviteDeliveryHint, { duration: 5000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add organization admin');
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    if (!organization?.slug) return;
    setUpdatingMemberId(memberId);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members/${memberId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      const nextMembers = members.map((member) =>
        member.id === memberId ? data.member : member
      );
      setMembers(nextMembers);
      syncAdminCountFromMembers(nextMembers);
      toast.success('Member role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization?.slug) return;
    setRemovingMemberId(memberId);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove member');
      }

      const nextMembers = members.filter((member) => member.id !== memberId);
      setMembers(nextMembers);
      syncAdminCountFromMembers(nextMembers);
      toast.success('Organization admin removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleResendInvite = async (memberId: string) => {
    if (!organization?.slug) return;
    setResendingInviteId(memberId);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members/${memberId}/resend_invite`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invite');
      }

      if (data.member) {
        setMembers((prev) => prev.map((member) => (member.id === memberId ? data.member : member)));
      }
      toast.success('Invite resent. Ask them to check spam/promotions if needed.', { duration: 5000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invite');
    } finally {
      setResendingInviteId(null);
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

    if (formData.website_url && !isValidWebsiteUrl(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid website URL';
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isSuperAdmin || !formData || !organization) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-14 w-14 rounded-xl bg-white/10 object-contain ring-1 ring-white/15"
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
                <h1 className="text-2xl font-display font-bold tracking-tight">{organization.name}</h1>
                <p className="text-sm text-stone-300">/{organization.slug}</p>
              </div>
            </div>
            <Link
              to={`/${organization.slug}/admin`}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-emerald-200 transition-colors hover:bg-emerald-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Org Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Trophy className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{organization.tournament_count}</p>
                <p className="text-sm text-stone-500">Tournaments</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2">
                <Users className="w-5 h-5 text-violet-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {membersLoaded ? members.filter((member) => member.role === 'admin').length : organization.admin_count}
                </p>
                <p className="text-sm text-stone-500">Admins</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                organization.subscription_status === 'active' ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                <Building2 className={`w-5 h-5 ${
                  organization.subscription_status === 'active' ? 'text-green-600' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <p className="text-lg font-bold capitalize text-stone-900">{organization.subscription_status}</p>
                <p className="text-sm text-stone-500">Status</p>
              </div>
            </div>
          </div>
        </div>

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
                    className={`flex-1 rounded-r-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.slug ? 'border-red-500' : 'border-stone-300'
                    }`}
                  />
                </div>
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
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
                      onClick={() => setFormData(prev => prev ? { ...prev, primary_color: color.value } : null)}
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
                      onChange={(e) => setFormData(prev => prev ? { ...prev, primary_color: e.target.value } : null)}
                      className="h-10 w-10 cursor-pointer rounded-xl"
                    />
                    <span className="text-sm text-stone-500">{formData.primary_color}</span>
                  </div>
                </div>
              </div>

              <ImageUpload
                label="Logo"
                value={formData.logo_url}
                onChange={(url) => setFormData(prev => (prev ? { ...prev, logo_url: url } : prev))}
                getToken={getToken}
                placeholder="Upload logo (PNG or SVG recommended)"
                helpText="Square image works best. Max 5MB."
              />

              <ImageUpload
                label="Banner Image"
                value={formData.banner_url}
                onChange={(url) => setFormData(prev => (prev ? { ...prev, banner_url: url } : prev))}
                getToken={getToken}
                placeholder="Upload banner image"
                helpText="Wide image (e.g. 1200×400) works best. Max 5MB."
              />
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
                    setFormData(prev =>
                      prev ? { ...prev, website_url: normalizeWebsiteUrl(prev.website_url) } : prev
                    )
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

          <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Organization Admin Access</h2>
                <p className="mt-1 text-sm text-stone-500">
                  View and manage all admins for this organization directly from super admin.
                </p>
              </div>
              {membersLoaded ? (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                  {members.length} member{members.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="admin@example.org"
                className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={addingMember || !newMemberEmail.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Add Admin
              </button>
            </div>
            <p className="mb-5 text-xs text-stone-500">
              Invited admins receive an email with sign-up instructions. If they do not receive it, check spam/promotions.
            </p>

            {!membersLoaded ? (
              <div className="flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 py-8 text-sm text-stone-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading organization admins...
              </div>
            ) : members.length === 0 ? (
              <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                No organization members found.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const adminCount = members.filter((item) => item.role === 'admin').length;
                  const isLastAdmin = member.role === 'admin' && adminCount <= 1;
                  const isBusy = updatingMemberId === member.id || removingMemberId === member.id || resendingInviteId === member.id;

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col gap-3 rounded-xl border border-stone-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-full bg-stone-100 p-2">
                          {member.role === 'admin' ? (
                            <Crown className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Shield className="h-4 w-4 text-stone-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-stone-900">{member.name}</p>
                          <p className="truncate text-xs text-stone-500">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            member.signed_in ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {member.signed_in ? 'Signed in' : 'Pending invite'}
                        </span>
                        <select
                          value={member.role}
                          disabled={isBusy}
                          onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as 'admin' | 'member')}
                          className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                        >
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleResendInvite(member.id)}
                          disabled={isBusy || member.signed_in}
                          title={member.signed_in ? 'User already signed in' : 'Resend invitation email'}
                          className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {resendingInviteId === member.id ? 'Sending...' : 'Resend Invite'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isBusy || isLastAdmin}
                          title={isLastAdmin ? 'Cannot remove the last admin' : 'Remove member'}
                          className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
