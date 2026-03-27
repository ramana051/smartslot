import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useAuth } from '../context/AuthContext';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const phoneRegex = /^[0-9+\-()\s]{8,}$/;

type VerificationStatus = 'pending' | 'verified' | 'rejected' | null | undefined;

export function Profile() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const initialForm = useMemo(
    () => ({
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      businessName: user?.businessName ?? '',
      businessAddress: user?.businessAddress ?? '',
      businessType: user?.businessType ?? '',
    }),
    [user]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(user?.verificationStatus);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/profile');
        if (!mounted) return;

        setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          businessName: data.businessName ?? '',
          businessAddress: data.businessAddress ?? '',
          businessType: data.businessType ?? '',
        });
        const status =
          data.verificationStatus ?? (data.isVerified ? 'verified' : 'pending');
        setVerificationStatus(status);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const statusChip = (() => {
    if (!isOwner) return null;
    if (verificationStatus === 'verified') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold w-fit">
          Verified
        </span>
      );
    }
    if (verificationStatus === 'rejected') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold w-fit">
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold w-fit">
        Pending Approval
      </span>
    );
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // Client-side validation for better UX (backend will also validate).
    if (!form.name || String(form.name).trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!form.email || !emailRegex.test(form.email)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (form.phone && !phoneRegex.test(form.phone)) {
      toast.error('Enter a valid phone number');
      return;
    }

    if (newPassword || confirmPassword) {
      if (!newPassword) {
        toast.error('New password is required');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Confirm password does not match');
        return;
      }
      if (!passRegex.test(newPassword)) {
        toast.error('Password must meet the required complexity rules');
        return;
      }
    }

    try {
      setSaving(true);
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone ? form.phone.trim() : null,
      };

      if (isOwner) {
        payload.businessName = form.businessName.trim();
        payload.businessAddress = form.businessAddress.trim();
        payload.businessType = form.businessType.trim();
      }

      if (newPassword) payload.password = newPassword;

      const { data } = await api.put('/profile/update', payload);
      toast.success('Profile updated successfully');

      setVerificationStatus(
        data.verificationStatus ?? (data.isVerified ? 'verified' : 'pending')
      );
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Profile</h1>
              <p className="text-slate-500 mt-1">
                Manage your account details.
              </p>
            </div>
            {statusChip}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Optional, update if needed"
                />
              </div>
            </div>

            {isOwner && (
              <div className="space-y-4 rounded-2xl border border-slate-100 p-4 bg-slate-50/60">
                <h2 className="text-lg font-bold text-slate-900">Business Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Business Name</label>
                    <input
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Business Type</label>
                    <input
                      value={form.businessType}
                      onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="turf, salon, etc."
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Business Address
                    </label>
                    <input
                      value={form.businessAddress}
                      onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 rounded-2xl border border-slate-100 p-4">
              <h2 className="text-lg font-bold text-slate-900">Password Update</h2>
              <p className="text-sm text-slate-500">
                Leave these fields empty to keep your current password.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Min 8 chars + uppercase/lowercase/number/special"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setNewPassword('');
                  setConfirmPassword('');
                  setForm(initialForm);
                  setVerificationStatus(user?.verificationStatus);
                }}
                className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-black transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

