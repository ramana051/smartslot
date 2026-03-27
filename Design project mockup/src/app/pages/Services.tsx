import { Link } from 'react-router';
import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Star, Tag, Filter, Search } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../api/axios';
import { imageUrls } from '../data/images';
import { getSocket } from '../../api/socket';

export function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      const { data } = await api.get('/turfs');
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch services', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    const s = getSocket();
    const onUp = () => fetchServices();
    s.on('turf:update', onUp);
    return () => {
      s.off('turf:update', onUp);
    };
  }, [fetchServices]);

  const categories = ['All', 'Salon', 'Hospital', 'Gym', 'Turf', 'Restaurant'];

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getWaitTimeColor = (waitTime: number) => {
    if (waitTime === 0) return 'bg-green-100 text-green-700';
    if (waitTime <= 20) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading services...</div>;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <div>
              <div className="text-sm opacity-90">Your Location</div>
              <div className="text-lg font-semibold">Bangalore, Karnataka</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search services, salons, clinics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-900">Categories</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
               <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-xl transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            Found <span className="font-semibold text-slate-900">{filteredServices.length}</span>{' '}
            services nearby
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/service/${service.id}`}
                className="block bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={imageUrls[service.image as keyof typeof imageUrls] || 'https://images.unsplash.com/photo-1540324155970-141202e82f72?auto=format&fit=crop&q=80'}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {service.discount > 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {service.discount}% OFF
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {service.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{service.name}</h3>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{service.rating}</span>
                      <span className="text-sm text-slate-500">({service.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                      <MapPin className="w-4 h-4" />
                      {service.location}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${getWaitTimeColor(service.waitTime)}`}>
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {service.waitTime === 0 ? 'No Wait' : `${service.waitTime} min wait`}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {service.availableSlots} slots available
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      {service.discount > 0 ? (
                        <div>
                          <span className="text-lg font-bold text-blue-600">
                            ₹{service.price * (1 - service.discount / 100)}
                          </span>
                          <span className="text-sm text-slate-400 line-through ml-2">
                            ₹{service.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-slate-900">₹{service.price}</span>
                      )}
                    </div>
                    <span className="text-sm text-blue-600 font-medium group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No services found</h3>
            <p className="text-slate-600 mb-6">Database might be empty or no match found.</p>
          </div>
        )}
      </div>
    </>
  );
}
