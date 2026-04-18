import { useEffect, useState } from 'react';
import { Star, MapPin, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/RouterContext';
import { SearchCard } from '../components/SearchCard';

interface ProResult {
  id: string;
  professional_type: string;
  bio: string;
  zone_text: string;
  starting_price: number;
  rating: number;
  review_count: number;
  profiles: { full_name: string; avatar_url: string } | null;
}

export function SearchPage() {
  const { navigate } = useRouter();
  const [pros, setPros] = useState<ProResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(200);
  const [minRating, setMinRating] = useState(0);
  const hash = window.location.hash;
  const qs = hash.includes('?') ? new URLSearchParams(hash.split('?')[1]) : new URLSearchParams();
  const typeFilter = qs.get('type');

  useEffect(() => {
    (async () => {
      let q = supabase
        .from('professionals')
        .select('id, professional_type, bio, zone_text, starting_price, rating, review_count, profiles:id(full_name, avatar_url)')
        .eq('approved', true);
      if (typeFilter) q = q.eq('professional_type', typeFilter);
      const { data } = await q;
      setPros((data as unknown as ProResult[]) || []);
      setLoading(false);
    })();
  }, [typeFilter]);

  const filtered = pros.filter((p) => p.starting_price <= maxPrice && p.rating >= minRating);

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4rem)]">
      <div className="bg-white border-b border-stone-200 py-5">
        <div className="max-w-7xl mx-auto px-6">
          <SearchCard compact />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <aside className="bg-white rounded-2xl border border-stone-200 p-5 h-fit sticky top-24">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-stone-500" />
            <h3 className="font-bold text-stone-900">Filters</h3>
          </div>
          <div className="mb-5">
            <label className="text-sm font-semibold text-stone-700">Max price per service</label>
            <input type="range" min="0" max="300" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-emerald-600" />
            <div className="text-xs text-stone-500">Up to ${maxPrice}</div>
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700">Minimum rating</label>
            <div className="flex gap-1 mt-2">
              {[0, 3, 4, 4.5].map((r) => (
                <button key={r} onClick={() => setMinRating(r)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${minRating === r ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-200 text-stone-600'}`}>
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">{filtered.length} pros near you</h1>
          <p className="text-stone-600 mb-6 text-sm">All our pros are identity-verified.</p>
          {loading ? (
            <div className="text-stone-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-200">
              <p className="text-stone-600">No pros match your filters yet. Try adjusting them.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/p/${p.id}`)}
                  className="text-left bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md hover:border-emerald-200 transition"
                >
                  <div className="flex gap-4">
                    <img
                      src={p.profiles?.avatar_url || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200`}
                      className="w-16 h-16 rounded-full object-cover"
                      alt=""
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-bold text-stone-900">{p.profiles?.full_name || 'Professional'}</h3>
                        <div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /><span className="font-semibold">{p.rating.toFixed(1)}</span></div>
                      </div>
                      <div className="text-xs capitalize text-emerald-700 font-semibold">{p.professional_type}</div>
                      <div className="flex items-center gap-1 text-xs text-stone-500 mt-1"><MapPin className="w-3 h-3" />{p.zone_text || 'Nearby'}</div>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 mt-3 line-clamp-2">{p.bio || 'Dedicated to making every dog feel at home.'}</p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-stone-100">
                    <div className="text-xs text-stone-500">{p.review_count} reviews</div>
                    <div className="font-bold text-stone-900">From ${p.starting_price}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
