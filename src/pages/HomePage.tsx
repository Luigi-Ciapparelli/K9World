import { useEffect, useState } from 'react';
import { Star, Shield, Heart, Search, CreditCard, Smile, ChevronDown } from 'lucide-react';
import { SearchCard } from '../components/SearchCard';
import { useRouter } from '../lib/RouterContext';

const serviceTabs = {
  overnight: [
    {
      title: 'Boarding',
      subtitle: "In sitter's home",
      text: "Book a cosy sleepover at a trusted sitter's house. Your pet gets personalised care and you get photo updates.",
      image: 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      title: 'House Sitting',
      subtitle: 'In your home',
      text: 'Travel stress-free knowing your pet and home are looked after. A trusted sitter keeps your routine intact.',
      image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
  ],
  daytime: [
    {
      title: 'Dog Walking',
      subtitle: 'Exercise for your pup',
      text: 'Active walks from trusted walkers in your neighbourhood, with GPS tracking and photo updates.',
      image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      title: 'Doggy Day Care',
      subtitle: "In sitter's home",
      text: 'Daytime fun and socialisation when you are busy, in a home environment your dog will love.',
      image: 'https://images.pexels.com/photos/594566/pexels-photo-594566.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
  ],
  all: [
    {
      title: 'Grooming',
      subtitle: 'Clean, trimmed, happy',
      text: 'Professional grooming for every coat and breed, booked in minutes.',
      image: 'https://images.pexels.com/photos/5731866/pexels-photo-5731866.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      title: 'Training',
      subtitle: 'Certified trainers',
      text: 'Personalised training plans that fit your dog, your lifestyle and your goals.',
      image: 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
  ],
};

const faqs = [
  { q: 'What is PawConnect?', a: 'PawConnect is a trusted marketplace connecting dog owners with verified local professionals for walking, boarding, sitting, training and grooming.' },
  { q: 'How are professionals verified?', a: 'Every professional completes identity verification, provides phone and email verification, and is reviewed by our team before being visible to clients.' },
  { q: 'Is it safe?', a: 'Yes. We verify every pro, keep payment details secure, and show only verified reviews from real completed bookings.' },
  { q: 'How do payments work?', a: 'Bookings are secured on the platform. You pay online only after the service is confirmed.' },
];

export function HomePage() {
  useEffect(() => {
    const queryParams = window.location.hash.includes('?')
      ? new URLSearchParams(window.location.hash.split('?')[1])
      : new URLSearchParams();

    if (queryParams.get('section') === 'services') {
      setTimeout(() => {
        document.getElementById('services')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 50);
    }
  }, []);
  const [tab, setTab] = useState<'overnight' | 'daytime' | 'all'>('overnight');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { navigate } = useRouter();

  return (
    <div className="bg-white">
      <section className="relative">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1920" className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/60 via-stone-900/40 to-stone-900/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-28">
          <div className="text-center text-white mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">Loving Pet Care in Your Neighbourhood</h1>
            <p className="text-lg md:text-xl text-white/90">Book trusted sitters, walkers and trainers for your dog.</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <SearchCard />
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-white/90 text-sm">
            <div className="flex -space-x-0.5">
              {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <span className="font-semibold">30,000+ reviews</span>
            <span className="text-white/70">on Trustpilot</span>
          </div>
        </div>
      </section>

      <section id="services" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">Get to know services on PawConnect</h2>
        <p className="text-stone-600 mb-8">Get the care your dog needs, anytime and anywhere.</p>
        <div className="flex gap-2 mb-10 flex-wrap">
          {([['overnight','Overnight care'],['daytime','Daytime care'],['all','All services']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id as 'overnight' | 'daytime' | 'all')}
              className={`px-5 py-2 rounded-full text-sm font-semibold border transition ${
                tab === id ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-stone-300 text-stone-600 hover:border-stone-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {serviceTabs[tab].map((s) => (
            <div key={s.title} className="grid sm:grid-cols-2 gap-5 items-center">
              <img src={s.image} alt={s.title} className="w-full h-60 object-cover rounded-2xl" />
              <div>
                <h3 className="text-xl font-bold text-stone-900">{s.title}</h3>
                <p className="text-sm text-stone-500 mb-2">{s.subtitle}</p>
                <p className="text-stone-700 mb-4">{s.text}</p>
                <button onClick={() => navigate('/search')} className="px-5 py-2.5 border border-stone-300 rounded-full text-sm font-semibold hover:border-emerald-600 hover:text-emerald-700 transition">
                  Explore {s.title}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amber-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 text-center mb-14">Meet local pros who will treat your dog like family</h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {[
              { icon: Search, title: '1. Search', text: 'Read verified reviews and choose a screened pro who is a great match for you and your dog.' },
              { icon: CreditCard, title: '2. Book and pay', text: 'No cash needed. We make it simple to book and make secure payments through our website.' },
              { icon: Smile, title: '3. Relax', text: 'Stay in touch with photos and messaging. Every booking is backed by PawProtect and 24/7 support.' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                    <Icon className="w-10 h-10 text-emerald-700" />
                  </div>
                  <h3 className="font-bold text-stone-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-stone-700 leading-relaxed">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-start">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">FAQs</h2>
          <p className="text-stone-600 mb-8">Frequently asked questions about PawConnect</p>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-4 text-left hover:bg-stone-50"
                >
                  <span className="font-semibold text-stone-900">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-stone-500 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="p-4 pt-0 text-stone-600 text-sm leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-stone-50 rounded-3xl p-10 flex flex-col items-center text-center border border-stone-100">
          <Heart className="w-14 h-14 text-rose-500 mb-4" />
          <h3 className="text-2xl font-bold text-stone-900 mb-2">Become a PawConnect Pro</h3>
          <p className="text-stone-600 mb-6">Turn your love for dogs into a thriving business. Get a full CRM, memberships, passes, campaigns, analytics and more - all in one place.</p>
          <button onClick={() => navigate('/become-pro')} className="px-6 py-3 bg-stone-900 text-white rounded-full font-semibold hover:bg-stone-800 transition">
            Start earning
          </button>
          <div className="flex items-center gap-2 mt-6 text-sm text-stone-500">
            <Shield className="w-4 h-4" /> Backed by PawProtect
          </div>
        </div>
      </section>

      <footer className="bg-stone-900 text-stone-400 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">&copy; 2026 PawConnect. Loving pet care, powered by community.</p>
          <div className="flex gap-6 text-sm">
            <a className="hover:text-white">Privacy</a>
            <a className="hover:text-white">Terms</a>
            <a className="hover:text-white">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
