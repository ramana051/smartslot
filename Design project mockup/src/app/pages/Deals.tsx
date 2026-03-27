import { Link } from 'react-router';
import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Tag, Star, Timer, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../api/axios';
import { imageUrls } from '../data/images';
import { getSocket } from '../../api/socket';

export function Deals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    try {
      const { data } = await api.get('/turfs');
      const discountedTurfs = data.filter((t: any) => t.discount > 0);
      setDeals(discountedTurfs);
    } catch (error) {
      console.error('Failed to fetch deals', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
    const s = getSocket();
    const onUp = () => fetchDeals();
    s.on('turf:update', onUp);
    return () => {
      s.off('turf:update', onUp);
    };
  }, [fetchDeals]);

  const categories = ['All Deals', 'Salons', 'Gyms', 'Turfs'];
  const [activeCategory, setActiveCategory] = useState('All Deals');

  if (loading) return <div className="p-8 text-center text-slate-500">Loading deals...</div>;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Today's Hot Deals 🔥</h1>
           <p className="text-slate-600">Save up to 50% on last-minute availability</p>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/service/${deal.id}`}
                className="block bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all border border-slate-100 group"
              >
                <div className="relative h-48">
                  <img
                    src={imageUrls[deal.image as keyof typeof imageUrls] || 'https://images.unsplash.com/photo-1540324155970-141202e82f72'}
                    alt={deal.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-slate-900/80 to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      {deal.discount}% OFF
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold mb-1 truncate">{deal.name}</h3>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {deal.rating} • {deal.category}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                         <div className="text-sm text-slate-500 line-through mb-1">₹{deal.price}</div>
                      <div className="text-2xl font-bold text-slate-900">
                        ₹{deal.price * (1 - deal.discount / 100)}
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-medium text-blue-600 mb-1">
                         {deal.availableSlots} slots left
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Timer className="w-4 h-4 text-orange-500" />
                      Ends in early closing today
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                       <MapPin className="w-4 h-4 text-slate-400" />
                      {deal.location}
                    </div>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
                    Grab Deal
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No active deals right now</h3>
            <p className="text-slate-600 mb-6">Check back later for huge discounts!</p>
          </div>
        )}
      </div>
    </>
  );
}
