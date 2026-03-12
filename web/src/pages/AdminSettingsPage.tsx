import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { Card, Button, Input } from '../components/ui';
import {
  Save,
  Settings as SettingsIcon,
  RefreshCw,
  UserPlus,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Building2,
  Palette,
  Mail,
  Phone,
  Globe,
  FileText,
  Crown,
  Shield,
} from 'lucide-react';
import { api, Settings, Admin } from '../services/api';
import { useTournament } from '../contexts';
import toast from 'react-hot-toast';
import { useAdminBasePath } from '../hooks/useAdminBasePath';
import { useOrganization } from '../components/OrganizationProvider';
import { useAuthToken } from '../hooks/useAuthToken';
import { ImageUpload } from '../components/ImageUpload';
import { isValidWebsiteUrl, normalizeWebsiteUrl } from '../utils/url';

interface OrgMember {
  id: string;
  user_id: number;
  name: string;
  email: string;
  role: string;
  signed_in: boolean;
  created_at: string;
}

interface OrgFormData {
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

type SettingsTab = 'organization' | 'tournament' | 'payments' | 'access';

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

export const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTournament, refreshTournaments } = useTournament();
  const { isOrgScopedAdmin, adminPath } = useAdminBasePath();
  const { organization } = useOrganization();
  const { getToken } = useAuthToken();

  const tabs = useMemo(
    () =>
      [
        isOrgScopedAdmin
          ? ({ id: 'organization', label: 'Organization Profile' } as const)
          : null,
        { id: 'tournament', label: 'Tournament Operations' } as const,
        { id: 'payments', label: 'Payments & Notifications' } as const,
        { id: 'access', label: isOrgScopedAdmin ? 'Organization Access' : 'Admin Access' } as const,
      ].filter(Boolean) as Array<{ id: SettingsTab; label: string }>,
    [isOrgScopedAdmin]
  );
  const [activeTab, setActiveTab] = useState<SettingsTab>(isOrgScopedAdmin ? 'organization' : 'tournament');
  
  const [settings, setSettings] = useState<Partial<Settings>>({
    stripe_public_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    payment_mode: 'test',
    admin_email: '',
  });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<number | null>(null);
  const [resendingAdminId, setResendingAdminId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [orgFormData, setOrgFormData] = useState<OrgFormData | null>(null);
  const [orgErrors, setOrgErrors] = useState<Partial<Record<keyof OrgFormData, string>>>({});
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [newOrgMemberEmail, setNewOrgMemberEmail] = useState('');
  const [addingOrgMember, setAddingOrgMember] = useState(false);
  const [resendingOrgMemberId, setResendingOrgMemberId] = useState<string | null>(null);
  const inviteDeliveryHint = 'Invite sent. If they do not see it, ask them to check spam/promotions.';

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id ?? 'tournament');
    }
  }, [activeTab, tabs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, meData] = await Promise.all([api.getSettings(), api.getCurrentAdmin()]);
      const adminsData = !isOrgScopedAdmin ? await api.getAdmins() : [];
      setSettings({
        stripe_public_key: settingsData.stripe_public_key || '',
        stripe_secret_key: settingsData.stripe_secret_key || '',
        stripe_webhook_secret: settingsData.stripe_webhook_secret || '',
        payment_mode: settingsData.payment_mode || 'test',
        admin_email: settingsData.admin_email || '',
      });
      setAdmins(adminsData || []);
      setCurrentAdmin(meData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrgScopedAdmin]);

  useEffect(() => {
    if (!organization) return;
    setOrgFormData({
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
  }, [organization]);

  const fetchOrgMembers = async () => {
    if (!isOrgScopedAdmin || !organization?.slug) return;
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setOrgMembers(data.members || []);
    } catch (err) {
      console.error('Error fetching org members:', err);
    }
  };

  useEffect(() => {
    fetchOrgMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrgScopedAdmin, organization?.slug]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setIsAddingAdmin(true);
    try {
      await api.createAdmin({ email: newAdminEmail.trim() });
      toast.success(`Admin invite sent to ${newAdminEmail}`);
      setNewAdminEmail('');
      const adminsData = await api.getAdmins();
      setAdmins(adminsData);
    } catch (err) {
      console.error('Error adding admin:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: number) => {
    setDeletingAdminId(adminId);
    try {
      await api.deleteAdmin(adminId);
      toast.success('Admin removed');
      setAdmins(admins.filter(a => a.id !== adminId));
    } catch (err) {
      console.error('Error removing admin:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove admin');
    } finally {
      setDeletingAdminId(null);
    }
  };

  const handleResendAdminInvite = async (adminId: number) => {
    setResendingAdminId(adminId);
    try {
      await api.resendAdminInvite(adminId);
      toast.success('Invite resent. Ask them to check spam/promotions if needed.', { duration: 5000 });
    } catch (err) {
      console.error('Error resending admin invite:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to resend admin invite');
    } finally {
      setResendingAdminId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOrgInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setOrgFormData((prev) => {
      if (!prev) return prev;
      if (name === 'slug') {
        return { ...prev, [name]: value.toLowerCase().replace(/[^a-z0-9-]/g, '') };
      }
      return { ...prev, [name]: value };
    });
    if (orgErrors[name as keyof OrgFormData]) {
      setOrgErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOrgInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    if (name !== 'website_url') return;
    setOrgFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, website_url: normalizeWebsiteUrl(prev.website_url) };
    });
  };

  const validateOrgForm = (): boolean => {
    if (!orgFormData) return false;
    const newErrors: Partial<Record<keyof OrgFormData, string>> = {};
    if (!orgFormData.name.trim()) newErrors.name = 'Organization name is required';
    if (!orgFormData.slug.trim()) newErrors.slug = 'URL slug is required';
    if (orgFormData.slug && !/^[a-z0-9-]+$/.test(orgFormData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    if (orgFormData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgFormData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }
    if (orgFormData.website_url && !isValidWebsiteUrl(orgFormData.website_url)) {
      newErrors.website_url = 'Please enter a valid website URL';
    }
    setOrgErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveOrgProfile = async () => {
    if (!isOrgScopedAdmin || !organization || !orgFormData) return;
    if (!validateOrgForm()) {
      toast.error('Please fix the organization profile errors.');
      return;
    }

    setIsSavingOrg(true);
    const normalizedOrgFormData = {
      ...orgFormData,
      website_url: normalizeWebsiteUrl(orgFormData.website_url),
    };
    setOrgFormData(normalizedOrgFormData);
    try {
      await api.updateOrganization(organization.id, normalizedOrgFormData);
      toast.success('Organization profile saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save organization profile');
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleAddOrgMember = async () => {
    if (!newOrgMemberEmail.trim() || !organization?.slug) return;
    setAddingOrgMember(true);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newOrgMemberEmail.trim(), role: 'admin' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add organization admin');
      }
      setOrgMembers((prev) => [...prev, data.member]);
      setNewOrgMemberEmail('');
      toast.success('Organization admin added.');
      toast.success(inviteDeliveryHint, { duration: 5000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add organization admin');
    } finally {
      setAddingOrgMember(false);
    }
  };

  const handleRemoveOrgMember = async (memberId: string) => {
    if (!organization?.slug) return;
    if (!confirm('Are you sure you want to remove this organization admin?')) return;
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = response.ok ? null : await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to remove organization admin');
      }
      setOrgMembers((prev) => prev.filter((member) => member.id !== memberId));
      toast.success('Organization admin removed.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove organization admin');
    }
  };

  const handleResendOrgInvite = async (memberId: string) => {
    if (!organization?.slug) return;
    setResendingOrgMemberId(memberId);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/members/${memberId}/resend_invite`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invite');
      }
      if (data.member) {
        setOrgMembers((prev) => prev.map((member) => (member.id === memberId ? data.member : member)));
      }
      toast.success('Invite resent. Ask them to check spam/promotions if needed.', { duration: 5000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invite');
    } finally {
      setResendingOrgMemberId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setError(null);

    try {
      await api.updateSettings(settings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (!currentTournament) return;
    
    try {
      if (currentTournament.registration_open) {
        await api.updateTournament(currentTournament.id, { registration_open: false });
        toast.success('Registration closed');
      } else {
        await api.updateTournament(currentTournament.id, { registration_open: true });
        toast.success('Registration opened');
      }
      refreshTournaments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update registration status');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="animate-spin" size={24} />
            <span>Loading settings...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center gap-2 lg:gap-3">
          <SettingsIcon className="text-brand-800" size={28} />
          <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">
              Manage organization profile, tournament operations, payments, and access.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'organization' && isOrgScopedAdmin && orgFormData && (
          <div className="space-y-4 lg:space-y-6">
            <Card className="p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-700" /> Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Organization Name</label>
                  <input
                    type="text"
                    name="name"
                    value={orgFormData.name}
                    onChange={handleOrgInputChange}
                    className={`w-full rounded-lg border px-3 py-2 ${orgErrors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-brand-700`}
                  />
                  {orgErrors.name && <p className="mt-1 text-sm text-red-600">{orgErrors.name}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">URL Slug</label>
                  <div className="flex items-center">
                    <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500">
                      pacificgolf.com/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={orgFormData.slug}
                      onChange={handleOrgInputChange}
                      className={`w-full rounded-r-lg border px-3 py-2 ${orgErrors.slug ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-brand-700`}
                    />
                  </div>
                  {orgErrors.slug && <p className="mt-1 text-sm text-red-600">{orgErrors.slug}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    <FileText className="mr-1 inline h-4 w-4" /> Description
                  </label>
                  <textarea
                    name="description"
                    value={orgFormData.description}
                    onChange={handleOrgInputChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-700" /> Branding
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Brand Color</label>
                  <div className="flex flex-wrap items-center gap-3">
                    {colorPresets.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setOrgFormData((prev) => (prev ? { ...prev, primary_color: color.value } : prev))}
                        className={`h-9 w-9 rounded-lg border-2 ${
                          orgFormData.primary_color === color.value ? 'border-gray-900' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={orgFormData.primary_color}
                      onChange={(e) =>
                        setOrgFormData((prev) => (prev ? { ...prev, primary_color: e.target.value } : prev))
                      }
                      className="h-9 w-10 cursor-pointer rounded-lg"
                    />
                    <span className="text-sm text-gray-500">{orgFormData.primary_color}</span>
                  </div>
                </div>
                <ImageUpload
                  label="Logo"
                  value={orgFormData.logo_url}
                  onChange={(url) => setOrgFormData((prev) => (prev ? { ...prev, logo_url: url } : prev))}
                  getToken={getToken}
                  placeholder="Upload logo (PNG or SVG recommended)"
                  helpText="Square image works best. Max 5MB."
                />
                <ImageUpload
                  label="Banner Image"
                  value={orgFormData.banner_url}
                  onChange={(url) => setOrgFormData((prev) => (prev ? { ...prev, banner_url: url } : prev))}
                  getToken={getToken}
                  placeholder="Upload banner image"
                  helpText="Wide image (e.g. 1200x400) works best. Max 5MB."
                />
              </div>
            </Card>

            <Card className="p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    <Mail className="mr-1 inline h-4 w-4" /> Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={orgFormData.contact_email}
                    onChange={handleOrgInputChange}
                    className={`w-full rounded-lg border px-3 py-2 ${orgErrors.contact_email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-brand-700`}
                  />
                  {orgErrors.contact_email && <p className="mt-1 text-sm text-red-600">{orgErrors.contact_email}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    <Phone className="mr-1 inline h-4 w-4" /> Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={orgFormData.contact_phone}
                    onChange={handleOrgInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    <Globe className="mr-1 inline h-4 w-4" /> Website
                  </label>
                  <input
                    type="text"
                    name="website_url"
                    value={orgFormData.website_url}
                    onChange={handleOrgInputChange}
                    onBlur={handleOrgInputBlur}
                    placeholder="example.org"
                    className={`w-full rounded-lg border px-3 py-2 ${orgErrors.website_url ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-brand-700`}
                  />
                  {!orgErrors.website_url && (
                    <p className="mt-1 text-xs text-gray-500">We'll automatically add https:// if omitted</p>
                  )}
                  {orgErrors.website_url && <p className="mt-1 text-sm text-red-600">{orgErrors.website_url}</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveOrgProfile} disabled={isSavingOrg}>
                  {isSavingOrg ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Organization Profile
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'tournament' && currentTournament && (
          <Card className={`p-4 lg:p-6 border-2 ${currentTournament.registration_open ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                  Current Tournament
                </h2>
                <p className="text-sm text-gray-600">
                  {currentTournament.display_name}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                  <span className="text-gray-600">
                    {currentTournament.confirmed_count}/{currentTournament.max_capacity} registered
                    {currentTournament.reserved_slots > 0 && (
                      <span className="text-amber-600 ml-1">({currentTournament.reserved_slots} reserved)</span>
                    )}
                  </span>
                  <span className="text-gray-600">
                    ${currentTournament.entry_fee_dollars} fee
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleToggleRegistration}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    currentTournament.registration_open 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {currentTournament.registration_open ? 'Close Registration' : 'Open Registration'}
                </button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate(adminPath('tournaments'))}
                >
                  <Calendar size={16} className="mr-2" />
                  Manage Tournament
                </Button>
              </div>
            </div>
            
            <div className={`mt-4 p-3 rounded-lg ${currentTournament.registration_open ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium flex items-center gap-2 ${currentTournament.registration_open ? 'text-green-800' : 'text-red-800'}`}>
                {currentTournament.registration_open 
                  ? <><Check className="w-4 h-4" /> Registration is OPEN</> 
                  : <><X className="w-4 h-4" /> Registration is CLOSED</>}
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'payments' && (
        <form onSubmit={handleSave} className="space-y-4 lg:space-y-6">
          {/* Payment Mode Toggle */}
          <Card className="p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 lg:mb-4">
              Payment Mode
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mb-4">
              Control how payments are processed for new registrations.
            </p>

            <div className="space-y-3">
              <label 
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  settings.payment_mode === 'test' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_mode"
                  value="test"
                  checked={settings.payment_mode === 'test'}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 text-amber-600"
                />
                <div>
                  <p className="font-semibold text-gray-900">Test Mode (Simulated)</p>
                  <p className="text-xs lg:text-sm text-gray-600">
                    Payments are simulated - no real charges. Perfect for testing and demos.
                    No Stripe configuration required.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  settings.payment_mode === 'production' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_mode"
                  value="production"
                  checked={settings.payment_mode === 'production'}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 text-green-600"
                />
                <div>
                  <p className="font-semibold text-gray-900">Production (Real Payments)</p>
                  <p className="text-xs lg:text-sm text-gray-600">
                    Real Stripe checkout - actual payments will be processed.
                    Requires Stripe API keys below.
                  </p>
                </div>
              </label>
            </div>

            {settings.payment_mode === 'test' && (
              <div className="mt-4 bg-amber-100 border border-amber-300 rounded-lg p-3 lg:p-4">
                <p className="text-xs lg:text-sm text-amber-900 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Test Mode Active - No real payments will be processed
                </p>
              </div>
            )}

            {settings.payment_mode === 'production' && !settings.stripe_secret_key && (
              <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-3 lg:p-4">
                <p className="text-xs lg:text-sm text-red-900 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Production mode requires Stripe API keys. Configure them below.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 lg:mb-4">
              Stripe Configuration
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
              Configure your Stripe API keys for payment processing.
            </p>

            <div className="space-y-3 lg:space-y-4">
              <Input
                label="Stripe Publishable Key"
                name="stripe_public_key"
                value={settings.stripe_public_key || ''}
                onChange={handleChange}
                placeholder="pk_test_..."
                type="password"
              />

              <Input
                label="Stripe Secret Key"
                name="stripe_secret_key"
                value={settings.stripe_secret_key || ''}
                onChange={handleChange}
                placeholder="sk_test_..."
                type="password"
              />

              <Input
                label="Stripe Webhook Secret (Optional)"
                name="stripe_webhook_secret"
                value={settings.stripe_webhook_secret || ''}
                onChange={handleChange}
                placeholder="whsec_..."
                type="password"
              />

              <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 lg:p-4">
                <p className="text-xs lg:text-sm text-brand-800">
                  <strong>Note:</strong> Find your Stripe API keys in your{' '}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-brand-700"
                  >
                    Stripe Dashboard
                  </a>
                  . Use test keys for development. The webhook secret is found in{' '}
                  <a
                    href="https://dashboard.stripe.com/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-brand-700"
                  >
                    Webhooks settings
                  </a>
                  .
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 lg:mb-4">
              Admin Notifications
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
              Set the email address(es) for admin notifications when new golfers register.
              Multiple emails can be separated by commas.
            </p>

            <Input
              label="Admin Notification Email(s)"
              name="admin_email"
              type="text"
              value={settings.admin_email || ''}
              onChange={handleChange}
              placeholder="admin@example.com, admin2@example.com"
            />
          </Card>

          {saveMessage && (
            <div
              className={`p-3 lg:p-4 rounded-lg text-sm ${
                saveMessage.includes('Error')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}
            >
              {saveMessage}
            </div>
          )}

          <div className="flex justify-end pb-4">
            <Button type="submit" size="lg" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
        )}

        {activeTab === 'access' && isOrgScopedAdmin && (
          <Card className="p-4 lg:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="text-brand-800" size={22} />
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">Organization Admin Access</h2>
            </div>
            <p className="mb-4 text-xs lg:text-sm text-gray-600">
              Manage who can administer this organization.
            </p>
            <div className="mb-4 flex gap-2">
              <input
                type="email"
                value={newOrgMemberEmail}
                onChange={(e) => setNewOrgMemberEmail(e.target.value)}
                placeholder="Enter email to add org admin..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
              />
              <Button type="button" onClick={handleAddOrgMember} disabled={addingOrgMember || !newOrgMemberEmail.trim()}>
                {addingOrgMember ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
              </Button>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Invited admins receive an email with sign-up instructions. If they do not receive it, check spam/promotions.
            </p>
            <div className="space-y-2">
              {orgMembers.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">No organization admins configured</p>
              ) : (
                orgMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-stone-100 p-2">
                        {member.role === 'admin' ? (
                          <Crown className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          member.signed_in ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {member.signed_in ? 'Signed in' : 'Pending'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResendOrgInvite(member.id)}
                        disabled={resendingOrgMemberId === member.id || member.signed_in}
                        className="rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={member.signed_in ? 'User already signed in' : 'Resend invitation email'}
                      >
                        {resendingOrgMemberId === member.id ? 'Sending...' : 'Resend Invite'}
                      </button>
                      {!(member.role === 'admin' && orgMembers.filter((m) => m.role === 'admin').length <= 1) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOrgMember(member.id)}
                          className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {activeTab === 'access' && !isOrgScopedAdmin && (
        <>
        {/* Admin Management Section */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-2 lg:mb-4">
            <Users className="text-brand-800" size={22} />
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">
              Admin Management
            </h2>
          </div>
          <p className="text-xs lg:text-sm text-gray-600 mb-4">
            Manage who has admin access. Add admins by email - they'll be linked when they first log in via Clerk.
          </p>

          {/* Add New Admin Form */}
          <form onSubmit={handleAddAdmin} className="flex gap-2 mb-4">
            <div className="flex-1">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Enter email to add admin..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-800 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={isAddingAdmin || !newAdminEmail.trim()}
              className="flex-shrink-0"
            >
              {isAddingAdmin ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={16} />
                  <span className="hidden sm:inline ml-1">Add</span>
                </>
              )}
            </Button>
          </form>

          {/* Admins List */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Current Admins ({admins.length})
            </p>
            {admins.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No admins configured</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between py-3 gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        admin.clerk_id ? 'bg-green-100' : 'bg-amber-100'
                      }`}>
                        {admin.clerk_id ? (
                          <CheckCircle className="text-green-600" size={16} />
                        ) : (
                          <Clock className="text-amber-600" size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {admin.email}
                          {currentAdmin?.id === admin.id && (
                            <span className="ml-2 text-xs text-brand-600">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {admin.clerk_id ? (
                            <span className="text-green-600">Active</span>
                          ) : (
                            <span className="text-amber-600">Pending (hasn't logged in yet)</span>
                          )}
                          {admin.name && ` · ${admin.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          admin.clerk_id ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {admin.clerk_id ? 'Signed in' : 'Pending'}
                      </span>
                      <button
                        onClick={() => handleResendAdminInvite(admin.id)}
                        disabled={Boolean(admin.clerk_id) || resendingAdminId === admin.id}
                        className="rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={admin.clerk_id ? 'User already signed in' : 'Resend invitation email'}
                      >
                        {resendingAdminId === admin.id ? 'Sending...' : 'Resend Invite'}
                      </button>
                      {currentAdmin?.id !== admin.id && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        disabled={deletingAdminId === admin.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remove admin"
                      >
                        {deletingAdminId === admin.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 lg:p-4 mt-4">
            <p className="text-xs lg:text-sm text-brand-800">
              <strong>How it works:</strong> Add an email address, and when that person signs up/logs in through Clerk with that email, they'll automatically get admin access.
            </p>
          </div>
        </Card>
        </>
        )}
      </div>
    </AdminLayout>
  );
};
