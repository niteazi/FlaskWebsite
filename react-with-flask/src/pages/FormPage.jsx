import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defaultFormConfig, hasFirebaseConfig, subscribeToFormConfig, subscribeToVaccines } from '../lib/firebase'

function FormPage() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  const [vaccines, setVaccines] = useState([])
  const [vaccinesLoading, setVaccinesLoading] = useState(true)
  const [formConfig, setFormConfig] = useState(defaultFormConfig)
  const [currentNodeId, setCurrentNodeId] = useState(defaultFormConfig.startNodeId)
  const [nodeTrail, setNodeTrail] = useState([])
  const [history, setHistory] = useState([])
  const [answers, setAnswers] = useState({})
  const [inputDraft, setInputDraft] = useState({})

  const nodes = formConfig.nodes || {}
  const currentNode = nodes[currentNodeId] || null

  const setInputField = (fieldKey, value) => {
    setInputDraft((previous) => ({
      ...previous,
      [fieldKey]: value,
    }))
  }

  useEffect(() => {
    const unsubscribe = subscribeToFormConfig(
      (config) => {
        const nextConfig = config || defaultFormConfig
        const nextNodes = nextConfig.nodes || {}

        setFormConfig(nextConfig)
        setCurrentNodeId((previousNodeId) =>
          previousNodeId && nextNodes[previousNodeId] ? previousNodeId : nextConfig.startNodeId,
        )
        setNodeTrail((previousTrail) => previousTrail.filter((nodeId) => Boolean(nextNodes[nodeId])))
      },
      () => {
        setFormConfig(defaultFormConfig)
        setCurrentNodeId(defaultFormConfig.startNodeId)
        setNodeTrail([])
      },
    )

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setVaccinesLoading(false)
      return () => {}
    }

    const unsubscribe = subscribeToVaccines(
      (vaccineList) => {
        setVaccines(vaccineList)
        setVaccinesLoading(false)
      },
      (error) => {
        console.error('Error loading vaccines:', error)
        setVaccines([])
        setVaccinesLoading(false)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [])

  const validateInputNode = (node) => {
    const nextErrors = {}

    ;(node.fields || []).forEach((field) => {
      const value = String(inputDraft[field.key] || '').trim()
      if (!value) {
        nextErrors[field.key] = `${field.label || field.key} is required.`
      }
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const finalizeToResults = (nextHistory, nextAnswers, finalNode = null) => {
    navigate('/results', {
      state: {
        treeAnswers: nextAnswers,
        treeHistory: nextHistory,
        finalNode,
        formConfig,
      },
    })
  }

  const goToNode = (nextNodeId, answerEntry) => {
    const nextHistory = answerEntry ? [...history, answerEntry] : history
    const nextAnswers = answerEntry
      ? {
          ...answers,
          [answerEntry.key]: answerEntry.value,
        }
      : answers

    setHistory(nextHistory)
    setAnswers(nextAnswers)
    setErrors({})
    setInputDraft({})

    if (nextNodeId && nodes[nextNodeId]) {
      setNodeTrail((previous) => [...previous, currentNodeId])
      setCurrentNodeId(nextNodeId)
      return
    }

    finalizeToResults(nextHistory, nextAnswers)
  }

  const handleChoice = (option) => {
    if (!currentNode) {
      return
    }

    goToNode(option.nextNodeId, {
      key: `${currentNode.id}.choice`,
      label: currentNode.prompt,
      value: option.label,
      nodeId: currentNode.id,
      nextNodeId: option.nextNodeId || '',
    })
  }

  const handleInputNext = () => {
    if (!currentNode) {
      return
    }

    if (!validateInputNode(currentNode)) {
      return
    }

    const newEntries = (currentNode.fields || []).map((field) => ({
      key: `${currentNode.id}.${field.key}`,
      label: field.label || field.key,
      value: String(inputDraft[field.key] || '').trim(),
      nodeId: currentNode.id,
      nextNodeId: currentNode.nextNodeId || '',
      inputType: field.inputType || 'text',
    }))

    const nextHistory = [...history, ...newEntries]
    const nextAnswers = { ...answers }
    newEntries.forEach((entry) => {
      nextAnswers[entry.key] = entry.value
    })

    setHistory(nextHistory)
    setAnswers(nextAnswers)
    setErrors({})
    setInputDraft({})

    if (currentNode.nextNodeId && nodes[currentNode.nextNodeId]) {
      setNodeTrail((previous) => [...previous, currentNodeId])
      setCurrentNodeId(currentNode.nextNodeId)
      return
    }

    finalizeToResults(nextHistory, nextAnswers)
  }

  const goToPreviousNode = () => {
    if (nodeTrail.length === 0) {
      return
    }

    const previousNodeId = nodeTrail[nodeTrail.length - 1]
    setNodeTrail((previous) => previous.slice(0, -1))
    setCurrentNodeId(previousNodeId)
    setInputDraft({})
    setErrors({})
  }

  const renderInputField = (field) => {
    const value = inputDraft[field.key] || ''
    if (field.inputType === 'vaccine') {
      return (
        <select
          id={`${currentNode.id}-${field.key}`}
          value={value}
          onChange={(event) => setInputField(field.key, event.target.value)}
          style={{ padding: 10 }}
        >
          <option value="">Select one</option>
          {vaccinesLoading ? (
            <option value="">Loading vaccines...</option>
          ) : vaccines.length === 0 ? (
            <option value="">No vaccines available</option>
          ) : (
            vaccines.map((vaccine) => (
              <option key={vaccine.id} value={vaccine.name || vaccine.id}>
                {vaccine.name || vaccine.id}
              </option>
            ))
          )}
        </select>
      )
    }

    return (
      <input
        id={`${currentNode.id}-${field.key}`}
        value={value}
        onChange={(event) => setInputField(field.key, event.target.value)}
        style={{ padding: 10 }}
      />
    )
  }

  if (!currentNode) {
    return (
      <main className="nhs-page" style={{ maxWidth: 720 }}>
        <h1>FindMyJabs</h1>
        <p>No start node found in decision tree configuration.</p>
      </main>
    )
  }

  return (
    <main className="nhs-page" style={{ maxWidth: 720 }}>
      <h1>FindMyJabs</h1>

      <section style={{ display: 'grid', gap: 14, marginTop: 24 }}>
        <h2 style={{ margin: 0 }}>{currentNode.prompt}</h2>

        {currentNode.nodeType === 'choice' ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {(currentNode.options || []).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChoice(option)}
                style={{ padding: '10px 14px', textAlign: 'left' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {currentNode.nodeType === 'input' ? (
          <>
            {(currentNode.fields || []).map((field) => (
              <label key={field.key} htmlFor={`${currentNode.id}-${field.key}`} style={{ display: 'grid', gap: 6 }}>
                {field.label || field.key}
                {renderInputField(field)}
                {errors[field.key] && <span style={{ color: 'crimson' }}>{errors[field.key]}</span>}
              </label>
            ))}
            <button type="button" onClick={handleInputNext} style={{ width: 180, padding: '10px 14px' }}>
              Continue
            </button>
          </>
        ) : null}

        {currentNode.nodeType === 'result' ? (
          <button
            type="button"
            onClick={() => finalizeToResults(history, answers, currentNode)}
            style={{ width: 220, padding: '10px 14px' }}
          >
            View Result Summary
          </button>
        ) : null}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={goToPreviousNode}
            disabled={nodeTrail.length === 0}
            style={{ width: 170, padding: '10px 14px' }}
          >
            Previous question
          </button>
        </div>
      </section>
    </main>
  )
}

export default FormPage
