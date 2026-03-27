import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../api/axios';

export function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/bookings');
        setBookings(data);
      } catch (error) {
        console.error('Failed to fetch bookings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':  return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your bookings...</div>;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Bookings</h1>
          <p className="text-slate-600">Manage and track all your bookings</p>
        </div>

        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{booking.serviceName}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{booking.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <MapPin className="w-4 h-4" /> <span className="text-sm">{booking.address}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)} <span className="font-medium capitalize">{booking.status}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Date</div>
                    <div className="font-medium text-slate-900">
                      {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Time</div>
                    <div className="font-medium text-slate-900">{booking.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎫</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Token</div>
                    <div className="font-medium text-slate-900">{booking.tokenNumber}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No bookings yet</h3>
            <p className="text-slate-600 mb-6">Start booking services to see them here</p>
            <Link to="/services" className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl"> Explore Services </Link>
          </div>
        )}
      </div>
    </>
  );
}
