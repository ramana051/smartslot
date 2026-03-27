import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Tag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../api/axios';
import { getSocket } from '../../api/socket';
import { imageUrls } from '../data/images';

export function UserDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [bRes, tRes] = await Promise.all([api.get('/bookings'), api.get('/turfs')]);
      setBookings(bRes.data);
      const discounted = (tRes.data as any[]).filter((t) => t.discount > 0).slice(0, 6);
      setDeals(discounted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const s = getSocket();
    const onUpdate = () => {
      api.get('/turfs').then((r) => {
        const discounted = r.data.filter((t: any) => t.discount > 0).slice(0, 6);
        setDeals(discounted);
      });
    };
    s.on('turf:update', onUpdate);
    return () => {
      s.off('turf:update', onUpdate);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading your dashboard...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Your Dashboard</h1>
        <p className="text-slate-600">Bookings and live offers in one place</p>
      </div>

      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Current offers</h2>
          <Link to="/deals" className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline">
            All deals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {deals.length === 0 ? (
          <p className="text-slate-500 py-6 bg-white rounded-2xl border border-slate-100 px-6">
            No active discounts right now. Browse{' '}
            <Link to="/services" className="text-blue-600 font-medium">
              services
            </Link>{' '}
            for the latest listings.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/service/${d.id}`}
                  className="block bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-36">
                    <img
                      src={
                        imageUrls[d.image as keyof typeof imageUrls] ||
                        'https://images.unsplash.com/photo-1540324155970-141202e82f72?auto=format&fit=crop&q=80'
                      }
                      alt={d.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {d.discount}% off
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 truncate">{d.name}</h3>
                    <p className="text-sm text-slate-500">{d.location}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">My bookings</h2>
          <Link to="/services" className="text-blue-600 font-medium text-sm hover:underline">
            Book another
          </Link>
        </div>
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{booking.serviceName}</h3>
                  <p className="text-sm text-slate-500">{booking.category}</p>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {getStatusIcon(booking.status)}
                  <span className="font-medium capitalize">{booking.status}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(booking.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {booking.time}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {booking.address}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        {bookings.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-600 mb-4">You have no bookings yet.</p>
            <Link
              to="/services"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold"
            >
              Explore services
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
