import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { guideApi } from '../../api/guide.api'

const initialForm = {
  fullName: '',
  phoneNumber: '',
  address: '',
  bio: '',
  dateOfBirth: '',
  experienceYears: '',
  languages: '',     // comma separated
  specialities: '',  // comma separated
  operatingDistrictIds: '', // comma separated numbers
}

export default function ApplyGuidePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [nidFront, setNidFront] = useState(null)
  const [nidBack, setNidBack] = useState(null)
  const [dobCertificate, setDobCertificate] = useState(null)
  const [certificate, setCertificate] = useState(null) // optional
  const [loading, setLoading] = useState(false)
  const [uploadStep, setUploadStep] = useState('') // user কে progress দেখানোর জন্য

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateFiles = () => {
    if (!profilePhoto) return 'Profile photo is required'
    if (!nidFront) return 'NID front photo is required'
    if (!nidBack) return 'NID back photo is required'
    if (!dobCertificate) return 'Date of birth certificate is required'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const fileError = validateFiles()
    if (fileError) return toast.error(fileError)

    setLoading(true)
    try {
      // ১. সব ফাইল sequentially আপলোড করে URL সংগ্রহ
      setUploadStep('Uploading profile photo...')
const profilePhotoUrl = await guideApi.uploadDocument(profilePhoto, 'profile-photo')

setUploadStep('Uploading NID front...')
const nidFrontPhotoUrl = await guideApi.uploadDocument(nidFront, 'nid-front')

setUploadStep('Uploading NID back...')
const nidBackPhotoUrl = await guideApi.uploadDocument(nidBack, 'nid-back')

setUploadStep('Uploading DOB certificate...')
const dobCertificatePhotoUrl = await guideApi.uploadDocument(dobCertificate, 'dob-certificate')

let certificateUrl = null
if (certificate) {
  setUploadStep('Uploading certificate...')
  certificateUrl = await guideApi.uploadDocument(certificate, 'certificate')
}

      // ২. Apply command পাঠানো — backend field name অনুযায়ী exact keys
      setUploadStep('Submitting application...')
      const payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        profilePhotoUrl,
        address: form.address,
        bio: form.bio,
        dateOfBirth: form.dateOfBirth, // yyyy-MM-dd input থেকেই ঠিক ফরম্যাটে আসবে
        nidFrontPhotoUrl,
        nidBackPhotoUrl,
        dobCertificatePhotoUrl,
        experienceYears: Number(form.experienceYears),
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        specialities: form.specialities.split(',').map((s) => s.trim()).filter(Boolean),
        operatingDistrictIds: form.operatingDistrictIds
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !Number.isNaN(n)),
        certificateUrl,
      }

      await guideApi.apply(payload)
      toast.success('Application submitted successfully!')
      navigate('/profile')
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || 'Failed to submit application')
    } finally {
      setLoading(false)
      setUploadStep('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Apply to Become a Tour Guide</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input name="address" value={form.address} onChange={handleChange} required
            className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} required rows={4}
            className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Experience (years)</label>
            <input type="number" name="experienceYears" value={form.experienceYears} onChange={handleChange} required min={0}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Languages (comma separated)</label>
          <input name="languages" value={form.languages} onChange={handleChange} placeholder="Bangla, English" required
            className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Specialities (comma separated)</label>
          <input name="specialities" value={form.specialities} onChange={handleChange} placeholder="Hiking, Historical Sites" required
            className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Operating District IDs (comma separated)</label>
          <input name="operatingDistrictIds" value={form.operatingDistrictIds} onChange={handleChange} placeholder="1, 4, 7" required
            className="w-full border rounded-lg px-3 py-2" />
        </div>

        <hr />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Profile Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Certificate (optional)</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setCertificate(e.target.files[0])}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">NID Front Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setNidFront(e.target.files[0])}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NID Back Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setNidBack(e.target.files[0])}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth Certificate</label>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setDobCertificate(e.target.files[0])}
            className="w-full border rounded-lg px-3 py-2" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? uploadStep || 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}