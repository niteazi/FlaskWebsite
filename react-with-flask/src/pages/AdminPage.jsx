import { useEffect, useMemo, useState } from 'react'
import {
  addVaccine,
  defaultFormConfig,
  deleteVaccineById,
  getAllVaccines,
  getFormConfig,
  hasFirebaseConfig,
  saveFormConfig,
  updateVaccine,
} from '../lib/firebase'

function AdminPage() {
  const [formConfig, setFormConfig] = useState(defaultFormConfig)
  const [vaccines, setVaccines] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [status, setStatus] = useState('')
  const [newVaccine, setNewVaccine] = useState({ name: '', data: '', description: '' })
  const [newNodeId, setNewNodeId] = useState('')
  const [newNodePrompt, setNewNodePrompt] = useState('')
  const [newNodeType, setNewNodeType] = useState('choice')
  const [quickVaccineNodeId, setQuickVaccineNodeId] = useState('vaccine_check')

  const nodeIds = useMemo(() => Object.keys(formConfig.nodes || {}), [formConfig])
  const hasUnlinkedConnections = useMemo(() => {
    return nodeIds.some((nodeId) => {
      const node = formConfig.nodes[nodeId]
      if (node.nodeType === 'choice') {
        return (node.options || []).some(
          (option) => option.nextNodeId && !formConfig.nodes[option.nextNodeId],
        )
      }

      if (node.nodeType === 'input') {
        return node.nextNodeId && !formConfig.nodes[node.nextNodeId]
      }

      return false
    })
  }, [formConfig, nodeIds])

  const loadAdminData = async () => {
    if (!hasFirebaseConfig) {
      setLoading(false)
      return
    }

    try {
      const [config, vaccineList] = await Promise.all([getFormConfig(), getAllVaccines()])
      setFormConfig(config)
      setVaccines(vaccineList)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const updateNode = (nodeId, patch) => {
    setFormConfig((previous) => ({
      ...previous,
      nodes: {
        ...previous.nodes,
        [nodeId]: {
          ...previous.nodes[nodeId],
          ...patch,
        },
      },
    }))
  }

  const setStartNode = (nodeId) => {
    setFormConfig((previous) => ({
      ...previous,
      startNodeId: nodeId,
    }))
  }

  const addNode = () => {
    const id = newNodeId.trim()
    if (!id) {
      setStatus('Node ID is required.')
      return
    }

    if (formConfig.nodes[id]) {
      setStatus('Node ID already exists.')
      return
    }

    const prompt = newNodePrompt.trim() || id
    const nextNode =
      newNodeType === 'choice'
        ? { id, prompt, nodeType: 'choice', options: [] }
        : newNodeType === 'input'
          ? {
              id,
              prompt,
              nodeType: 'input',
              fields: [{ key: 'field1', label: 'Field 1', inputType: 'text' }],
              nextNodeId: '',
            }
          : { id, prompt, nodeType: 'result' }

    setFormConfig((previous) => ({
      ...previous,
      nodes: {
        ...previous.nodes,
        [id]: nextNode,
      },
      startNodeId: previous.startNodeId || id,
    }))

    setNewNodeId('')
    setNewNodePrompt('')
    setStatus('Node added. Save to persist changes.')
  }

  const addVaccineQuestionNode = () => {
    const nodeId = quickVaccineNodeId.trim() || 'vaccine_check'
    if (formConfig.nodes[nodeId]) {
      setStatus('Vaccine node ID already exists. Use another ID.')
      return
    }

    setFormConfig((previous) => ({
      ...previous,
      nodes: {
        ...previous.nodes,
        [nodeId]: {
          id: nodeId,
          prompt: 'Please select your vaccine',
          nodeType: 'input',
          fields: [{ key: 'vaccine', label: 'Vaccine', inputType: 'vaccine' }],
          nextNodeId: '',
        },
      },
      startNodeId: previous.startNodeId || nodeId,
    }))

    setStatus('Vaccine question node created. Link it to a next node and save.')
  }

  const removeNode = (nodeId) => {
    setFormConfig((previous) => {
      const nextNodes = Object.fromEntries(
        Object.entries(previous.nodes || {}).filter(([id]) => id !== nodeId),
      )

      // Clean references to deleted node.
      Object.keys(nextNodes).forEach((id) => {
        const node = nextNodes[id]
        if (node.nodeType === 'choice') {
          nextNodes[id] = {
            ...node,
            options: (node.options || []).map((option) => ({
              ...option,
              nextNodeId: option.nextNodeId === nodeId ? '' : option.nextNodeId,
            })),
          }
        }

        if (node.nodeType === 'input' && node.nextNodeId === nodeId) {
          nextNodes[id] = {
            ...node,
            nextNodeId: '',
          }
        }
      })

      return {
        ...previous,
        nodes: nextNodes,
        startNodeId: previous.startNodeId === nodeId ? Object.keys(nextNodes)[0] || '' : previous.startNodeId,
      }
    })

    setStatus('Node removed. Save to persist changes.')
  }

  const addChoiceOption = (nodeId) => {
    setFormConfig((previous) => {
      const node = previous.nodes[nodeId]
      const options = Array.isArray(node.options) ? node.options : []
      return {
        ...previous,
        nodes: {
          ...previous.nodes,
          [nodeId]: {
            ...node,
            options: [
              ...options,
              {
                id: `option_${Date.now()}`,
                label: 'New option',
                nextNodeId: '',
              },
            ],
          },
        },
      }
    })
  }

  const updateChoiceOption = (nodeId, optionId, key, value) => {
    setFormConfig((previous) => {
      const node = previous.nodes[nodeId]
      return {
        ...previous,
        nodes: {
          ...previous.nodes,
          [nodeId]: {
            ...node,
            options: (node.options || []).map((option) =>
              option.id === optionId ? { ...option, [key]: value } : option,
            ),
          },
        },
      }
    })
  }

  const removeChoiceOption = (nodeId, optionId) => {
    setFormConfig((previous) => {
      const node = previous.nodes[nodeId]
      return {
        ...previous,
        nodes: {
          ...previous.nodes,
          [nodeId]: {
            ...node,
            options: (node.options || []).filter((option) => option.id !== optionId),
          },
        },
      }
    })
  }

  const addInputField = (nodeId) => {
    setFormConfig((previous) => {
      const node = previous.nodes[nodeId]
      const fields = Array.isArray(node.fields) ? node.fields : []
      return {
        ...previous,
        nodes: {
          ...previous.nodes,
          [nodeId]: {
            ...node,
            fields: [...fields, { key: `field${fields.length + 1}`, label: 'New field', inputType: 'text' }],
          },
        },
      }
    })
  }

  const updateInputField = (nodeId, fieldIndex, key, value) => {
    setFormConfig((previous) => {
      const node = previous.nodes[nodeId]
      const fields = [...(node.fields || [])]
      fields[fieldIndex] = {
        ...fields[fieldIndex],
        [key]: value,
      }

      return {
        ...previous,
        nodes: {
          ...previous.nodes,
          [nodeId]: {
            ...node,
            fields,
          },
        },
      }
    })
  }

  const removeInputField = (nodeId, fieldIndex) => {
    setFormConfig((previous) => {
      const node = previous.nodes[nodeId]
      return {
        ...previous,
        nodes: {
          ...previous.nodes,
          [nodeId]: {
            ...node,
            fields: (node.fields || []).filter((_, index) => index !== fieldIndex),
          },
        },
      }
    })
  }

  const handleSaveConfig = async () => {
    if (!hasFirebaseConfig) {
      setStatus('Firebase is not configured.')
      return
    }

    setSavingConfig(true)
    setStatus('')

    try {
      await saveFormConfig({
        type: 'decisionTree',
        startNodeId: formConfig.startNodeId,
        nodes: formConfig.nodes,
      })
      setStatus('Decision tree saved.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save form config')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleUpdateVaccine = async (id, payload) => {
    try {
      await updateVaccine(id, payload)
      setStatus('Vaccine updated.')
      await loadAdminData()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update vaccine')
    }
  }

  const handleDeleteVaccine = async (id) => {
    try {
      await deleteVaccineById(id)
      setStatus('Vaccine deleted.')
      await loadAdminData()
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
      await loadAdminData()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to add vaccine')
    }
  }

  if (!hasFirebaseConfig) {
    return (
      <main className="nhs-page" style={{ maxWidth: 1100 }}>
        <h1>Admin</h1>
        <p>Firebase is not configured. Add VITE_FIREBASE_* values to continue.</p>
      </main>
    )
  }

  return (
    <main className="nhs-page" style={{ maxWidth: 1100 }}>
      <h1>Admin</h1>
      <p>Edit decision-tree nodes and manage vaccine records.</p>
      {status && <p style={{ color: '#0f766e' }}>{status}</p>}
      {hasUnlinkedConnections ? (
        <p style={{ color: '#b45309' }}>
          Some node connections point to missing targets. Review nodes marked with Unlinked target before saving.
        </p>
      ) : null}

      {loading ? (
        <p>Loading admin data...</p>
      ) : (
        <>
          <section style={{ marginTop: 20, border: '1px solid #d4d4d8', borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Tree Visual</h2>
            <DecisionTreePlot nodes={formConfig.nodes || {}} startNodeId={formConfig.startNodeId} />
          </section>

          <section style={{ marginTop: 20, border: '1px solid #d4d4d8', borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Decision Tree Editor</h2>

            <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
              Start node
              <select value={formConfig.startNodeId || ''} onChange={(event) => setStartNode(event.target.value)}>
                <option value="">Select node</option>
                {nodeIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Add node</h3>
              <input
                placeholder="Node id"
                value={newNodeId}
                onChange={(event) => setNewNodeId(event.target.value)}
              />
              <input
                placeholder="Node prompt"
                value={newNodePrompt}
                onChange={(event) => setNewNodePrompt(event.target.value)}
              />
              <select value={newNodeType} onChange={(event) => setNewNodeType(event.target.value)}>
                <option value="choice">Choice</option>
                <option value="input">Input</option>
                <option value="result">Result</option>
              </select>
              <button type="button" onClick={addNode} style={{ width: 160, padding: '8px 12px' }}>
                Add node
              </button>
            </div>

            <div style={{ display: 'grid', gap: 8, marginBottom: 16, border: '1px solid #e5e7eb', padding: 10, borderRadius: 8 }}>
              <h3 style={{ margin: 0 }}>Quick helper: Vaccine question node</h3>
              <input
                placeholder="Node id"
                value={quickVaccineNodeId}
                onChange={(event) => setQuickVaccineNodeId(event.target.value)}
              />
              <button type="button" onClick={addVaccineQuestionNode} style={{ width: 260, padding: '8px 12px' }}>
                Create vaccine question node
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {nodeIds.map((nodeId) => {
                const node = formConfig.nodes[nodeId]
                return (
                  <article key={nodeId} style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{nodeId}</strong>
                      <button
                        type="button"
                        onClick={() => removeNode(nodeId)}
                        style={{ padding: '6px 10px', background: '#fee2e2' }}
                      >
                        Remove node
                      </button>
                    </div>

                    <label style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                      Prompt
                      <input
                        value={node.prompt || ''}
                        onChange={(event) => updateNode(nodeId, { prompt: event.target.value })}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                      Type
                      <select
                        value={node.nodeType || 'choice'}
                        onChange={(event) => updateNode(nodeId, { nodeType: event.target.value })}
                      >
                        <option value="choice">Choice</option>
                        <option value="input">Input</option>
                        <option value="result">Result</option>
                      </select>
                    </label>

                    {node.nodeType === 'choice' && (
                      <div style={{ marginTop: 10 }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>Options</h4>
                        {(node.options || []).map((option) => (
                          <div
                            key={option.id}
                            style={{ display: 'grid', gap: 6, marginBottom: 8, border: '1px solid #f4f4f5', padding: 8 }}
                          >
                            <input
                              value={option.label || ''}
                              onChange={(event) => updateChoiceOption(nodeId, option.id, 'label', event.target.value)}
                              placeholder="Option label"
                            />
                            <select
                              value={option.nextNodeId || ''}
                              onChange={(event) => updateChoiceOption(nodeId, option.id, 'nextNodeId', event.target.value)}
                            >
                              <option value="">End flow</option>
                              {nodeIds.map((id) => (
                                <option key={id} value={id}>
                                  {id}
                                </option>
                              ))}
                            </select>
                            {option.nextNodeId && !formConfig.nodes[option.nextNodeId] ? (
                              <span style={{ color: '#b45309', fontSize: 12 }}>Unlinked target: {option.nextNodeId}</span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => removeChoiceOption(nodeId, option.id)}
                              style={{ width: 140, padding: '6px 10px', background: '#fee2e2' }}
                            >
                              Remove option
                            </button>
                          </div>
                        ))}

                        <button type="button" onClick={() => addChoiceOption(nodeId)} style={{ padding: '8px 12px' }}>
                          Add option
                        </button>
                      </div>
                    )}

                    {node.nodeType === 'input' && (
                      <div style={{ marginTop: 10 }}>
                        <label style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
                          Next node
                          <select
                            value={node.nextNodeId || ''}
                            onChange={(event) => updateNode(nodeId, { nextNodeId: event.target.value })}
                          >
                            <option value="">End flow</option>
                            {nodeIds.map((id) => (
                              <option key={id} value={id}>
                                {id}
                              </option>
                            ))}
                          </select>
                        </label>
                        {node.nextNodeId && !formConfig.nodes[node.nextNodeId] ? (
                          <p style={{ color: '#b45309', marginTop: 0 }}>Unlinked target: {node.nextNodeId}</p>
                        ) : null}

                        <h4 style={{ margin: '0 0 8px 0' }}>Fields</h4>
                        {(node.fields || []).map((field, index) => (
                          <div
                            key={`${nodeId}-${index}`}
                            style={{ display: 'grid', gap: 6, marginBottom: 8, border: '1px solid #f4f4f5', padding: 8 }}
                          >
                            <input
                              value={field.key || ''}
                              onChange={(event) => updateInputField(nodeId, index, 'key', event.target.value)}
                              placeholder="Field key"
                            />
                            <input
                              value={field.label || ''}
                              onChange={(event) => updateInputField(nodeId, index, 'label', event.target.value)}
                              placeholder="Field label"
                            />
                            <select
                              value={field.inputType || 'text'}
                              onChange={(event) => updateInputField(nodeId, index, 'inputType', event.target.value)}
                            >
                              <option value="text">Text</option>
                              <option value="vaccine">Vaccine dropdown</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeInputField(nodeId, index)}
                              style={{ width: 130, padding: '6px 10px', background: '#fee2e2' }}
                            >
                              Remove field
                            </button>
                          </div>
                        ))}

                        <button type="button" onClick={() => addInputField(nodeId)} style={{ padding: '8px 12px' }}>
                          Add field
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              style={{ marginTop: 14, padding: '10px 14px' }}
            >
              {savingConfig ? 'Saving...' : 'Save decision tree to Firebase'}
            </button>
          </section>

          <section style={{ marginTop: 20, border: '1px solid #d4d4d8', borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Vaccines</h2>

            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Add vaccine</h3>
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
                <VaccineEditor
                  key={vaccine.id}
                  vaccine={vaccine}
                  onSave={handleUpdateVaccine}
                  onDelete={handleDeleteVaccine}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function DecisionTreePlot({ nodes, startNodeId }) {
  const ids = Object.keys(nodes || {})
  if (ids.length === 0) {
    return <p>No nodes to visualize.</p>
  }

  const visited = new Set()
  const levels = []
  const queue = [{ id: startNodeId || ids[0], level: 0 }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current.id) || !nodes[current.id]) {
      continue
    }

    visited.add(current.id)
    if (!levels[current.level]) {
      levels[current.level] = []
    }
    levels[current.level].push(current.id)

    const node = nodes[current.id]
    const nextIds = []

    if (node.nodeType === 'choice') {
      ;(node.options || []).forEach((option) => {
        if (option.nextNodeId) {
          nextIds.push(option.nextNodeId)
        }
      })
    }

    if (node.nodeType === 'input' && node.nextNodeId) {
      nextIds.push(node.nextNodeId)
    }

    nextIds.forEach((id) => {
      if (!visited.has(id)) {
        queue.push({ id, level: current.level + 1 })
      }
    })
  }

  const unvisited = ids.filter((id) => !visited.has(id))
  if (unvisited.length > 0) {
    levels.push(unvisited)
  }

  const width = 980
  const verticalGap = 130
  const height = Math.max(260, levels.length * verticalGap + 50)
  const nodePositions = {}

  levels.forEach((levelNodes, levelIndex) => {
    const rowY = 50 + levelIndex * verticalGap
    levelNodes.forEach((id, index) => {
      const rowWidthStep = width / (levelNodes.length + 1)
      const rowX = Math.round((index + 1) * rowWidthStep)
      nodePositions[id] = { x: rowX, y: rowY }
    })
  })

  const edges = []
  ids.forEach((id) => {
    const node = nodes[id]
    if (!nodePositions[id]) {
      return
    }

    if (node.nodeType === 'choice') {
      ;(node.options || []).forEach((option) => {
        if (option.nextNodeId && nodePositions[option.nextNodeId]) {
          edges.push({ from: id, to: option.nextNodeId, label: option.label || '' })
        }
      })
    }

    if (node.nodeType === 'input' && node.nextNodeId && nodePositions[node.nextNodeId]) {
      edges.push({ from: id, to: node.nextNodeId, label: 'next' })
    }
  })

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Decision tree">
        {edges.map((edge, index) => {
          const from = nodePositions[edge.from]
          const to = nodePositions[edge.to]
          const midX = Math.round((from.x + to.x) / 2)
          const midY = Math.round((from.y + to.y) / 2)
          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <line x1={from.x} y1={from.y + 26} x2={to.x} y2={to.y - 26} stroke="#52525b" strokeWidth="1.5" />
              {edge.label ? (
                <text x={midX} y={midY - 4} textAnchor="middle" fontSize="11" fill="#27272a">
                  {edge.label}
                </text>
              ) : null}
            </g>
          )
        })}

        {ids.map((id) => {
          const node = nodes[id]
          const pos = nodePositions[id]
          if (!pos) {
            return null
          }

          const fill = node.nodeType === 'result' ? '#e0f2fe' : node.nodeType === 'input' ? '#dcfce7' : '#ede9fe'
          return (
            <g key={id}>
              <rect x={pos.x - 84} y={pos.y - 26} width="168" height="52" rx="8" fill={fill} stroke="#6366f1" />
              <text x={pos.x} y={pos.y - 5} textAnchor="middle" fontSize="11" fill="#18181b">
                {id}
              </text>
              <text x={pos.x} y={pos.y + 11} textAnchor="middle" fontSize="10" fill="#3f3f46">
                {(node.prompt || '').slice(0, 24)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
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

export default AdminPage
