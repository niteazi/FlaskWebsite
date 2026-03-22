import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getVaccineByName } from '../lib/firebase'

function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [technologies, setTechnologies] = useState([])
  const [error, setError] = useState('')
  const [vaccineData, setVaccineData] = useState(null)
  const [vaccineLoading, setVaccineLoading] = useState(true)
  const treeHistory = location.state?.treeHistory || []
  const treeAnswers = location.state?.treeAnswers || {}
  const finalNode = location.state?.finalNode || null
  const vaccineEntry = treeHistory.find((entry) => /vaccine/i.test(entry.key) || entry.inputType === 'vaccine')
  const preferredVaccine = vaccineEntry?.value || 'Not selected'

  useEffect(() => {
    const loadVaccineData = async () => {
      setVaccineLoading(true)
      const data = await getVaccineByName(preferredVaccine)
      setVaccineData(data)
      setVaccineLoading(false)
    }

    if (preferredVaccine && preferredVaccine !== 'Not selected') {
      loadVaccineData()
    } else {
      setVaccineLoading(false)
    }
  }, [preferredVaccine])

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
    <main className="nhs-page" style={{ maxWidth: 900 }}>
      <h1>Decision Result</h1>

      {finalNode?.prompt ? (
        <p style={{ padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <strong>Outcome:</strong> {finalNode.prompt}
        </p>
      ) : null}

      <h2 style={{ marginTop: 20 }}>Your Path</h2>
      {treeHistory.length === 0 ? (
        <p>No submitted values found.</p>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {treeHistory.map((entry, index) => (
            <li key={`${entry.key}-${index}`} style={{ marginBottom: 8 }}>
              <strong>{entry.label}:</strong> {entry.value}
            </li>
          ))}
        </ul>
      )}

      <details style={{ marginTop: 8 }}>
        <summary>Debug answers</summary>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(treeAnswers, null, 2)}</pre>
      </details>

      <h2 style={{ marginTop: 24 }}>Selected Vaccine Information</h2>
      {vaccineLoading ? (
        <p>Loading vaccine details...</p>
      ) : vaccineData ? (
        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
          <p><strong>Vaccine Name:</strong> {vaccineData.name || 'N/A'}</p>
          {vaccineData.data && <p><strong>Type:</strong> {vaccineData.data}</p>}
          {vaccineData.id && <p><strong>ID:</strong> {vaccineData.id}</p>}
          {Object.entries(vaccineData).map(([key, value]) => {
            if (key !== 'id' && key !== 'name' && key !== 'data' && typeof value === 'string') {
              return (
                <p key={key}>
                  <strong>{key}:</strong> {value}
                </p>
              )
            }
            return null
          })}
        </div>
      ) : (
        <p>No vaccine information found for {preferredVaccine}.</p>
      )}

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
