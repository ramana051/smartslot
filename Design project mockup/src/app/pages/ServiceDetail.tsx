import { Link, useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import {
  MapPin, Clock, Star, Tag, Calendar, CheckCircle, ArrowLeft, Phone, Mail,
} from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../api/axios';
import { getSocket } from '../../api/socket';
import { imageUrls } from '../data/images';
import { toast } from 'sonner';

export function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'slot' | 'queue'>('slot');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const [serviceRes, slotsRes] = await Promise.all([
          api.get(`/turfs/${id}`),
          api.get(`/turfs/${id}/slots`)
        ]);
        setService(serviceRes.data);
        setSlots(slotsRes.data);
      } catch (error) {
        console.error('Error fetching details', error);
      } finally {
        setLoading(false);
      }
    };
    if (!id) return;
    fetchServiceData();
    const s = getSocket();
    const onUp = (payload: { turfId?: string }) => {
      if (payload?.turfId === id) fetchServiceData();
    };
    s.on('turf:update', onUp);
    return () => {
      s.off('turf:update', onUp);
    };
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;

  if (!service) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Service not found</h2>
          <Link to="/services" className="text-blue-600 hover:underline">Back to Services</Link>
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    if (bookingType === 'slot' && !selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    try {
      const payload = {
        turfId: service.id,
        serviceName: service.name,
        category: service.category,
        date: new Date().toISOString().split('T')[0],
        time: bookingType === 'slot' ? selectedSlot : 'Queue Token',
        price: service.price * (1 - (service.discount || 0) / 100) + 20,
        address: service.address,
      };
      const res = await api.post('/bookings', payload);
      
      // Auto-trigger payment status update assuming successful mock payment wrapper
      await api.post('/payments', {
        bookingId: res.data.id,
        amount: payload.price,
        method: 'card'
      });
      
      toast.success(
        bookingType === 'slot'
          ? `Slot booked successfully! Token: ${res.data.tokenNumber}`
          : `Queue token generated: ${res.data.tokenNumber}`
      );
      setTimeout(() => navigate('/bookings'), 1500);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please login to continue booking');
        navigate('/login');
      } else {
        toast.error('Failed to book slot');
      }
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative h-96 rounded-2xl overflow-hidden mb-6">
              <img src={imageUrls[service.image as keyof typeof imageUrls] || 'https://images.unsplash.com/photo-1540324155970-141202e82f72'} alt={service.name} className="w-full h-full object-cover" />
              {service.discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                  <Tag className="w-5 h-5" /> {service.discount}% OFF Today
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{service.name}</h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{service.rating}</span>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {service.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                 <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <div className="text-sm text-slate-500">Location</div>
                    <div className="font-medium">{service.address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock className="w-5 h-5" />
                  <div>
                    <div className="text-sm text-slate-500">Hours</div>
                    <div className="font-medium">{service.openTime} - {service.closeTime}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {service.services?.map((item: any) => (
                    <span key={item} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">{item}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-lg">
               <h2 className="text-2xl font-bold text-slate-900 mb-6">Choose Booking Type</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setBookingType('slot')}
                  className={`p-6 rounded-xl border-2 transition-all ${bookingType === 'slot' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                >
                  <Calendar className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-1">Book Time Slot</h3>
                </button>
                <button
                  onClick={() => setBookingType('queue')}
                  className={`p-6 rounded-xl border-2 transition-all ${bookingType === 'queue' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                >
                  <Clock className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-1">Join Queue</h3>
                </button>
              </div>

              {bookingType === 'slot' && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Available Time Slots</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {slots?.map((slot: any) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedSlot(slot.time)}
                        disabled={!slot.available}
                        className={`p-4 rounded-xl border-2 transition-all relative ${
                          !slot.available ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : selectedSlot === slot.time ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                       <div className="font-medium">{slot.time}</div>
                       {!slot.available && <div className="text-xs mt-1">Booked</div>}
                      </button>
                    ))}
                    {(!slots || slots.length === 0) && (
                      <div className="col-span-3 text-slate-500 py-4">No specific slots configured for this service yet.</div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Booking Summary</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-600"><span>Base Price</span><span>₹{service.price}</span></div>
                {service.discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{(service.price * service.discount) / 100}</span></div>
                )}
                <div className="flex justify-between text-slate-600"><span>Service Fee</span><span>₹20</span></div>
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center"><span className="font-semibold text-slate-900">Total</span><span className="text-2xl font-bold text-blue-600">₹{service.price * (1 - service.discount / 100) + 20}</span></div>
                </div>
              </div>
              <button onClick={handleBooking} className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> Confirm Booking
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
