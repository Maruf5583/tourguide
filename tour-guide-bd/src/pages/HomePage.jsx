import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { placesApi } from '../api/places.api'
import { locationsApi } from '../api/locations.api'
import { resolveImageUrl } from '../utils/imageUrl'
import { formatBDT } from '../utils/formatters'
import {
  Search, MapPin, Star, ChevronLeft, ChevronRight,
  Compass, TrendingUp, Sparkles, ArrowRight, Map,
  Phone, Mail, Facebook, Twitter, Instagram, Youtube,
  Mountain, Waves, TreePine, Landmark, Church, Droplets
} from 'lucide-react'

// ── Hero slides ────────────────────────────────────────────
const HERO_SLIDES = [
  {
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Kaptai_Lake_%2819833365911%29.jpg',
    title: "Discover Bangladesh",
    subtitle: "Explore the hidden gems of the land of rivers",
    color: "from-emerald-900/70",
  },
  {
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/64/A_Sampan_boat_anchored_in_the_Cox%27s_Bazar_sea_beach.jpg',
    title: "Cox's Bazar",
    subtitle: "The world's longest natural sea beach awaits you",
    color: "from-blue-900/70",
  },
  {
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Sundarban_Tiger.jpg',
    title: "Sundarbans Mangrove",
    subtitle: "Home of the Royal Bengal Tiger",
    color: "from-green-900/70",
  },
  {
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Sylhet_Tea_Garden.jpg',
    title: "Sylhet Tea Gardens",
    subtitle: "Walk through the endless green carpet of tea",
    color: "from-teal-900/70",
  },
  {
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Sajek_Valley_2.jpg',
    title: "Sajek Valley",
    subtitle: "Touch the clouds in the hills of Rangamati",
    color: "from-indigo-900/70",
  },
]

const CATEGORIES = [
  { id: 1, label: 'Beach',      icon: Waves,     color: 'bg-blue-100 text-blue-600' },
  { id: 2, label: 'Hill',       icon: Mountain,  color: 'bg-orange-100 text-orange-600' },
  { id: 3, label: 'Forest',     icon: TreePine,  color: 'bg-green-100 text-green-600' },
  { id: 4, label: 'Historical', icon: Landmark,  color: 'bg-amber-100 text-amber-600' },
  { id: 5, label: 'Religious',  icon: Church,    color: 'bg-purple-100 text-purple-600' },
  { id: 6, label: 'Wetland',    icon: Droplets,  color: 'bg-teal-100 text-teal-600' },
]

// ── Small place card ──────────────────────────────────────
function PlaceCard({ place }) {
  return (
    <Link to={`/places/${place.id}`}
      className="group flex-shrink-0 w-56 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="h-36 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 relative">
        {place.coverPhotoUrl ? (
          <img src={resolveImageUrl(place.coverPhotoUrl)} alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin size={28} className="text-primary-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-gray-700">{place.averageRating?.toFixed(1) || '—'}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{place.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          <MapPin size={10} />
          <span className="truncate">{place.districtName}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-medium text-primary-600">
            {place.entryFee > 0 ? formatBDT(place.entryFee) : 'Free entry'}
          </span>
          <span className="text-xs text-gray-400">{place.totalReviews} reviews</span>
        </div>
      </div>
    </Link>
  )
}

// ── Horizontal scroll section ─────────────────────────────
function PlaceRow({ title, icon: Icon, iconColor, places, isLoading, viewAllTo }) {
  const rowRef = useRef(null)
  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
            <Icon size={18} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm transition-colors">
            <ChevronRight size={16} />
          </button>
          <Link to={viewAllTo}
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 ml-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex-shrink-0 w-56 h-52 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div ref={rowRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {places?.map(p => <PlaceCard key={p.id} place={p} />)}
        </div>
      )}
    </div>
  )
}

// ── Main HomePage ─────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const [slide, setSlide]   = useState(0)
  const [search, setSearch] = useState('')
  const [divisionId, setDivisionId] = useState('')
  const autoRef = useRef(null)

  // auto-advance slides
  useEffect(() => {
    autoRef.current = setInterval(() => {
      setSlide(s => (s + 1) % HERO_SLIDES.length)
    }, 4500)
    return () => clearInterval(autoRef.current)
  }, [])

  const goSlide = (idx) => {
    setSlide(idx)
    clearInterval(autoRef.current)
    autoRef.current = setInterval(() => {
      setSlide(s => (s + 1) % HERO_SLIDES.length)
    }, 4500)
  }

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => locationsApi.getDivisions().then(r => r.data),
  })

  const { data: beachPlaces, isLoading: l1 } = useQuery({
    queryKey: ['home-beach'],
    queryFn: () => placesApi.byCategory(1, { pageSize: 10 }).then(r => r.data),
  })
  const { data: hillPlaces, isLoading: l2 } = useQuery({
    queryKey: ['home-hill'],
    queryFn: () => placesApi.byCategory(2, { pageSize: 10 }).then(r => r.data),
  })
  const { data: historicalPlaces, isLoading: l3 } = useQuery({
    queryKey: ['home-historical'],
    queryFn: () => placesApi.byCategory(4, { pageSize: 10 }).then(r => r.data),
  })
  const { data: newPlaces, isLoading: l4 } = useQuery({
    queryKey: ['home-new'],
    queryFn: () => placesApi.search({ pageNumber: 1, pageSize: 10 }).then(r => r.data).catch(() => null),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/places?q=${encodeURIComponent(search.trim())}`)
  }

  const prevSlide = () => goSlide((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  const nextSlide = () => goSlide((slide + 1) % HERO_SLIDES.length)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO ══════════════════════════════════════════ */}
      <div className="relative h-[85vh] min-h-[500px] overflow-hidden">
        {HERO_SLIDES.map((s, i) => (
          <div key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${s.color} to-transparent`} />
          </div>
        ))}

        {/* slide arrows */}
        <button onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-colors border border-white/30">
          <ChevronLeft size={22} className="text-white" />
        </button>
        <button onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-colors border border-white/30">
          <ChevronRight size={22} className="text-white" />
        </button>

        {/* dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => goSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === slide ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
              }`} />
          ))}
        </div>

        {/* hero content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-2xl">
            <p className="text-white/80 text-sm font-medium tracking-widest uppercase mb-3">
              🇧🇩 Explore Bangladesh
            </p>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">
              {HERO_SLIDES[slide].title}
            </h1>
            <p className="text-white/90 text-base sm:text-lg mb-8 drop-shadow">
              {HERO_SLIDES[slide].subtitle}
            </p>

            {/* search box */}
            <form onSubmit={handleSearch}
              className="flex gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-1.5 shadow-2xl max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search beaches, hills, forests…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-800 bg-transparent outline-none" />
              </div>
              <select value={divisionId} onChange={e => setDivisionId(e.target.value)}
                className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 outline-none border-0">
                <option value="">All divisions</option>
                {divisions?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ══ QUICK STATS ═══════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-3 sm:grid-cols-3 gap-4 text-center">
          {[
            { value: '64', label: 'Districts', color: 'text-primary-600' },
            { value: '500+', label: 'Tourist spots', color: 'text-orange-500' },
            { value: '8', label: 'Divisions', color: 'text-blue-500' },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MAIN CONTENT ══════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Category chips ── */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Browse by category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map(c => (
              <Link key={c.id} to={`/places?category=${c.id}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color} group-hover:scale-110 transition-transform`}>
                  <c.icon size={20} />
                </div>
                <span className="text-xs font-medium text-gray-700">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Place rows ── */}
        <PlaceRow
          title="Beach & Coastal"
          icon={Waves}
          iconColor="bg-blue-100 text-blue-600"
          places={beachPlaces?.items}
          isLoading={l1}
          viewAllTo="/places?category=1"
        />
        <PlaceRow
          title="Hills & Valleys"
          icon={Mountain}
          iconColor="bg-orange-100 text-orange-600"
          places={hillPlaces?.items}
          isLoading={l2}
          viewAllTo="/places?category=2"
        />
        <PlaceRow
          title="Historical Sites"
          icon={Landmark}
          iconColor="bg-amber-100 text-amber-600"
          places={historicalPlaces?.items}
          isLoading={l3}
          viewAllTo="/places?category=4"
        />
        {newPlaces?.items?.length > 0 && (
          <PlaceRow
            title="Recently Added"
            icon={Sparkles}
            iconColor="bg-purple-100 text-purple-600"
            places={newPlaces.items}
            isLoading={l4}
            viewAllTo="/places"
          />
        )}

        {/* ── CTA banner ── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-600 via-teal-500 to-emerald-400 p-8 sm:p-12 mt-4 mb-12">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Plan your next trip</h2>
              <p className="text-white/80 text-sm">Calculate budget, travel time and build a full itinerary</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/map"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl text-sm font-medium border border-white/30 transition-colors">
                <Map size={16} /> View map
              </Link>
              <Link to="/trip-planner"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-primary-700 px-5 py-3 rounded-xl text-sm font-bold shadow-lg transition-colors">
                <Compass size={16} /> Plan trip
              </Link>
            </div>
          </div>
        </div>
      </div>

     
    </div>
  )
}