import { useEffect, useState } from 'react'
import { addVaccine, deleteVaccineById, getAllVaccines, hasFirebaseConfig, updateVaccine } from '../lib/firebase'

export function VaccinesManager({ embedded = false }) {
  const [vaccines, setVaccines] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [newVaccine, setNewVaccine] = useState({ name: '', data: '', description: '' })

  const loadVaccines = async () => {
    if (!hasFirebaseConfig) {
      setLoading(false)
      return
    }

    try {
      const vaccineList = await getAllVaccines()
      setVaccines(vaccineList)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load vaccines')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVaccines()
  }, [])

  const handleUpdateVaccine = async (id, payload) => {
    try {
      await updateVaccine(id, payload)
      setStatus('Vaccine updated.')
      await loadVaccines()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update vaccine')
    }
  }

  const handleDeleteVaccine = async (id) => {
    try {
      await deleteVaccineById(id)
      setStatus('Vaccine deleted.')
      await loadVaccines()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete vaccine')
    }
  }

  const handleAddVaccine = async () => {
    if (!newVaccine.name.trim()) {
      setStatus('Vaccine name is required.')
      return
    }

    try {
      await addVaccine(newVaccine)
      setNewVaccine({ name: '', data: '', description: '' })
      setStatus('Vaccine added.')
      await loadVaccines()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to add vaccine')
    }
  }

  if (!hasFirebaseConfig) {
    if (embedded) {
      return <p>Firebase is not configured. Add VITE_FIREBASE_* values to continue.</p>
    }

    return (
      <main className="nhs-page" style={{ maxWidth: 1100 }}>
        <h1>Vaccines</h1>
        <p>Firebase is not configured. Add VITE_FIREBASE_* values to continue.</p>
      </main>
    )
  }

  return (
    <>
      {status && <p style={{ color: '#0f766e' }}>{status}</p>}

      {loading ? (
        <p>Loading vaccines...</p>
      ) : (
        <section style={{ marginTop: embedded ? 0 : 20, border: '1px solid #d4d4d8', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Add vaccine</h2>
            <input
              placeholder="Name"
              value={newVaccine.name}
              onChange={(event) => setNewVaccine((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              placeholder="Type / data"
              value={newVaccine.data}
              onChange={(event) => setNewVaccine((prev) => ({ ...prev, data: event.target.value }))}
            />
            <textarea
              placeholder="Description"
              value={newVaccine.description}
              onChange={(event) => setNewVaccine((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
            />
            <button type="button" onClick={handleAddVaccine} style={{ width: 160, padding: '10px 14px' }}>
              Add vaccine
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {vaccines.map((vaccine) => (
              <VaccineEditor key={vaccine.id} vaccine={vaccine} onSave={handleUpdateVaccine} onDelete={handleDeleteVaccine} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function VaccinesPage() {
  return (
    <main className="nhs-page" style={{ maxWidth: 1100 }}>
      <h1>Vaccines</h1>
      <p>Manage vaccine records.</p>
      <VaccinesManager />
    </main>
  )
}

function VaccineEditor({ vaccine, onSave, onDelete }) {
  const [draft, setDraft] = useState({
    name: vaccine.name || '',
    data: vaccine.data || '',
    description: vaccine.description || '',
  })

  useEffect(() => {
    setDraft({
      name: vaccine.name || '',
      data: vaccine.data || '',
      description: vaccine.description || '',
    })
  }, [vaccine])

  return (
    <article style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: 12 }}>
      <p style={{ margin: '0 0 8px 0', color: '#52525b', fontSize: 12 }}>ID: {vaccine.id}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        <input
          value={draft.name}
          placeholder="Name"
          onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          value={draft.data}
          placeholder="Type / data"
          onChange={(event) => setDraft((prev) => ({ ...prev, data: event.target.value }))}
        />
        <textarea
          rows={3}
          value={draft.description}
          placeholder="Description"
          onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => onSave(vaccine.id, draft)} style={{ padding: '8px 12px' }}>
            Save
          </button>
          <button
            type="button"
            onClick={() => onDelete(vaccine.id)}
            style={{ padding: '8px 12px', background: '#fee2e2' }}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default VaccinesPage
