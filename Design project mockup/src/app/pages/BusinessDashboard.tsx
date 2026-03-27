import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Calendar as CalendarIcon, DollarSign, Briefcase, PlusCircle,
  TrendingUp, Clock, Save, Trash2, Edit3, Settings, Percent, Activity, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axios';
import { getSocket } from '../../api/socket';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'turfs' | 'discounts'>('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user } = useAuth();

  const canManage = user?.role === 'admin' || (user?.role === 'owner' && user?.isVerified === true);
  const ownerVerificationStatus = user?.verificationStatus;
  const ownerStatusLabel =
    ownerVerificationStatus === 'verified'
      ? 'Verified'
      : ownerVerificationStatus === 'rejected'
        ? 'Rejected'
        : 'Pending Approval';

  // New/Edit Turf Form State
  const [formData, setFormData] = useState({
    name: '', category: 'Turf', location: '', address: '', price: 1000, 
    openTime: '06:00', closeTime: '23:00', discount: 0
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const [bookingsRes, servicesRes] = await Promise.all([
        api.get('/owner/bookings'),
        api.get('/owner/businesses')
      ]);
      setBookings(bookingsRes.data.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard', error);
      toast.error("Failed to load business data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const s = getSocket();
    const onUp = () => fetchDashboardData();
    s.on('turf:update', onUp);
    return () => {
      s.off('turf:update', onUp);
    };
  }, [fetchDashboardData]);

  const handleSaveTurf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error('Admin approval required before managing venues.');
      return;
    }
    try {
      if (editingId) {
        const res = await api.put(`/owner/businesses/${editingId}`, formData);
        setServices(services.map(s => s.id === editingId ? res.data : s));
        setEditingId(null);
        toast.success('Business updated perfectly!');
      } else {
        const res = await api.post('/owner/businesses', { ...formData, slots: [], services: [] });
        setServices([...services, res.data]);
        toast.success('Business created! Awaiting admin approval.');
      }
      setIsAdding(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save business');
    }
  };

  const handleDeleteTurf = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete ${name}? This action cannot be undone.`)) return;
    if (!canManage) {
      toast.error('Admin approval required before managing venues.');
      return;
    }
    try {
      await api.delete(`/owner/businesses/${id}`);
      setServices(services.filter(s => s.id !== id));
      toast.success('Business successfully removed');
    } catch (err) {
      toast.error('Failed to delete business');
    }
  };

  const handleUpdateDiscount = async (id: string, discount: number) => {
    if (!canManage) {
      toast.error('Admin approval required before managing discounts.');
      return;
    }
    try {
      const res = await api.put(`/owner/businesses/${id}`, { discount });
      setServices(services.map(s => s.id === id ? res.data : s));
      toast.success('Flash Discount livesync fully updated');
    } catch (err) {
      toast.error('Failed to update discount');
    }
  };

  const handleAddSlot = async (serviceId: string, e: any) => {
    e.preventDefault();
    if (!canManage) {
      toast.error('Admin approval required before managing slots.');
      return;
    }
    const t = e.target.time.value;
    const service = services.find(s => s.id === serviceId);
    if (!service || !t) return;
    
    // Check dupe
    if (service.slots?.some((s:any) => s.time === t)) {
      toast.error('Slot already exists');
      return;
    }
    const newSlots = [...(service.slots || []), { time: t, available: true, maxCapacity: 1, currentCount: 0 }];
    try {
      await api.put(`/owner/businesses/${serviceId}`, { slots: newSlots });
      setServices(services.map(s => s.id === serviceId ? { ...s, slots: newSlots } : s));
      e.target.reset();
      toast.success(`Slot ${t} added to pipeline`);
    } catch (err) {
      toast.error('Failed to update slots');
    }
  };

  const handleRemoveSlot = async (serviceId: string, idx: number) => {
    if (!canManage) {
      toast.error('Admin approval required before managing slots.');
      return;
    }
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    const newSlots = service.slots.filter((_: any, i: number) => i !== idx);
    try {
      await api.put(`/owner/businesses/${serviceId}`, { slots: newSlots });
      setServices(services.map(s => s.id === serviceId ? { ...s, slots: newSlots } : s));
      toast.success('Slot successfully revoked');
    } catch (err) {
      toast.error('Failed to revoke slot');
    }
  };

  const totalRevenue = bookings.filter(b=>b.status !== 'cancelled').reduce((sum, b) => sum + b.price, 0);

  if (loading) return <div className="p-8 text-center text-slate-500 min-h-screen flex items-center justify-center font-bold">Loading Premium Owner Console...</div>;

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-500" /> Owner Console</h2>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {[
            { id: 'overview', icon: Activity, label: 'Performance Overview' },
            { id: 'bookings', icon: CalendarIcon, label: 'Booking Register' },
            { id: 'turfs',    icon: Settings, label: 'Venue Manager' },
            { id: 'discounts',icon: Percent, label: 'Flash Offers & Growth' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsAdding(false); setEditingId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
          {!canManage && user?.role === 'owner' && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4">
              <div className="font-bold">Owner verification required</div>
              <div className="text-sm">
                Status: <span className="font-semibold">{ownerStatusLabel}</span>. Admin must approve your account before you can add venues, manage slots, or update discounts.
              </div>
            </div>
          )}
          
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'bookings' && 'Master Booking Ledger'}
                {activeTab === 'turfs' && 'Venue & Slots Management'}
                {activeTab === 'discounts' && 'Promotions Console'}
              </h1>
              <p className="text-slate-500 mt-1 capitalize">Real-time stats and controls for your enterprise.</p>
            </div>
            
            {activeTab === 'turfs' && !isAdding && canManage && (
              <button onClick={() => { 
                setFormData({ name: '', category: 'Turf', location: '', address: '', price: 1000, openTime: '06:00', closeTime: '23:00', discount: 0 });
                setEditingId(null); 
                setIsAdding(true); 
              }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:shadow-xl hover:bg-black transition-all">
                <PlusCircle className="w-5 h-5"/> Add Venue Listing
              </button>
            )}
          </header>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                   <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4"><DollarSign className="w-6 h-6 text-green-600" /></div>
                   <div className="text-slate-500 text-sm font-medium mb-1">Gross Revenue</div>
                   <div className="text-3xl font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                   <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4"><CalendarIcon className="w-6 h-6 text-blue-600" /></div>
                   <div className="text-slate-500 text-sm font-medium mb-1">Total Bookings</div>
                   <div className="text-3xl font-bold text-slate-900">{bookings.length}</div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                   <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4"><Briefcase className="w-6 h-6 text-purple-600" /></div>
                   <div className="text-slate-500 text-sm font-medium mb-1">Active Venues</div>
                   <div className="text-3xl font-bold text-slate-900">{services.length}</div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                   <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6 text-orange-600" /></div>
                   <div className="text-slate-500 text-sm font-medium mb-1">Conversion Rate</div>
                   <div className="text-3xl font-bold text-slate-900">84%</div>
                 </div>
              </div>

              {/* Recent Mini-Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-slate-900 text-lg">Recent Booking Activity</h3></div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm">
                    <tr><th className="px-6 py-4 font-semibold">Service</th><th className="px-6 py-4 font-semibold">Date/Time</th><th className="px-6 py-4 font-semibold">Price</th><th className="px-6 py-4 font-semibold">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 5).map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 text-sm">
                        <td className="px-6 py-4 font-medium text-slate-900">{b.serviceName}</td>
                        <td className="px-6 py-4 text-slate-600">{b.date} at {b.time}</td>
                        <td className="px-6 py-4 font-medium text-green-600">₹{b.price}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status==='cancelled'?'bg-red-100 text-red-600':'bg-green-100 text-green-700'}`}>{b.status}</span></td>
                      </tr>
                    ))}
                    {bookings.length === 0 && <tr><td colSpan={4} className="px-6 py-6 text-center text-slate-500">No activity yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="relative w-72">
                   <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" placeholder="Search Ledgers..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full">
                  <thead className="bg-slate-50 text-sm text-slate-600">
                    <tr><th className="px-6 py-4 text-left font-semibold">Transaction ID</th><th className="px-6 py-4 text-left font-semibold">Subject Venue</th><th className="px-6 py-4 text-left font-semibold">Schedule</th><th className="px-6 py-4 text-right font-semibold">Revenue</th><th className="px-6 py-4 text-center font-semibold">Verification Token</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">{booking.id.split('-')[0]}...</td>
                        <td className="px-6 py-4"><div className="font-semibold text-slate-900">{booking.serviceName}</div><div className="text-xs text-slate-500">{booking.category}</div></td>
                        <td className="px-6 py-4"><div className="text-slate-900 font-medium">{new Date(booking.date).toLocaleDateString('en-GB')}</div><div className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit mt-1">{booking.time}</div></td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">₹{booking.price}</td>
                        <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 shadow-sm rounded-lg text-xs font-bold uppercase tracking-widest">{booking.tokenNumber}</span></td>
                      </tr>
                    ))}
                    {bookings.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">The master ledger is empty.</td></tr>}
                  </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* TURFS TAB */}
          {activeTab === 'turfs' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {isAdding && (
                 <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900">{editingId ? 'Modify Venue Architecture' : 'Draft New Venue Profile'}</h2>
                    <form onSubmit={handleSaveTurf} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Display Name</label>
                        <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g. Apex Sports Arena" />
                      </div>
                      
                      <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Category Tag</label>
                        <select value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all">
                          <option>Turf</option><option>Salon</option><option>Gym</option><option>Restaurant</option><option>Clinic</option>
                        </select>
                      </div>

                      <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Short Locale Identifier</label>
                        <input type="text" required value={formData.location} onChange={e=>setFormData({...formData, location:e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g. Downtown Core" />
                      </div>

                      <div className="space-y-1"><label className="text-sm font-semibold text-slate-700">Base Tariff (₹)</label>
                        <input type="number" required value={formData.price || ''} onChange={e=>setFormData({...formData, price:Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-green-700 font-bold" />
                      </div>

                      <div className="space-y-1 md:col-span-2"><label className="text-sm font-semibold text-slate-700">Full Navigational Address</label>
                        <input type="text" required value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="123 Example Street, Suite 2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700 flex items-center gap-1"><Clock className="w-4 h-4"/> Operating Open Hours</label>
                          <input type="time" required value={formData.openTime} onChange={e=>setFormData({...formData, openTime:e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1"><label className="text-sm font-semibold text-slate-700 flex items-center gap-1"><Clock className="w-4 h-4"/> Operating Close Hours</label>
                          <input type="time" required value={formData.closeTime} onChange={e=>setFormData({...formData, closeTime:e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>

                      <div className="md:col-span-2 pt-6 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={()=>{setIsAdding(false); setEditingId(null)}} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Cancel Override</button>
                        <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:shadow-lg hover:bg-black transition-all flex items-center gap-2">
                           <Save className="w-5 h-5"/> {editingId ? 'Commit Update' : 'Generate Profile'}
                        </button>
                      </div>
                    </form>
                 </div>
               )}

               {!isAdding && services.map((service) => (
                 <div key={service.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                       <div>
                         <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-2xl font-bold text-slate-900">{service.name}</h3>
                           {!service.isApproved ? (
                             <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">Review Pending</span>
                           ) : (
                             <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Verified Listing</span>
                           )}
                         </div>
                         <p className="text-sm text-slate-500">{service.address} • {service.category}</p>
                       </div>
                       <div className="flex items-center gap-2">
                         {canManage && (
                           <>
                             <button onClick={() => {
                               setFormData(service); setEditingId(service.id); setIsAdding(true);
                             }} className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-100 flex items-center gap-2"><Edit3 className="w-4 h-4"/> Edit Core</button>
                             <button onClick={() => handleDeleteTurf(service.id, service.name)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium hover:bg-red-100 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Drop</button>
                           </>
                         )}
                       </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Base Tariff</div>
                        <div className="text-lg font-semibold text-slate-900">₹{service.price}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Hours</div>
                        <div className="text-lg font-semibold text-slate-900">{service.openTime} - {service.closeTime}</div>
                      </div>
                      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 col-span-2">
                        <div className="text-xs text-blue-600 font-bold uppercase mb-2">Slot Inventory Configuration</div>
                        
                          {canManage ? (
                            <form onSubmit={(e) => handleAddSlot(service.id, e)} className="flex items-center gap-2 mb-3">
                              <input type="time" name="time" required className="bg-white border text-sm border-blue-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 font-medium">Inject Slot</button>
                            </form>
                          ) : (
                            <div className="text-sm text-amber-800 mb-3">Slots are disabled until your account is verified.</div>
                          )}

                        <div className="flex flex-wrap gap-2">
                          {service.slots?.map((slot: any, idx: number) => (
                             <div key={idx} className="group relative bg-white border border-blue-200 pl-3 pr-8 py-1.5 rounded-lg shadow-sm text-sm font-medium text-slate-700">
                                {slot.time}
                                {canManage && (
                                  <button type="button" onClick={() => handleRemoveSlot(service.id, idx)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 font-bold">✕</button>
                                )}
                             </div>
                          ))}
                          {(!service.slots || service.slots.length === 0) && <span className="text-sm text-slate-500 italic">No inventory nodes injected. Application will reject customer queries.</span>}
                        </div>
                      </div>
                    </div>
                 </div>
               ))}
               {!isAdding && services.length === 0 && (
                 <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Venus Established</h3>
                    <p className="text-slate-500">Initiate your business ecosystem by adding your first venue listing above.</p>
                 </div>
               )}
            </div>
          )}

          {/* DISCOUNTS TAB */}
          {activeTab === 'discounts' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-xl">
                 <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Percent className="w-6 h-6 text-red-500" /> Dynamic Flash Sales</h2>
                 <p className="text-slate-400 max-w-2xl">Deploy real-time network-wide discounts. Any percentile over 0% automatically triggers flash-sale UI notifications across customer interfaces instantaneously.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {services.map(service => (
                  <div key={service.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    {service.discount > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 text-white flex items-center justify-center font-bold text-xl rounded-bl-3xl shadow-lg">{service.discount}%</div>}
                    <h3 className="text-xl font-bold text-slate-900 mb-1 pr-16">{service.name}</h3>
                    <p className="text-sm text-slate-500 mb-6">Base Cost: ₹{service.price}</p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Deploy Override Percentage (%)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={!canManage}
                          defaultValue={service.discount}
                          onBlur={(e) => {
                            if (!canManage) return;
                            const val = Number(e.target.value);
                            if(val !== service.discount) handleUpdateDiscount(service.id, val);
                          }}
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                        />
                        <button
                          disabled={!canManage}
                          className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-60"
                        >
                          SET
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">To disable flash sale, set value to exactly 0.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
