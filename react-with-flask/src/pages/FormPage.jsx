import { useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasFirebaseConfig, saveFormSubmission, upsertFormDraft } from '../lib/firebase'

function FormPage() {
  const navigate = useNavigate()
  const reactId = useId()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [saveStatus, setSaveStatus] = useState('')
  const [firebaseSyncEnabled, setFirebaseSyncEnabled] = useState(hasFirebaseConfig)
  const sessionId = useMemo(() => `session-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [reactId])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    postcode: '',
    city: '',
    country: '',
    preferredVaccine: '',
    contactByEmail: true,
    consent: false,
  })

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const validateStep = (stepToValidate) => {
    const nextErrors = {}

    if (stepToValidate === 1) {
      if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required.'
      if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required.'
      if (!formData.email.trim()) {
        nextErrors.email = 'Email is required.'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        nextErrors.email = 'Please enter a valid email address.'
      }
    }

    if (stepToValidate === 2) {
      if (!formData.postcode.trim()) nextErrors.postcode = 'Postcode is required.'
      if (!formData.city.trim()) nextErrors.city = 'City is required.'
      if (!formData.country.trim()) nextErrors.country = 'Country is required.'
    }

    if (stepToValidate === 3) {
      if (!formData.preferredVaccine.trim()) nextErrors.preferredVaccine = 'Select a vaccine preference.'
      if (!formData.consent) nextErrors.consent = 'You need to accept consent to continue.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const nextStep = () => {
    if (!validateStep(step)) return
    setStep((previous) => Math.min(previous + 1, 3))
  }

  const previousStep = () => {
    setErrors({})
    setStep((previous) => Math.max(previous - 1, 1))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!validateStep(3)) return

    const payload = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      postcode: formData.postcode.trim(),
      city: formData.city.trim(),
      country: formData.country.trim(),
      preferredVaccine: formData.preferredVaccine.trim(),
    }

    if (firebaseSyncEnabled) {
      saveFormSubmission(sessionId, payload)
        .then(() => {
          setSaveStatus('Form submitted to Firebase.')
        })
        .catch(() => {
          setSaveStatus('Unable to submit to Firebase. Continuing locally.')
        })
    }

    navigate('/results', {
      state: {
        ...payload,
        name: `${payload.firstName} ${payload.lastName}`.trim(),
        firebaseSyncEnabled,
        sessionId,
      },
    })
  }

  useEffect(() => {
    if (!firebaseSyncEnabled) {
      return undefined
    }

    if (!hasFirebaseConfig) {
      return undefined
    }

    const timeout = setTimeout(() => {
      upsertFormDraft(sessionId, {
        ...formData,
        currentStep: step,
      })
        .then(() => {
          setSaveStatus('Draft saved live to Firebase.')
        })
        .catch(() => {
          setSaveStatus('Live save failed. Check Firebase credentials and network.')
        })
    }, 700)

    return () => {
      clearTimeout(timeout)
    }
  }, [firebaseSyncEnabled, formData, sessionId, step])

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px' }}>
      <h1>FindMyJabs</h1>
      <p>Step {step} of 3. Complete each section to continue.</p>
      <p style={{ marginTop: 8, color: '#52525b' }}>
        {hasFirebaseConfig
          ? `Firebase live sync is ${firebaseSyncEnabled ? 'enabled' : 'disabled'}.`
          : 'Firebase is not configured yet. Form works locally and can be connected later.'}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
        {step === 1 && (
          <>
            <label htmlFor="firstName" style={{ display: 'grid', gap: 6 }}>
              First name
              <input
                id="firstName"
                value={formData.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                placeholder="Jane"
                style={{ padding: 10 }}
              />
              {errors.firstName && <span style={{ color: 'crimson' }}>{errors.firstName}</span>}
            </label>

            <label htmlFor="lastName" style={{ display: 'grid', gap: 6 }}>
              Last name
              <input
                id="lastName"
                value={formData.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                placeholder="Doe"
                style={{ padding: 10 }}
              />
              {errors.lastName && <span style={{ color: 'crimson' }}>{errors.lastName}</span>}
            </label>

            <label htmlFor="email" style={{ display: 'grid', gap: 6 }}>
              Email
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="jane@example.com"
                style={{ padding: 10 }}
              />
              {errors.email && <span style={{ color: 'crimson' }}>{errors.email}</span>}
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <label htmlFor="postcode" style={{ display: 'grid', gap: 6 }}>
              Postcode
              <input
                id="postcode"
                value={formData.postcode}
                onChange={(event) => updateField('postcode', event.target.value)}
                placeholder="SW1A 1AA"
                style={{ padding: 10 }}
              />
              {errors.postcode && <span style={{ color: 'crimson' }}>{errors.postcode}</span>}
            </label>

            <label htmlFor="city" style={{ display: 'grid', gap: 6 }}>
              City
              <input
                id="city"
                value={formData.city}
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="London"
                style={{ padding: 10 }}
              />
              {errors.city && <span style={{ color: 'crimson' }}>{errors.city}</span>}
            </label>

            <label htmlFor="country" style={{ display: 'grid', gap: 6 }}>
              Country
              <input
                id="country"
                value={formData.country}
                onChange={(event) => updateField('country', event.target.value)}
                placeholder="United Kingdom"
                style={{ padding: 10 }}
              />
              {errors.country && <span style={{ color: 'crimson' }}>{errors.country}</span>}
            </label>
          </>
        )}

        {step === 3 && (
          <>
            <label htmlFor="preferredVaccine" style={{ display: 'grid', gap: 6 }}>
              Preferred vaccine
              <select
                id="preferredVaccine"
                value={formData.preferredVaccine}
                onChange={(event) => updateField('preferredVaccine', event.target.value)}
                style={{ padding: 10 }}
              >
                <option value="">Select one</option>
                <option value="Pfizer">Pfizer</option>
                <option value="Moderna">Moderna</option>
                <option value="No preference">No preference</option>
              </select>
              {errors.preferredVaccine && <span style={{ color: 'crimson' }}>{errors.preferredVaccine}</span>}
            </label>

            <label htmlFor="contactByEmail" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="contactByEmail"
                type="checkbox"
                checked={formData.contactByEmail}
                onChange={(event) => updateField('contactByEmail', event.target.checked)}
              />
              Contact me by email
            </label>

            <label htmlFor="consent" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="consent"
                type="checkbox"
                checked={formData.consent}
                onChange={(event) => updateField('consent', event.target.checked)}
              />
              I agree that this information can be used to process my request.
            </label>
            {errors.consent && <span style={{ color: 'crimson' }}>{errors.consent}</span>}
          </>
        )}

        <label htmlFor="firebaseSyncEnabled" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            id="firebaseSyncEnabled"
            type="checkbox"
            checked={firebaseSyncEnabled}
            onChange={(event) => setFirebaseSyncEnabled(event.target.checked)}
            disabled={!hasFirebaseConfig}
          />
          Enable live Firebase sync
        </label>

        <p style={{ minHeight: 24, color: '#52525b' }}>{saveStatus}</p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={previousStep}
            disabled={step === 1}
            style={{ width: 160, padding: '10px 14px' }}
          >
            Previous
          </button>

          {step < 3 ? (
            <button type="button" onClick={nextStep} style={{ width: 160, padding: '10px 14px' }}>
              Next
            </button>
          ) : (
            <button type="submit" style={{ width: 200, padding: '10px 14px' }}>
              Submit form
            </button>
          )}
        </div>
      </form>
    </main>
  )
}

export default FormPage
