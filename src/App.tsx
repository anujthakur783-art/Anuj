
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBasket, 
  Search, 
  MapPin, 
  ShoppingCart, 
  ArrowLeft, 
  CheckCircle2, 
  Truck, 
  Navigation,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
  User,
  Heart,
  Clock,
  LogOut,
  X,
  CreditCard,
  ShieldCheck,
  Star,
  Store,
  ShoppingBag
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { PRODUCTS, Product } from './constants';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type View = 'Home' | 'Cart' | 'Payment' | 'Tracking' | 'Chat' | 'Orders' | 'Profile' | 'VendorDashboard';

type UserRole = 'Customer' | 'Vendor';

interface Order {
  id: string;
  date: string;
  items: { product: Product; quantity: number }[];
  total: number;
  status: 'Packing' | 'On the way' | 'Delivered';
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info';
}

export default function App() {
  const [view, setView] = useState<View>('Home');
  const [userRole, setUserRole] = useState<UserRole>('Customer');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    const saved = localStorage.getItem('sbj_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sbj_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    showNotification(`Order ${orderId} is now ${status}`, 'info');
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverPos, setDriverPos] = useState({ lat: 28.6139, lng: 77.2090 });

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          showNotification("Location updated successfully", "info");
        },
        (error) => {
          console.error("Error getting location:", error);
          showNotification("Could not access location", "info");
        }
      );
    }
  };

  // Persistence
  useEffect(() => {
    getUserLocation(); // Try to get location on boot
  }, []);

  useEffect(() => {
    localStorage.setItem('sbj_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('sbj_orders', JSON.stringify(orders));
  }, [orders]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliverySpeed, setDeliverySpeed] = useState<'Standard' | 'Express'>('Standard');
  const [aiMessage, setAiMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initialize Socket.io
  useEffect(() => {
    // In production, the socket connects to the same host
    const s = io();
    setSocket(s);
    s.on('driver_update', (pos) => {
      setDriverPos(pos);
    });
    return () => {
      s.disconnect();
    };
  }, []);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showNotification(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = deliverySpeed === 'Standard' ? 25 : 60;
  const totalAmount = cartTotal + deliveryFee;

  const orderOnWhatsApp = () => {
    const message = `Halo SabjiWala! I want to order:\n${cart.map(item => `- ${item.product.name} x ${item.quantity}`).join('\n')}\nTotal: ₹${totalAmount}\nDelivery: ${deliverySpeed}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919999999999?text=${encoded}`, '_blank');
  };

  const askAi = async (text: string) => {
    if (!text) return;
    setIsAiLoading(true);
    try {
      const prompt = `You are "Sabjiwala Assistant". User asks about: ${text}. 
      Give a short, friendly advice about grocery freshness or a quick recipe using the items. 
      Keep it under 50 words. Current market items: ${PRODUCTS.map(p => p.name).join(', ')}.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setAiMessage(result.text || "I found some fresh advice for you!");
    } catch (error) {
      setAiMessage("Sorry, I'm feeling a bit root-bound today! Try again later.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredProducts = PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-['Inter'] selection:bg-green-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#141414]/5 px-4 py-3 flex items-center justify-between">
        {view === 'Home' ? (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
              <ShoppingBasket size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Sabjiwala</h1>
              <p className="text-[10px] uppercase tracking-wider text-green-700 font-semibold flex items-center gap-1">
                <MapPin size={10} /> {userLocation ? `${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}` : 'Detecting...'}
              </p>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setView('Home')}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        <div className="flex items-center gap-3">
          {view === 'Home' && (
            <button 
              onClick={() => setView('Chat')}
              className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"
            >
              <Sparkles size={20} />
            </button>
          )}
          <button 
            onClick={() => setView('Cart')}
            className="relative w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-md mx-auto pb-24">
        <AnimatePresence mode="wait">
          {view === 'Home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-6"
            >
              {/* Search */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search fresh veggies, fruits..."
                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {!searchQuery && (
                   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                     {['🥔 Aaloo', '🥦 Gobhi', '🍅 Tamatar', '🥭 Aam', '🧅 Pyaz'].map(tag => (
                       <button 
                         key={tag}
                         onClick={() => setSearchQuery(tag.split(' ')[1])}
                         className="text-[10px] font-bold bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-gray-500 whitespace-nowrap hover:bg-gray-50 transition-colors"
                       >
                         {tag}
                       </button>
                     ))}
                   </div>
                )}
              </div>

              {/* Mandi Rates Ticker */}
              <div className="bg-green-600 overflow-hidden py-1.5 -mx-4">
                <motion.div 
                  animate={{ x: [0, -1000] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="flex gap-8 whitespace-nowrap text-[10px] font-black text-white/90 uppercase tracking-widest px-4"
                >
                  {PRODUCTS.slice(0, 10).map(p => (
                    <span key={p.id}>🔥 {p.name}: ₹{p.price}/{p.unit}</span>
                  ))}
                  {/* Duplicate for seamless scroll */}
                  {PRODUCTS.slice(0, 10).map(p => (
                    <span key={`${p.id}-dup`}>🔥 {p.name}: ₹{p.price}/{p.unit}</span>
                  ))}
                </motion.div>
              </div>

              {/* Banner */}
              <motion.div 
                whileHover={{ scale: 0.98 }}
                onClick={() => showNotification("Subscription feature coming soon!", "info")}
                className="bg-black text-white p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl group cursor-pointer h-48 flex items-center"
              >
                <div className="relative z-10 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-green-400">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">SabjiWala Subscription</span>
                  </div>
                  <h2 className="text-2xl font-black italic tracking-tighter leading-tight">Mahine ka Rashan<br/>Book Karein</h2>
                  <p className="text-white/60 text-xs font-semibold max-w-[180px]">Get daily fresh veggies & milk at 20% discount fixed price.</p>
                </div>
                <div className="absolute right-0 bottom-0 text-[10rem] opacity-20 -mb-10 -mr-6 translate-y-4 group-hover:scale-110 transition-transform select-none">🥬</div>
                <div className="absolute top-1/2 -translate-y-1/2 right-6">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </motion.div>

              {/* Categories */}
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {['All', 'Vegetables', 'Fruits', 'Herbs', 'Exotic'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSearchQuery(cat === 'All' ? '' : cat)}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold transition-all ${
                      searchQuery === cat || (searchQuery === '' && cat === 'All')
                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                        : 'bg-white text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div className="flex items-center justify-between px-1">
                <h3 className="font-black text-xl tracking-tight italic">Fresh Pickups</h3>
                <button className="text-green-600 text-[10px] font-black uppercase tracking-widest">See All</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((p) => (
                  <motion.div 
                    key={p.id}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedProduct(p)}
                    className="bg-white rounded-3xl p-3 border border-gray-100 flex flex-col group cursor-pointer text-left"
                  >
                    <div className={`aspect-square rounded-2xl ${p.color} flex items-center justify-center text-5xl mb-3 relative overflow-hidden shrink-0`}>
                      <span className="relative z-10 group-hover:scale-110 transition-transform duration-500">{p.image}</span>
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
                    </div>
                    <div className="px-1 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">{p.category}</span>
                      </div>
                      <h3 className="font-bold text-[#141414] text-sm leading-tight h-10 overflow-hidden">{p.name}</h3>
                      <p className="text-gray-400 text-[10px] mb-3">{p.description.substring(0, 35)}...</p>
                    </div>
                    <div className="flex items-center justify-between p-1">
                      <div>
                        <span className="text-base font-black">₹{p.price}</span>
                        <span className="text-[10px] text-gray-400 font-medium ml-0.5">/ {p.unit}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                        }}
                        className="w-8 h-8 bg-[#141414] text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'Cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="flex items-baseline justify-between mb-8">
                <h2 className="text-3xl font-black">Your Cart</h2>
                <span className="text-gray-400 font-medium">{cart.length} Items</span>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                    <ShoppingBasket size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Your basket is empty</h3>
                    <p className="text-gray-400 max-w-[240px]">Looks like you haven't added any fresh produce yet.</p>
                  </div>
                  <button 
                    onClick={() => setView('Home')}
                    className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-700 transition-colors"
                  >
                    Browse Store
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100">
                      <div className={`w-16 h-16 rounded-2xl ${item.product.color} flex items-center justify-center text-3xl shrink-0`}>
                        {item.product.image}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-sm tracking-tight">{item.product.name}</h3>
                        <p className="text-[10px] text-gray-400 font-medium">₹{item.product.price} / {item.product.unit}</p>
                      </div>
                      <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-2">
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-7 h-7 rounded-lg bg-white flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors border border-gray-100 shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item.product)}
                          className="w-7 h-7 rounded-lg bg-white flex items-center justify-center hover:bg-green-50 text-green-600 transition-colors border border-gray-100 shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Delivery Selection */}
                  <div className="bg-white p-4 rounded-3xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left">Delivery Speed</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setDeliverySpeed('Standard')}
                        className={`flex-1 p-3 rounded-2xl border transition-all text-left ${
                          deliverySpeed === 'Standard' 
                            ? 'bg-green-50 border-green-200 ring-2 ring-green-500/10' 
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold">Standard</span>
                          <span className="text-xs font-black">₹25</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Delivery in 45-60 mins</p>
                      </button>
                      <button 
                        onClick={() => setDeliverySpeed('Express')}
                        className={`flex-1 p-3 rounded-2xl border transition-all text-left ${
                          deliverySpeed === 'Express' 
                            ? 'bg-green-50 border-green-200 ring-2 ring-green-500/10' 
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold">Express</span>
                          <span className="text-xs font-black">₹60</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Delivery in 10-15 mins</p>
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 bg-black text-white p-6 rounded-[2rem] space-y-4 shadow-2xl shadow-black/20 text-left">
                    <div className="space-y-2 border-b border-white/10 pb-4">
                      <div className="flex justify-between text-xs opacity-60">
                        <span>Items Total</span>
                        <span>₹{cartTotal}</span>
                      </div>
                      <div className="flex justify-between text-xs opacity-60">
                        <span>Delivery Fee ({deliverySpeed})</span>
                        <span>₹{deliveryFee}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="space-y-0.5">
                        <span className="text-[8px] opacity-50 uppercase font-black tracking-widest">Total Bill</span>
                        <p className="text-2xl font-black">₹{totalAmount}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={orderOnWhatsApp}
                          className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                          title="Order on WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.589-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.448-1.271.607-1.445.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289-.087.101-.183.226-.261.304-.101.101-.207.211-.087.419.121.208.539.886 1.157 1.435.795.708 1.462.928 1.664 1.029.202.101.32.083.439-.053.119-.136.51-.594.646-.795.136-.201.272-.169.46-.098.188.071 1.198.566 1.403.668.205.101.342.15.392.235.05.086.05.498-.094.903z"/></svg>
                        </button>
                        <button 
                          onClick={() => setView('Payment')}
                          className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-green-700 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-lg shadow-green-600/20"
                        >
                          Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'Payment' && (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="p-4 space-y-8 text-center"
            >
              <div className="space-y-2 pt-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Navigation size={32} />
                </div>
                <h2 className="text-2xl font-black">UPI Payment</h2>
                <p className="text-gray-400 text-xs px-4 leading-relaxed">Scan to pay securely or use any UPI app like GPay, PhonePe, or Paytm.</p>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6 flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-center p-3 relative overflow-hidden">
                  {/* Simulated QR Code */}
                  <div className="grid grid-cols-10 gap-0.5 opacity-80 w-full h-full">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div key={i} className={`w-full aspect-square ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`} />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                  <div className="absolute bottom-2 right-2 bg-white px-2 py-1 flex items-center gap-1 rounded-md border border-gray-200">
                     <span className="text-[8px] font-black tracking-widest text-[#141414]">BHIM UPI</span>
                  </div>
                </div>
                
                <div className="w-full space-y-2">
                  <button className="w-full bg-[#141414] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" className="h-3 invert" alt="UPI" />
                    Connect UPI App
                  </button>
                  <button 
                    onClick={() => {
                      // COD logic
                      showNotification("COD Order Placed!", "success");
                      const newOrder: Order = {
                        id: `COD-${Math.floor(1000 + Math.random() * 9000)}`,
                        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                        items: [...cart],
                        total: totalAmount,
                        status: 'Packing'
                      };
                      setOrders([newOrder, ...orders]);
                      setView('Tracking');
                      setCart([]);
                    }}
                    className="w-full bg-white border-2 border-[#141414] text-[#141414] py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                  >
                    Cash on Delivery (COD)
                  </button>
                  <button 
                    onClick={() => {
                      // Save order
                      const newOrder: Order = {
                        id: `SBJ-${Math.floor(1000 + Math.random() * 9000)}`,
                        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                        items: [...cart],
                        total: totalAmount,
                        status: 'Packing'
                      };
                      setOrders([newOrder, ...orders]);
                      setView('Tracking');
                      setCart([]);
                    }}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 px-6 leading-tight">
                Secure 256-bit SSL encrypted payments. Your data is always fresh and protected.
              </p>
            </motion.div>
          )}

          {view === 'Tracking' && (
            <motion.div 
              key="tracking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-[85vh] w-full"
            >
              <div className="absolute inset-0 bg-[#E5E7EB] overflow-hidden">
                {/* Simulated Map Streets */}
                <div className="absolute inset-0 opacity-10" style={{ 
                  backgroundImage: 'linear-gradient(#000 1px, transparent 0), linear-gradient(90deg, #000 1px, transparent 0)',
                  backgroundSize: '60px 60px'
                }} />
                
                {/* Delivery Path */}
                <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                  <path 
                    d="M 50 400 L 250 350 L 300 150 L 150 80" 
                    fill="none" 
                    stroke="black" 
                    strokeWidth="4" 
                    strokeDasharray="8 8"
                  />
                </svg>

                {/* User House */}
                <div 
                  className="absolute z-20 text-4xl"
                  style={{ 
                    left: userLocation ? `${(userLocation.lng - 77.20) * 1000}%` : '80%',
                    top: userLocation ? `${(28.64 - userLocation.lat) * 1000}%` : '15%'
                  }}
                >
                   📍
                   <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-sm border border-gray-100">
                     {userLocation ? 'Your Location' : 'Home'}
                   </div>
                </div>

                {/* Driver */}
                <motion.div 
                  className="absolute z-20 text-4xl"
                  style={{ 
                    // Manual translation of lat/lng to UI coordinates for the demo
                    left: `${(driverPos.lng - 77.20) * 1000}%`,
                    top: `${(28.64 - driverPos.lat) * 1000}%`
                  }}
                  transition={{ type: 'spring', damping: 25 }}
                >
                  🚴‍♂️
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded-full text-[8px] font-black flex items-center gap-1.5 shadow-xl whitespace-nowrap uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    En-route
                  </div>
                </motion.div>
              </div>

              {/* Status Card Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-30">
                <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-5 space-y-4 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                      <Truck size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-base italic leading-tight">Fastest Delivery</h4>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">ETA: 8 mins • Anish is moving fast</p>
                    </div>
                    <div className="bg-gray-100 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-gray-500">
                      OTP: 5821
                    </div>
                  </div>

                  {/* Status Stepper */}
                  <div className="flex justify-between relative px-2 py-2">
                    <div className="absolute top-6 left-6 right-6 h-[1px] bg-gray-100 -z-10" />
                    {[
                      { label: 'Packing', icon: ShoppingBag, active: true },
                      { label: 'On Way', icon: Truck, active: orders[0]?.status !== 'Packing' },
                      { label: 'Aaya!', icon: CheckCircle2, active: orders[0]?.status === 'Delivered' }
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step.active ? 'bg-green-600 text-white scale-110 shadow-lg shadow-green-600/20' : 'bg-white text-gray-300 border border-gray-100'}`}>
                          <step.icon size={16} />
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${step.active ? 'text-green-700' : 'text-gray-300'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                        <CheckCircle2 size={12} />
                      </div>
                      <span className="text-[9px] font-bold">Cold Pack Storage</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                        <CheckCircle2 size={12} />
                      </div>
                      <span className="text-[9px] font-bold">Contactless</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setView('Home')}
                    className="w-full bg-[#141414] text-white py-4 rounded-xl font-bold active:scale-[0.98] transition-all text-xs tracking-wider"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'Orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="p-4 space-y-6"
            >
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-3xl font-black">History</h2>
                <span className="text-gray-400 font-medium">{orders.length} Orders</span>
              </div>

              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 grayscale h-[60vh]">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                    <Navigation size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">No past orders</h3>
                    <p className="text-gray-400 max-w-[240px]">Once you shop with us, your fresh history will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 p-5 space-y-4 shadow-sm text-left">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Order #{order.id}</span>
                          <h3 className="font-bold text-sm">{order.date}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className={`w-8 h-8 rounded-full ${item.product.color} border-2 border-white flex items-center justify-center text-sm shadow-sm`}>
                            {item.product.image}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <span className="text-lg font-black italic">₹{order.total}</span>
                        <button className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:bg-green-50 px-3 py-2 rounded-lg transition-colors">
                          Download Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'Profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-8 text-left"
            >
              <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-green-100 rounded-[2rem] flex items-center justify-center text-green-600 border-4 border-white shadow-xl">
                  <User size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter">Anuj Chauhan</h2>
                  <p className="text-gray-400 text-xs font-semibold">Gold Member • 42 Orders</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Personal Settings</h3>
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => {
                      const newRole = userRole === 'Customer' ? 'Vendor' : 'Customer';
                      setUserRole(newRole);
                      setView(newRole === 'Vendor' ? 'VendorDashboard' : 'Home');
                      showNotification(`Switched to ${newRole} Mode`);
                    }}
                    className="w-full flex items-center gap-4 p-5 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0 group text-left"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 transition-colors">
                      {userRole === 'Customer' ? <Store size={20} /> : <User size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{userRole === 'Customer' ? 'Switch to Vendor App' : 'Switch to Customer App'}</p>
                      <p className="text-[10px] text-gray-400">Manage your dukaan and orders</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </button>
                  {[
                    { icon: MapPin, label: 'Current Location', sub: userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Wait for location...', action: getUserLocation },
                    { icon: CreditCard, label: 'Payment Methods', sub: 'UPI, Visa •••• 4242' },
                    { icon: ShieldCheck, label: 'Privacy & Security', sub: 'FaceID, 2FA Enabled' },
                    { icon: Star, label: 'Loyalty Program', sub: '2,450 Coins available' }
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => item.action?.()}
                      className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group text-left"
                    >
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.label}</p>
                        <p className="text-[10px] text-gray-400">{item.sub}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                <LogOut size={18} />
                Logout Account
              </button>
            </motion.div>
          )}

          {view === 'VendorDashboard' && (
            <motion.div 
              key="vendor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-8 text-left"
            >
              <div className="bg-[#141414] text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Dukaan Overview</p>
                  <h2 className="text-4xl font-black italic tracking-tighter italic">₹{orders.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Total Sales Today</p>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-4 text-8xl opacity-10 select-none">🧾</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                    <ShoppingBag size={20} />
                  </div>
                  <h4 className="text-2xl font-black tracking-tight">{orders.length}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Orders</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                    <Clock size={20} />
                  </div>
                  <h4 className="text-2xl font-black tracking-tight">
                    {orders.filter(o => o.status !== 'Delivered').length}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pending</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black italic tracking-tighter">Naye Orders (New)</h3>
                  <div className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full animate-pulse">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    <span className="text-[8px] font-black uppercase tracking-widest">Live</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Be patience! Order aayega...</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.id}</p>
                            <h4 className="text-lg font-black">{order.items.length} Items</h4>
                            <p className="text-xs text-gray-400">{order.items.map(i => i.product.name).join(', ')}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <p className="text-xl font-black">₹{order.total}</p>
                          {order.status !== 'Delivered' && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => updateOrderStatus(order.id, order.status === 'On the way' ? 'Delivered' : 'On the way')}
                                className="bg-[#141414] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors"
                              >
                                {order.status === 'Packing' ? 'Taiyaar Hai (Ready)' : 'Delivered Karein'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'Chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 flex flex-col h-[85vh] text-left"
            >
              <div className="flex-1 space-y-4 pt-4 overflow-y-auto scrollbar-hide">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-600/20">
                  <Sparkles size={28} />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter leading-none">Freshness<br/>Expert AI</h2>
                <p className="text-gray-500 text-sm font-medium pr-10 leading-relaxed">Your organic assistant for seasonal recipes and shelf-life hacks.</p>
                
                {aiMessage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100 shadow-sm text-blue-900 font-medium leading-relaxed mt-8 relative"
                  >
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                      <Sparkles size={14} />
                    </div>
                    {aiMessage}
                  </motion.div>
                )}

                {isAiLoading && (
                  <div className="flex items-center gap-2 text-blue-400 font-black px-4 mt-8">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-75" />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>

              <div className="relative pt-4 sticky bottom-4">
                <input 
                  type="text" 
                  placeholder="Tips for organic storage..."
                  className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-4 pr-16 shadow-2xl focus:outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium placeholder:text-gray-300"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      askAi(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Notifications */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#141414] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 pointer-events-auto"
            >
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 size={14} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Product Information Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3rem] z-[70] p-6 text-left"
            >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6" />
              <div className={`aspect-square w-full rounded-[2.5rem] ${selectedProduct.color} flex items-center justify-center text-9xl mb-8 relative border-8 border-white shadow-inner`}>
                {selectedProduct.image}
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em]">{selectedProduct.category}</span>
                      <span className="bg-orange-100 text-orange-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Mandi Fresh</span>
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter">{selectedProduct.name}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">₹{selectedProduct.price}</span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">per {selectedProduct.unit}</p>
                  </div>
                </div>
                
                <p className="text-gray-500 text-sm leading-relaxed font-medium">
                  {selectedProduct.description} Sabse taaza aur sasta, direct khet se aapke kitchen tak. No chemical wash, pure natural.
                </p>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Clock size={18} className="text-gray-400 mb-2" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Shelf Life</p>
                    <p className="text-xs font-bold">5-7 Days</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Sparkles size={18} className="text-gray-400 mb-2" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Freshness</p>
                    <p className="text-xs font-bold">Grade A+</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <Heart size={24} />
                  </button>
                  <button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 bg-green-600 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-green-700 shadow-xl shadow-green-600/20 active:scale-[0.98] transition-all uppercase"
                  >
                    Add to Basket
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modern Floating Bar */}
      {view === 'Home' && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
           <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-[2rem] p-1.5 flex items-center justify-between px-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
              <button 
                onClick={() => setView('Home')}
                className={`flex-1 py-3.5 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all ${
                  view === 'Home' ? 'bg-[#141414] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ShoppingBasket size={18} />
                <span className="text-[7px] font-black uppercase tracking-widest">Store</span>
              </button>
              <button 
                onClick={() => setView('Tracking')}
                className={`flex-1 py-3.5 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all ${
                  view === 'Tracking' ? 'bg-[#141414] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Truck size={18} />
                <span className="text-[7px] font-black uppercase tracking-widest">Order</span>
              </button>
              <button 
                onClick={() => setView('Orders')}
                className={`flex-1 py-3.5 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all ${
                  view === 'Orders' ? 'bg-[#141414] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Navigation size={18} />
                <span className="text-[7px] font-black uppercase tracking-widest">History</span>
              </button>
              <button 
                onClick={() => setView('Profile')}
                className={`flex-1 py-3.5 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all ${
                  view === 'Profile' ? 'bg-[#141414] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <User size={18} />
                <span className="text-[7px] font-black uppercase tracking-widest">Profile</span>
              </button>
              <button 
                onClick={() => setView('Chat')}
                className={`flex-1 py-3.5 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all ${
                  view === 'Chat' ? 'bg-[#141414] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Sparkles size={18} />
                <span className="text-[7px] font-black uppercase tracking-widest">Tips</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
