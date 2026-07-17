import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Youtube, ChevronDown, Send } from 'lucide-react'
import toast from 'react-hot-toast'

var topics = ['General question', 'Booking a guide', 'Becoming a guide', 'Report a problem', 'Partnership']

var faqs = [
  {
    q: 'How do I become a guide on TourGuide BD?',
    a: 'Create an account, then apply from your profile with an ID and the districts you know well. Our team reviews applications within 2–3 business days, and once verified you get a guide dashboard for bookings and payouts.',
  },
  {
    q: 'Is paying for a guide through the app safe?',
    a: 'Yes. Payments are held until the trip is confirmed complete, guides are ID-verified before they can accept bookings, and every booking has a review left afterward — by both sides.',
  },
  {
    q: 'Can I plan a trip without booking a guide?',
    a: 'Absolutely. The trip planner and map work on their own — add places, budget the route, and save districts. Booking a local guide is optional, for whenever you want someone who knows the area.',
  },
  {
    q: 'What’s the cancellation and refund policy?',
    a: 'Trips cancelled more than 48 hours before the start are refunded in full. Inside 48 hours, refunds follow the guide’s individual policy, shown on their profile before you book.',
  },
]

function FaqItem(props) {
  var item = props.item
  var [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 py-4">
      <button
        onClick={function() { setOpen(function(o) { return !o }) }}
        className="w-full flex items-center justify-between text-left gap-4"
      >
        <span className="font-medium text-gray-900 text-sm sm:text-base">{item.q}</span>
        <ChevronDown size={18} className={'text-gray-400 shrink-0 transition-transform ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && <p className="text-sm text-gray-600 mt-3 leading-relaxed max-w-2xl">{item.a}</p>}
    </div>
  )
}

export default function Contact() {
  var [form, setForm] = useState({ name: '', email: '', topic: topics[0], message: '' })
  var [submitting, setSubmitting] = useState(false)

  function update(field) {
    return function(e) {
      setForm(function(f) { return Object.assign({}, f, { [field]: e.target.value }) })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in your name, email and message')
      return
    }
    setSubmitting(true)
    setTimeout(function() {
      setSubmitting(false)
      toast.success('Message sent — we’ll reply within a day')
      setForm({ name: '', email: '', topic: topics[0], message: '' })
    }, 900)
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            <Mail size={12} /> Get in touch
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            We're here, Dhaka to Cox's Bazar
          </h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Questions about a booking, a guide application, or just an idea for a route
            we should add — send it over and a real person will answer.
          </p>
        </div>
      </section>

      {/* Form + info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid lg:grid-cols-5 gap-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input value={form.name} onChange={update('name')} placeholder="Your full name" className="input mt-1.5 w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className="input mt-1.5 w-full" />
            </div>
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-gray-700">Topic</label>
            <select value={form.topic} onChange={update('topic')} className="input mt-1.5 w-full">
              {topics.map(function(t) { return <option key={t} value={t}>{t}</option> })}
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={form.message}
              onChange={update('message')}
              rows={5}
              placeholder="Tell us a bit about what you need…"
              className="input mt-1.5 w-full resize-none"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-6 inline-flex items-center gap-2 disabled:opacity-60">
            <Send size={15} /> {submitting ? 'Sending…' : 'Send message'}
          </button>
        </form>

        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-100 p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">Email</div>
              <div className="text-sm text-gray-600 mt-0.5">support@tourguidebd.com</div>
              <div className="text-xs text-gray-400 mt-0.5">Replies within 24 hours</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Phone size={18} />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">Phone</div>
              <div className="text-sm text-gray-600 mt-0.5">+880 1XXX-XXXXXX</div>
              <div className="text-xs text-gray-400 mt-0.5">Sat–Thu, 10am–7pm</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">Office</div>
              <div className="text-sm text-gray-600 mt-0.5">Gulshan Avenue, Dhaka 1212, Bangladesh</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">Support hours</div>
              <div className="text-sm text-gray-600 mt-0.5">Everyday, 9am – 9pm (GMT+6)</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <a href="#" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-600 text-gray-500 flex items-center justify-center transition-colors">
              <Facebook size={16} />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-600 text-gray-500 flex items-center justify-center transition-colors">
              <Instagram size={16} />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-600 text-gray-500 flex items-center justify-center transition-colors">
              <Youtube size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Common questions</h2>
          <p className="text-gray-500 mt-1 mb-6 text-center">Can’t find your answer? Send it through the form above.</p>
          <div className="bg-white rounded-2xl border border-gray-100 px-6">
            {faqs.map(function(item) { return <FaqItem key={item.q} item={item} /> })}
          </div>
        </div>
      </section>
    </div>
  )
}