import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { guideApi } from '../../api/guide.api'
import {
  User, Phone, MapPin, FileText, Briefcase,
  Globe, Star, Upload, ChevronRight, ChevronLeft,
  CheckCircle, Camera, CreditCard, Award
} from 'lucide-react'

var inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white'
var labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'

var STEPS = ['Personal Info', 'Professional', 'Documents', 'Review']

function StepIndicator(props) {
  var current = props.current
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map(function(label, idx) {
        var done = idx < current
        var active = idx === current
        var circleCls = done
          ? 'w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold'
          : active
          ? 'w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-primary-100'
          : 'w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold'
        var textCls = (done || active) ? 'text-xs font-medium text-primary-600' : 'text-xs text-gray-400'
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={circleCls}>
                {done ? <CheckCircle size={14} /> : idx + 1}
              </div>
              <span className={textCls}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={['w-12 h-0.5 mb-4 mx-1', done ? 'bg-primary-400' : 'bg-gray-200'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FileUploadBox(props) {
  var label = props.label
  var required = props.required
  var accept = props.accept
  var file = props.file
  var onChange = props.onChange
  var hint = props.hint

  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <label className={[
        'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors',
        file ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
      ].join(' ')}>
        <input type="file" accept={accept} className="hidden" onChange={onChange} />
        {file ? (
          <div className="text-center">
            <CheckCircle size={24} className="mx-auto text-primary-600 mb-1" />
            <p className="text-sm font-medium text-primary-700 truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-primary-400 mt-0.5">Click to change</p>
          </div>
        ) : (
          <div className="text-center">
            <Upload size={24} className="mx-auto text-gray-300 mb-1" />
            <p className="text-sm text-gray-500">Click to upload</p>
            {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
          </div>
        )}
      </label>
    </div>
  )
}

function ReviewRow(props) {
  var label = props.label
  var value = props.value
  return (
    <div className="flex justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value || '—'}</span>
    </div>
  )
}

export default function ApplyGuidePage() {
  var navigate = useNavigate()
  var [step, setStep] = useState(0)
  var [loading, setLoading] = useState(false)
  var [uploadStep, setUploadStep] = useState('')

  // ── doc type toggle: 'nid' | 'dob'
  var [docType, setDocType] = useState('nid')

  var [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    bio: '',
    dateOfBirth: '',
    experienceYears: '',
    languages: '',
    specialities: '',
    operatingDistrictIds: '',
  })

  var [profilePhoto, setProfilePhoto] = useState(null)
  var [nidFront, setNidFront] = useState(null)
  var [nidBack, setNidBack] = useState(null)
  var [dobCertificate, setDobCertificate] = useState(null)
  var [certificate, setCertificate] = useState(null)

  function handleChange(e) {
    var name = e.target.name
    var value = e.target.value
    setForm(function(prev) {
      var next = Object.assign({}, prev)
      next[name] = value
      return next
    })
  }

  function validateStep() {
    if (step === 0) {
      if (!form.fullName.trim()) return 'Full name is required'
      if (!form.phoneNumber.trim()) return 'Phone number is required'
      if (!form.address.trim()) return 'Address is required'
      if (!form.bio.trim()) return 'Bio is required'
      if (!form.dateOfBirth) return 'Date of birth is required'
    }
    if (step === 1) {
      if (!form.experienceYears && form.experienceYears !== 0) return 'Experience is required'
      if (!form.languages.trim()) return 'At least one language is required'
      if (!form.operatingDistrictIds.trim()) return 'At least one district ID is required'
    }
    if (step === 2) {
      if (!profilePhoto) return 'Profile photo is required'
      if (docType === 'nid') {
        if (!nidFront) return 'NID front photo is required'
        if (!nidBack) return 'NID back photo is required'
      } else {
        if (!dobCertificate) return 'Date of birth certificate is required'
      }
    }
    return null
  }

  function nextStep() {
    var err = validateStep()
    if (err) { toast.error(err); return }
    setStep(function(s) { return s + 1 })
    window.scrollTo(0, 0)
  }

  function prevStep() {
    setStep(function(s) { return s - 1 })
    window.scrollTo(0, 0)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      setUploadStep('Uploading profile photo...')
      var profilePhotoUrl = await guideApi.uploadDocument(profilePhoto, 'profile-photo')

      var nidFrontPhotoUrl = null
      var nidBackPhotoUrl = null
      var dobCertificatePhotoUrl = null

      if (docType === 'nid') {
        setUploadStep('Uploading NID front...')
        nidFrontPhotoUrl = await guideApi.uploadDocument(nidFront, 'nid-front')
        setUploadStep('Uploading NID back...')
        nidBackPhotoUrl = await guideApi.uploadDocument(nidBack, 'nid-back')
      } else {
        setUploadStep('Uploading DOB certificate...')
        dobCertificatePhotoUrl = await guideApi.uploadDocument(dobCertificate, 'dob-certificate')
      }

      var certificateUrl = null
      if (certificate) {
        setUploadStep('Uploading guide certificate...')
        certificateUrl = await guideApi.uploadDocument(certificate, 'certificate')
      }

      setUploadStep('Submitting application...')
      var payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        profilePhotoUrl: profilePhotoUrl,
        address: form.address,
        bio: form.bio,
        dateOfBirth: form.dateOfBirth,
        nidFrontPhotoUrl: nidFrontPhotoUrl,
        nidBackPhotoUrl: nidBackPhotoUrl,
        dobCertificatePhotoUrl: dobCertificatePhotoUrl,
        experienceYears: Number(form.experienceYears),
        languages: form.languages.split(',').map(function(s) { return s.trim() }).filter(Boolean),
        specialities: form.specialities.split(',').map(function(s) { return s.trim() }).filter(Boolean),
        operatingDistrictIds: form.operatingDistrictIds
          .split(',')
          .map(function(s) { return Number(s.trim()) })
          .filter(function(n) { return !isNaN(n) && n > 0 }),
        certificateUrl: certificateUrl,
      }

      await guideApi.apply(payload)
      toast.success('Application submitted successfully!')
      navigate('/profile')
    } catch (err) {
      var msg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : err.response && err.response.data && err.response.data.detail
        ? err.response.data.detail
        : 'Failed to submit application'
      toast.error(msg)
    } finally {
      setLoading(false)
      setUploadStep('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
          <Award size={28} className="text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Become a Tour Guide</h1>
        <p className="text-sm text-gray-400 mt-1">Complete the form to apply as a verified guide</p>
      </div>

      <StepIndicator current={step} />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

        {/* ── Step 0: Personal Info ── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-primary-600" /> Personal Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                <input name="fullName" value={form.fullName} onChange={handleChange} required
                  placeholder="Your full name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone Number <span className="text-red-500">*</span></label>
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required
                  placeholder="+880..." className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Address <span className="text-red-500">*</span></label>
              <input name="address" value={form.address} onChange={handleChange} required
                placeholder="Your full address" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Bio <span className="text-red-500">*</span></label>
              <textarea name="bio" value={form.bio} onChange={handleChange} required rows={4}
                maxLength={1000}
                placeholder="Tell travelers about yourself, your experience, and what makes you special..."
                className={inputCls} />
              <p className="text-xs text-gray-300 text-right mt-1">{form.bio.length}/1000</p>
            </div>

            <div>
              <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange}
                required className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">You must be at least 18 years old</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Professional ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-primary-600" /> Professional Details
            </h2>

            <div>
              <label className={labelCls}>Experience (years) <span className="text-red-500">*</span></label>
              <input type="number" name="experienceYears" value={form.experienceYears}
                onChange={handleChange} required min={0} max={50}
                placeholder="e.g. 5" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Languages <span className="text-red-500">*</span></label>
              <input name="languages" value={form.languages} onChange={handleChange}
                placeholder="Bangla, English, Hindi" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Comma separated</p>
            </div>

            <div>
              <label className={labelCls}>Specialities</label>
              <input name="specialities" value={form.specialities} onChange={handleChange}
                placeholder="Hiking, Historical Sites, Wildlife" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Comma separated</p>
            </div>

            <div>
              <label className={labelCls}>Operating District IDs <span className="text-red-500">*</span></label>
              <input name="operatingDistrictIds" value={form.operatingDistrictIds}
                onChange={handleChange} placeholder="e.g. 1, 4, 7" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Comma separated district IDs</p>
            </div>
          </div>
        )}

        {/* ── Step 2: Documents ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-primary-600" /> Documents
            </h2>

            {/* Profile photo */}
            <FileUploadBox
              label="Profile Photo"
              required
              accept="image/*"
              file={profilePhoto}
              hint="JPG, PNG (max 5MB)"
              onChange={function(e) { setProfilePhoto(e.target.files[0]) }}
            />

            {/* Doc type toggle */}
            <div>
              <label className={labelCls}>Verification Document <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={function() { setDocType('nid') }}
                  className={[
                    'border-2 rounded-xl p-3 text-sm font-medium transition-colors',
                    docType === 'nid'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  ].join(' ')}
                >
                  <CreditCard size={18} className="mx-auto mb-1" />
                  NID Card
                </button>
                <button
                  type="button"
                  onClick={function() { setDocType('dob') }}
                  className={[
                    'border-2 rounded-xl p-3 text-sm font-medium transition-colors',
                    docType === 'dob'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  ].join(' ')}
                >
                  <FileText size={18} className="mx-auto mb-1" />
                  Birth Certificate
                </button>
              </div>

              {docType === 'nid' && (
                <div className="grid grid-cols-2 gap-4">
                  <FileUploadBox
                    label="NID Front"
                    required
                    accept="image/*"
                    file={nidFront}
                    hint="Clear photo of front side"
                    onChange={function(e) { setNidFront(e.target.files[0]) }}
                  />
                  <FileUploadBox
                    label="NID Back"
                    required
                    accept="image/*"
                    file={nidBack}
                    hint="Clear photo of back side"
                    onChange={function(e) { setNidBack(e.target.files[0]) }}
                  />
                </div>
              )}

              {docType === 'dob' && (
                <FileUploadBox
                  label="Date of Birth Certificate"
                  required
                  accept="image/*,application/pdf"
                  file={dobCertificate}
                  hint="JPG, PNG or PDF"
                  onChange={function(e) { setDobCertificate(e.target.files[0]) }}
                />
              )}
            </div>

            {/* Optional certificate */}
            <FileUploadBox
              label="Guide Certificate (optional)"
              accept="image/*,application/pdf"
              file={certificate}
              hint="Any tourism or guide certification"
              onChange={function(e) { setCertificate(e.target.files[0]) }}
            />
          </div>
        )}

        {/* ── Step 3: Review & Submit ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-primary-600" /> Review Your Application
            </h2>

            <div className="space-y-1">
              <ReviewRow label="Full Name"    value={form.fullName} />
              <ReviewRow label="Phone"        value={form.phoneNumber} />
              <ReviewRow label="Address"      value={form.address} />
              <ReviewRow label="Date of Birth" value={form.dateOfBirth} />
              <ReviewRow label="Experience"   value={form.experienceYears + ' years'} />
              <ReviewRow label="Languages"    value={form.languages} />
              <ReviewRow label="Specialities" value={form.specialities || '—'} />
              <ReviewRow label="Districts"    value={form.operatingDistrictIds} />
              <ReviewRow label="Doc Type"     value={docType === 'nid' ? 'NID Card' : 'Birth Certificate'} />
              <ReviewRow label="Profile Photo"  value={profilePhoto ? profilePhoto.name : '—'} />
              {docType === 'nid' && (
                <>
                  <ReviewRow label="NID Front" value={nidFront ? nidFront.name : '—'} />
                  <ReviewRow label="NID Back"  value={nidBack ? nidBack.name : '—'} />
                </>
              )}
              {docType === 'dob' && (
                <ReviewRow label="Birth Cert" value={dobCertificate ? dobCertificate.name : '—'} />
              )}
              {certificate && (
                <ReviewRow label="Certificate" value={certificate.name} />
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 mt-2">
              Your application will be reviewed by our admin team within 2-3 business days.
              You will receive a notification once it is processed.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50">
          {step > 0 && (
            <button
              type="button"
              onClick={prevStep}
              disabled={loading}
              className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              <ChevronLeft size={15} /> Back
            </button>
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 bg-primary-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-1"
            >
              Next <ChevronRight size={15} />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? uploadStep || 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}