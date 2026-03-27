import { Link } from 'react-router';
import { MapPin, Clock, Tag, Star, TrendingUp, Award, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { imageUrls } from '../data/images';
import api from '../../api/axios';
import { getSocket } from '../../api/socket';

export function Home() {
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/turfs');
        setFeatured((data as any[]).slice(0, 6));
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const s = getSocket();
    const onUp = () => load();
    s.on('turf:update', onUp);
    return () => {
      s.off('turf:update', onUp);
    };
  }, []);

  const categories = [
    { name: 'Salons', icon: '💇', count: 245 },
    { name: 'Hospitals', icon: '🏥', count: 156 },
    { name: 'Gyms', icon: '💪', count: 198 },
    { name: 'Turfs', icon: '⚽', count: 87 },
    { name: 'Restaurants', icon: '🍽️', count: 432 },
    { name: 'Clinics', icon: '⚕️', count: 289 },
  ];

  const features = [
    { icon: Clock, title: 'Skip the Wait', description: 'Book queue slots and never wait in line again' },
    { icon: Tag, title: 'Last-Minute Deals', description: 'Save on empty time slots with live discounts' },
    { icon: MapPin, title: 'Find Nearby', description: 'Discover services near your location' },
    { icon: TrendingUp, title: 'Smart booking', description: 'Pick a slot or join the queue in seconds' },
  ];

  const stats = [
    { icon: Users, value: '50K+', label: 'Active Users' },
    { icon: Award, value: '1000+', label: 'Partner Businesses' },
    { icon: Star, value: '4.8', label: 'Average Rating' },
    { icon: Clock, value: '45min', label: 'Time Saved Avg.' },
  ];

  return (
    <>
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-5xl sm:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Skip Waiting.
                </span>
                <br />
                <span className="text-slate-900">Save Money.</span>
                <br />
                <span className="text-slate-900">Book Smart.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Discover approved venues, book time slots or queue tokens, and grab live discounts—all synced in real
                time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/services"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all text-center"
                >
                  Explore Services
                </Link>
                <Link
                  to="/deals"
                  className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition-all text-center"
                >
                  View Deals
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img src={imageUrls.hero} alt="SmartSlot App" className="rounded-2xl shadow-2xl" />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">Live</div>
                    <div className="text-sm text-slate-500">Slots & offers update instantly</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Featured venues</h2>
              <Link to="/services" className="text-blue-600 font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/service/${t.id}`}
                    className="block bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-40">
                      <img
                        src={
                          imageUrls[t.image as keyof typeof imageUrls] ||
                          'https://images.unsplash.com/photo-1540324155970-141202e82f72?auto=format&fit=crop&q=80'
                        }
                        alt={t.name}
                        className="w-full h-full object-cover"
                      />
                      {t.discount > 0 && (
                        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {t.discount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900">{t.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {t.location}
                      </p>
                      <p className="text-blue-600 font-semibold mt-2">
                        From ₹{Math.round(t.price * (1 - (t.discount || 0) / 100))}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Browse by Category</h2>
            <p className="text-xl text-slate-600">Find services near you in seconds</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to="/services"
                  className="block bg-white p-6 rounded-2xl hover:shadow-xl transition-all group"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{category.icon}</div>
                  <div className="font-semibold text-slate-900 mb-1">{category.name}</div>
                  <div className="text-sm text-slate-500">{category.count} places</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose SmartSlot?</h2>
            <p className="text-xl text-blue-100">Everything you need to save time and money</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md p-6 rounded-2xl"
              >
                <feature.icon className="w-12 h-12 text-white mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-blue-100">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-slate-600 mb-8">Create a free account and book your first slot today</p>
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">SmartSlot</span>
              </div>
              <p className="text-slate-400">Skip waiting. Save money. Book smart.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/services" className="block text-slate-400 hover:text-white">
                  Services
                </Link>
                <Link to="/deals" className="block text-slate-400 hover:text-white">
                  Deals
                </Link>
                <Link to="/bookings" className="block text-slate-400 hover:text-white">
                  My Bookings
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Business</h3>
              <div className="space-y-2">
                <Link to="/register/owner" className="block text-slate-400 hover:text-white">
                  Register as owner
                </Link>
                <Link to="/business" className="block text-slate-400 hover:text-white">
                  Owner dashboard
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-slate-400">
                <p>support@smartslot.com</p>
                <p>+91 98765 43210</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>© 2026 SmartSlot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
