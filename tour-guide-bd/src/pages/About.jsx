import { Link } from 'react-router-dom'
import { useState } from 'react'
import { MapPin, Compass, Shield, Users, Wallet, ArrowRight, Star, LandPlot } from 'lucide-react'

var stats = [
  { label: 'Districts covered', value: '64' },
  { label: 'Verified guides', value: '400+' },
  { label: 'Trips planned', value: '12,000+' },
  { label: 'Avg. guide rating', value: '4.8' },
]

var milestones = [
  {
    year: '2023',
    title: 'The idea, on a bus to Sylhet',
    body: 'Three friends missed the best tea gardens because their guide never showed. We started sketching a way to find, vet, and book local guides directly — no middlemen, no guesswork.',
  },
  {
    year: '2024',
    title: 'TourGuide BD goes live',
    body: 'Launched with 30 guides across Cox’s Bazar, Sylhet and the Sundarbans, plus a simple trip planner so solo travellers could budget a route before booking anyone.',
  },
  {
    year: '2025',
    title: 'The guide network grows up',
    body: 'Verification, in-app payouts, and reviews arrived. Guides could finally run their work from a dashboard instead of a notebook and a phone full of missed calls.',
  },
  {
    year: '2026',
    title: 'Nationwide, district by district',
    body: 'All 64 districts are now searchable on the map, with local guides, saved districts, and check-ins helping travellers build trips that actually fit their time and budget.',
  },
]

var values = [
  { icon: Compass, title: 'Local first', body: 'Every guide on the platform lives near the places they show you — not a call centre, not a franchise.' },
  { icon: Shield, title: 'Verified, not just listed', body: 'Guides go through ID and reference checks before they can accept a booking, so you know who you’re meeting.' },
  { icon: Wallet, title: 'Fair pricing, upfront', body: 'No commission games. Guides set their rate, travellers see the full cost before they book — nothing added later.' },
  { icon: Users, title: 'Built with the community', body: 'Route ideas, place listings and district guides come from real travellers and guides, reviewed before they go live.' },
]

var divisions = [
  { name: 'Dhaka', districts: ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'] },
  { name: 'Chattogram', districts: ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', 'Cumilla', "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'] },
  { name: 'Rajshahi', districts: ['Bogura', 'Joypurhat', 'Naogaon', 'Natore', 'Chapainawabganj', 'Pabna', 'Rajshahi', 'Sirajganj'] },
  { name: 'Khulna', districts: ['Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'] },
  { name: 'Barishal', districts: ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'] },
  { name: 'Sylhet', districts: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'] },
  { name: 'Rangpur', districts: ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'] },
  { name: 'Mymensingh', districts: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'] },
]

function BangladeshMap() {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <iframe
        title="Map of Bangladesh"
        src="https://maps.google.com/maps?q=Bangladesh&z=7&output=embed"
        className="w-full h-full"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}

export default function About() {
  var [activeDivision, setActiveDivision] = useState(0)

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 via-white to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
              <MapPin size={12} /> Our story
            </span>
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold text-gray-900 leading-[1.05] tracking-tight">
              A country of rivers,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-500">
                mapped by locals.
              </span>
            </h1>
            <p className="mt-6 text-gray-600 text-base sm:text-lg leading-relaxed max-w-md">
              Bangladesh doesn’t fit in a single itinerary template. TourGuide BD connects
              you with local guides who actually live where you’re going, and gives you the
              tools to plan the rest — one district at a time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/trip-planner" className="btn-primary inline-flex items-center gap-1.5">
                Plan a trip <ArrowRight size={15} />
              </Link>
              <Link to="/guides" className="btn-secondary">Meet the guides</Link>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg">
              {stats.map(function(s) {
                return (
                  <div key={s.label} className="border-l-2 border-primary-200 pl-3">
                    <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bangladesh map */}
          <div className="relative h-[420px] flex items-center justify-center">
            <div className="absolute inset-0 bg-primary-100/40 rounded-full blur-3xl" />
            <div className="relative w-full h-full">
              <BangladeshMap />
            </div>
          </div>
        </div>
      </section>

      {/* 64 districts explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <LandPlot size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">8 divisions, 64 districts</h2>
            <p className="text-gray-500 mt-1">Every single zila, searchable on the map. Tap a division to see its districts.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {divisions.map(function(d, i) {
            var isActive = i === activeDivision
            return (
              <button
                key={d.name}
                onClick={function() { setActiveDivision(i) }}
                className={
                  'px-4 py-2 rounded-full text-sm font-medium border transition-colors ' +
                  (isActive
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600')
                }
              >
                {d.name}
                <span className={'ml-1.5 text-xs ' + (isActive ? 'text-primary-100' : 'text-gray-400')}>
                  {d.districts.length}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-6">
          <div className="flex flex-wrap gap-2.5">
            {divisions[activeDivision].districts.map(function(name) {
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  <MapPin size={12} className="text-primary-500" />
                  {name}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">How we got here</h2>
        <p className="text-gray-500 mt-1 mb-10">A short trip, so far.</p>

        <div className="relative pl-8">
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200" />
          <div className="space-y-10">
            {milestones.map(function(m) {
              return (
                <div key={m.year} className="relative">
                  <div className="absolute -left-8 top-1 w-3.5 h-3.5 rounded-full bg-primary-600 ring-4 ring-primary-50" />
                  <div className="text-xs font-semibold text-primary-600 tracking-wide">{m.year}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">{m.title}</h3>
                  <p className="text-gray-600 mt-1.5 leading-relaxed max-w-2xl">{m.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900">What we stand for</h2>
          <p className="text-gray-500 mt-1 mb-10">The rules we hold guides, listings and ourselves to.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(function(v) {
              var Icon = v.icon
              return (
                <div key={v.title} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-4">{v.title}</h3>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{v.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-600 px-8 py-10 sm:px-12 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-1.5 justify-center md:justify-start text-primary-100 text-sm">
              <Star size={14} className="fill-primary-100" /> Trusted by travellers across 64 districts
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              Know a place better than any app? Guide it.
            </h2>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/register" className="bg-white text-primary-700 font-medium px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-colors">
              Become a guide
            </Link>
            <Link to="/trip-planner" className="border border-white/40 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
              Plan a trip
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}