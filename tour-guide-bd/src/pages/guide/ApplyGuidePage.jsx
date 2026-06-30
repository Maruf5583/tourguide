import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { guideApi } from '../../api/guide.api'
import { useAuthStore } from '../../store/auth.store'
import { parseApiErrors } from '../../utils/apiErrors'
import { UserCheck, Upload, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

const DOC_TYPES = [
  { key: 'NidFront',    label: 'NID Front side',               icon: '🪪', required: true  },
  { key: 'NidBack',     label: 'NID Back side',                icon: '🪪', required: true  },
  { key: 'DobCert',     label: 'Birth Certificate photo',      icon: '📄', required: true  },
  { key: 'Photo',       label: 'Profile photo',                icon: '📷', required: true  },
  { key: 'Certificate', label: 'Guide certificate (optional)', icon: '📜', required: false },
]

const DOC_TYPE_MAP = {
  NidFront:    'nid-front',
  NidBack:     'nid-back',
  DobCert:     'dob-certificate',
  Photo:       'profile-photo',
  Certificate: 'certificate',
}

export default function ApplyGuidePage() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const [loading,      setLoading]      = useState(false)
  const [errors,       setErrors]       = useState({})
  const [docs,         setDocs]         = useState({})
  const [uploaded,     setUploaded]     = useState({})
  const [uploading,    setUploading]    = useState({})
  const [uploadedUrls, setUploadedUrls] = useState({})

  const [form, setForm] = useState({
    userId:       user?.id       || '',
    fullName:     user?.fullName || '',
    phone:        '',
    bio:          '',
    address:      '',
    dateOfBirth:  '',
    experience:   '',
    languages:    '',
    specialities: '',
    dailyRate:    '',
  })

  // ── validation ─────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.phone.trim())   e.phone       = 'Phone number is required'
    if (!form.bio.trim())     e.bio         = 'Bio is required'
    if (!form.address.trim()) e.address     = 'Address is required'
    if (!form.dateOfBirth)    e.dateOfBirth = 'Date of birth is required'
    if (!form.dailyRate)      e.dailyRate   = 'Daily rate is required'
    if (!docs['NidFront'])    e.NidFront    = 'NID front photo is required'
    if (!docs['NidBack'])     e.NidBack     = 'NID back photo is required'
    if (!docs['DobCert'])     e.DobCert     = 'Birth certificate is required'
    if (!docs['Photo'])       e.Photo       = 'Profile photo is required'
    return e
  }

  const clearError = (field) =>
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })

  // ── doc select ─────────────────────────────────────────
  const handleDocSelect = (docType, file) => {
    if (!file) return
    setDocs(p => ({ ...p, [docType]: file }))
    setUploaded(p => ({ ...p, [docType]: false }))
    clearError(docType)
  }

  const removeDoc = (docType) => {
    setDocs(p => { const n = { ...p }; delete n[docType]; return n })
    setUploaded(p => { const n = { ...p }; delete n[docType]; return n })
    setUploadedUrls(p => { const n = { ...p }; delete n[docType]; return n })
  }

  // ── upload single doc ──────────────────────────────────
  const uploadDoc = async (docType) => {
    const file = docs[docType]
    if (!file) return null
    if (uploaded[docType]) return uploadedUrls[docType]

    setUploading(p => ({ ...p, [docType]: true }))
    try {
      const backendType = DOC_TYPE_MAP[docType]
      const res = await guideApi.uploadDocument(file, backendType)
      const url = res.data?.url
      setUploadedUrls(p => ({ ...p, [docType]: url }))
      setUploaded(p => ({ ...p, [docType]: true }))
      return url
    } catch (err) {
      const msg = err?.response?.data?.errors?.message || 'Upload failed'
      toast.error(`${docType}: ${msg}`)
      return null
    } finally {
      setUploading(p => ({ ...p, [docType]: false }))
    }
  }

  // ── submit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      const firstId = Object.keys(clientErrors)[0]
      document.getElementById(firstId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      toast.error('Please fix the errors below')
      return
    }

    setErrors({})
    setLoading(true)

    try {
      // 1. upload all docs
      const nidFrontUrl = await uploadDoc('NidFront')
      const nidBackUrl  = await uploadDoc('NidBack')
      const dobUrl      = await uploadDoc('DobCert')
      const photoUrl    = await uploadDoc('Photo')
      const certUrl     = await uploadDoc('Certificate')

      if (!nidFrontUrl || !nidBackUrl || !dobUrl || !photoUrl) {
        setLoading(false)
        return
      }

      // 2. submit application
      const payload = {
        userId:                 form.userId,
        fullName:               form.fullName,
        phoneNumber:            form.phone,
        bio:                    form.bio,
        address:                form.address,
        dateOfBirth:            form.dateOfBirth,
        experienceYears:        parseInt(form.experience) || 0,
        languages:              form.languages.split(',').map(l => l.trim()).filter(Boolean),
        specialities:           form.specialities.split(',').map(s => s.trim()).filter(Boolean),
        operatingDistrictIds:   [1],
        dailyRate:              parseFloat(form.dailyRate),
        nidFrontPhotoUrl:       nidFrontUrl,
        nidBackPhotoUrl:        nidBackUrl,
        dobCertificatePhotoUrl: dobUrl,
        profilePhotoUrl:        photoUrl,
        certificateUrl:         certUrl || null,
      }

      await guideApi.apply(payload)
      toast.success('🎉 Application submitted! We will review it within 3-5 business days.')
      navigate('/')

    } catch (err) {
      const data = err?.response?.data

      // ✅ already applied — friendly message
      if (data?.errors?.Application) {
        toast.success('Your application is already under review. We will notify you soon!')
        navigate('/')
        return
      }

      const apiErrors = parseApiErrors(err)
      if (apiErrors.general) {
        toast.error(apiErrors.general)
      } else {
        setErrors(apiErrors)
        const firstKey = Object.keys(apiErrors)[0]
        document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        toast.error('Please fix the errors below')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field) =>
    `input ${errors[field] ? 'border-red-400 focus:ring-red-400' : ''}`

  // ── render ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* header */}
      <div className="bg-gradient-to-r from-primary-600 to-teal-500 rounded-3xl p-6 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <UserCheck size={28} />
          <h1 className="text-2xl font-black">Become a Tour Guide</h1>
        </div>
        <p className="text-white/80 text-sm">
          Share your knowledge of Bangladesh with travelers. Apply to become a verified guide.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* ── Personal info ── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Personal info
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                className="input opacity-70 cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                value={form.phone}
                placeholder="01XXXXXXXXX"
                onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); clearError('phone') }}
                className={inputCls('phone')}
              />
              <FieldError msg={errors.phone} />
            </div>
          </div>

          {/* address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              value={form.address}
              placeholder="Your full address"
              onChange={e => { setForm(p => ({ ...p, address: e.target.value })); clearError('address') }}
              className={inputCls('address')}
            />
            <FieldError msg={errors.address} />
          </div>

          {/* dateOfBirth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={e => { setForm(p => ({ ...p, dateOfBirth: e.target.value })); clearError('dateOfBirth') }}
              className={inputCls('dateOfBirth')}
            />
            <FieldError msg={errors.dateOfBirth} />
          </div>

          {/* bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              id="bio"
              value={form.bio}
              rows={3}
              placeholder="Tell travelers about yourself and your expertise…"
              onChange={e => { setForm(p => ({ ...p, bio: e.target.value })); clearError('bio') }}
              className={`${inputCls('bio')} resize-none`}
            />
            <FieldError msg={errors.bio} />
          </div>
        </div>

        {/* ── Guide details ── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Guide details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Daily rate (BDT) <span className="text-red-500">*</span>
              </label>
              <input
                id="dailyRate"
                type="number"
                min={0}
                value={form.dailyRate}
                placeholder="e.g. 2000"
                onChange={e => { setForm(p => ({ ...p, dailyRate: e.target.value })); clearError('dailyRate') }}
                className={inputCls('dailyRate')}
              />
              <FieldError msg={errors.dailyRate} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of experience
              </label>
              <input
                type="number"
                min={0}
                value={form.experience}
                placeholder="0"
                onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          {/* languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Languages spoken{' '}
              <span className="text-gray-400 font-normal">(comma separated)</span>
            </label>
            <input
              value={form.languages}
              placeholder="Bengali, English, Hindi"
              onChange={e => setForm(p => ({ ...p, languages: e.target.value }))}
              className="input"
            />
          </div>

          {/* specialities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialities{' '}
              <span className="text-gray-400 font-normal">(comma separated)</span>
            </label>
            <input
              value={form.specialities}
              placeholder="History, Nature, Food"
              onChange={e => setForm(p => ({ ...p, specialities: e.target.value }))}
              className="input"
            />
          </div>
        </div>

        {/* ── Documents ── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Documents
          </h2>
          <p className="text-xs text-gray-400">
            Accepted formats: JPG, PNG, PDF — max 5 MB each
          </p>

          {DOC_TYPES.map(dt => (
            <div key={dt.key} id={dt.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {dt.icon} {dt.label}
                {dt.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              <div className="flex items-center gap-3">
                <label className={`flex-1 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors flex items-center gap-2 ${
                  errors[dt.key]
                    ? 'border-red-300 bg-red-50'
                    : docs[dt.key]
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                }`}>
                  <Upload size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600 truncate flex-1">
                    {docs[dt.key] ? docs[dt.key].name : 'Choose file…'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.pdf"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleDocSelect(dt.key, e.target.files[0])}
                  />
                </label>

                {/* remove */}
                {docs[dt.key] && !uploading[dt.key] && (
                  <button type="button" onClick={() => removeDoc(dt.key)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                )}

                {/* spinner */}
                {uploading[dt.key] && (
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0" />
                )}

                {/* success */}
                {uploaded[dt.key] && !uploading[dt.key] && (
                  <span className="text-xs text-green-600 font-semibold shrink-0 flex items-center gap-1">
                    ✓ Uploaded
                  </span>
                )}
              </div>

              <FieldError msg={errors[dt.key]} />
            </div>
          ))}
        </div>

        {/* ── Global server error ── */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {errors.general}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <UserCheck size={18} /> Submit application
            </>
          )}
        </button>

      </form>
    </div>
  )
}