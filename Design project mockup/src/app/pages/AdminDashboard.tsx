import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users as UsersIcon, Briefcase, Calendar, CheckCircle, Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../api/axios';
import { toast } from 'sonner';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    'users' | 'businesses' | 'stats' | 'bookings' | 'owner_verification'
  >('stats');
  const [users, setUsers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [pendingOwners, setPendingOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [usersRes, businessRes, statsRes, bookingsRes, pendingOwnersRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/businesses'),
        api.get('/admin/stats'),
        api.get('/admin/bookings'),
        api.get('/admin/pending-owners'),
      ]);
      setUsers(usersRes.data);
      setBusinesses(businessRes.data);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setPendingOwners(pendingOwnersRes.data);
    } catch (error) {
      console.error('Error fetching admin data', error);
      toast.error('Failed to load admin panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const toggleApproval = async (id: string) => {
    try {
      const res = await api.put(`/admin/businesses/${id}/approve`);
      toast.success(res.data.message);
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to update approval status');
    }
  };

  const approveOwner = async (id: string) => {
    try {
      const res = await api.put(`/admin/approve-owner/${id}`);
      toast.success(res.data.message);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve owner');
    }
  };

  const rejectOwner = async (id: string) => {
    try {
      const res = await api.put(`/admin/reject-owner/${id}`);
      toast.success(res.data.message);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject owner');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Secure Admin Panel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8 border-b border-red-100 pb-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
            <p className="text-slate-600 font-mono text-sm">System Overview & Management</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab('stats')} className={`px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'stats' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>System Stats</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'users' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Users</button>
        <button onClick={() => setActiveTab('businesses')} className={`px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'businesses' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Businesses & Approvals</button>
        <button onClick={() => setActiveTab('bookings')} className={`px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'bookings' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Bookings</button>
        <button onClick={() => setActiveTab('owner_verification')} className={`px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'owner_verification' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Owner Verification</button>
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start mb-4"><div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><UsersIcon className="w-6 h-6 text-blue-600" /></div></div>
             <div className="text-3xl font-bold text-slate-900 mb-1">{stats.usersCount || 0}</div>
             <div className="text-sm text-slate-500">Registered Users (All Roles)</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start mb-4"><div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><Briefcase className="w-6 h-6 text-green-600" /></div></div>
             <div className="text-3xl font-bold text-slate-900 mb-1">{stats.businessesCount || 0}</div>
             <div className="text-sm text-slate-500">Total Businesses Registered</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start mb-4"><div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-purple-600" /></div></div>
             <div className="text-3xl font-bold text-slate-900 mb-1">{stats.bookingsCount || 0}</div>
             <div className="text-sm text-slate-500">Total Bookings Managed</div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr><th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ID / Name</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Email</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Role</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.name}<br/><span className="text-xs font-mono text-slate-400">{u.id}</span></td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${u.role==='admin'?'bg-red-100 text-red-700':u.role==='owner'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-700'}`}>{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'businesses' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr><th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Business Name</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Owner Email</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th><th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-semibold text-slate-900">{b.name}</div><div className="text-xs text-slate-500">{b.category} • {b.location}</div></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{b.owner?.email || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {b.isApproved ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit"><CheckCircle className="w-3 h-3"/> Approved</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full w-fit"><Clock className="w-3 h-3"/> Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button onClick={() => toggleApproval(b.id)} className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${b.isApproved ? 'bg-red-500 hover:bg-red-600': 'bg-green-500 hover:bg-green-600'}`}>
                        {b.isApproved ? 'Revoke Approval' : 'Approve Listing'}
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'owner_verification' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Owner</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Business</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingOwners.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{o.name}</div>
                    <div className="text-sm text-slate-600">{o.email}</div>
                    <div className="text-xs text-slate-500 mt-1">{o.phone || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{o.businessName || '—'}</div>
                    <div className="text-sm text-slate-600">{o.businessType || '—'}</div>
                    <div className="text-xs text-slate-500 mt-1">{o.businessAddress || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full w-fit">
                      <Clock className="w-3 h-3" />{' '}
                      {o.verificationStatus === 'verified'
                        ? 'Verified'
                        : o.verificationStatus === 'rejected'
                          ? 'Rejected'
                          : 'Pending Approval'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => approveOwner(o.id)}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors bg-green-500 hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectOwner(o.id)}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors bg-red-500 hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingOwners.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No pending owner registrations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Service</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Date / Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{bk.serviceName}</div>
                    <div className="text-xs text-slate-500">{bk.turf?.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{bk.user?.email || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    {bk.date} · {bk.time}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold uppercase text-slate-700">{bk.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">₹{bk.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">No bookings yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
