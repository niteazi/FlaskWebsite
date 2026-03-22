import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [technologies, setTechnologies] = useState([])
  const [error, setError] = useState('')

  const name = location.state?.name || 'Guest'
  const postcode = location.state?.postcode || 'Not provided'
  const email = location.state?.email || 'Not provided'
  const city = location.state?.city || 'Not provided'
  const country = location.state?.country || 'Not provided'
  const preferredVaccine = location.state?.preferredVaccine || 'Not selected'
  const firebaseSyncEnabled = location.state?.firebaseSyncEnabled ? 'Enabled' : 'Disabled'

  useEffect(() => {
    const loadTechnologies = async () => {
      try {
        const response = await fetch('/api/technologies')
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()
        setTechnologies(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    }

    loadTechnologies()
  }, [])

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      <h1>Next Page</h1>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Postcode:</strong> {postcode}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Location:</strong> {city}, {country}</p>
      <p><strong>Vaccine preference:</strong> {preferredVaccine}</p>
      <p><strong>Firebase sync:</strong> {firebaseSyncEnabled}</p>

      <h2 style={{ marginTop: 24 }}>Technologies</h2>
      {error ? (
        <p style={{ color: 'crimson' }}>Error: {error}</p>
      ) : (
        <ul>
          {technologies.map((tech, index) => (
            <li key={`${tech.name}-${index}`} style={{ marginBottom: 12 }}>
              <strong>{tech.name}</strong>
              <br />
              <span>{tech.description}</span>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => navigate('/')} style={{ marginTop: 16, padding: '10px 14px' }}>
        Back to Form
      </button>
    </main>
  )
}

export default ResultsPage
