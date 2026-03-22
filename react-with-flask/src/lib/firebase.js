import { getApps, initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim().length > 0,
)

let firestore = null

if (hasFirebaseConfig) {
  const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
  firestore = getFirestore(firebaseApp)
}

export const defaultFormConfig = {
  type: 'decisionTree',
  startNodeId: 'start',
  nodes: {
    start: {
      id: 'start',
      prompt: 'How old are you?',
      nodeType: 'choice',
      options: [
        { id: 'under18', label: 'Under 18', nextNodeId: 'school' },
        { id: '18to64', label: '18 to 64', nextNodeId: 'health' },
        { id: '65plus', label: '65 or over', nextNodeId: 'flu' },
      ],
    },
    school: {
      id: 'school',
      prompt: 'Have you completed your school vaccinations?',
      nodeType: 'choice',
      options: [
        { id: 'yes_school', label: 'Yes, all done', nextNodeId: 'result_uptodate' },
        { id: 'unsure_school', label: "I'm not sure", nextNodeId: 'result_check_records' },
      ],
    },
    health: {
      id: 'health',
      prompt: 'Do you have any underlying health condition?',
      nodeType: 'choice',
      options: [
        { id: 'healthy', label: 'No, I am healthy', nextNodeId: 'mmr' },
        { id: 'condition', label: 'Yes, I have a condition', nextNodeId: 'covid' },
      ],
    },
    flu: {
      id: 'flu',
      prompt: 'Have you had your seasonal flu vaccination?',
      nodeType: 'choice',
      options: [
        { id: 'flu_yes', label: "Yes, I've had both", nextNodeId: 'pneumo' },
        { id: 'flu_no', label: 'No, I missed them', nextNodeId: 'result_eligible' },
      ],
    },
    mmr: {
      id: 'mmr',
      prompt: 'Are you up to date with MMR?',
      nodeType: 'choice',
      options: [
        { id: 'mmr_yes', label: "Yes, I've had two doses", nextNodeId: 'result_uptodate' },
        { id: 'mmr_recent', label: 'Within the last 6 months', nextNodeId: 'result_uptodate' },
      ],
    },
    covid: {
      id: 'covid',
      prompt: 'When was your last COVID-19 booster?',
      nodeType: 'choice',
      options: [
        { id: 'covid_recent', label: 'Within the last 6 months', nextNodeId: 'result_uptodate' },
        { id: 'covid_unknown', label: "No / I don't know", nextNodeId: 'result_consult_gp' },
      ],
    },
    pneumo: {
      id: 'pneumo',
      prompt: "Have you had the 'Pneumo' vaccine (PPV)?",
      nodeType: 'choice',
      options: [
        { id: 'pneumo_yes', label: "Yes, I've had it", nextNodeId: 'result_protected' },
        { id: 'pneumo_no', label: 'No, never heard of it', nextNodeId: 'result_eligible' },
      ],
    },
    result_uptodate: {
      id: 'result_uptodate',
      prompt: 'Status: You are up to date.',
      nodeType: 'result',
    },
    result_check_records: {
      id: 'result_check_records',
      prompt: 'Action required: Check your records.',
      nodeType: 'result',
    },
    result_consult_gp: {
      id: 'result_consult_gp',
      prompt: 'Consult your GP for the next step.',
      nodeType: 'result',
    },
    result_eligible: {
      id: 'result_eligible',
      prompt: 'You may be eligible for a vaccination.',
      nodeType: 'result',
    },
    result_protected: {
      id: 'result_protected',
      prompt: 'Excellent! You are fully protected.',
      nodeType: 'result',
    },
  },
}

const formConfigRef = () => doc(firestore, 'adminSettings', 'formConfig')

const normalizeDecisionTreeConfig = (config = {}) => {
  if (config?.type === 'decisionTree' && config?.nodes && typeof config.nodes === 'object') {
    return {
      type: 'decisionTree',
      startNodeId: config.startNodeId || defaultFormConfig.startNodeId,
      nodes: config.nodes,
    }
  }

  // Legacy fallback: convert page/field shape into a linear tree.
  const pageKeys = Object.keys(config).filter(
    (key) => config[key] && typeof config[key] === 'object' && !Array.isArray(config[key]),
  )

  if (pageKeys.length === 0) {
    return defaultFormConfig
  }

  const nodes = {}

  pageKeys.forEach((pageKey, index) => {
    const nodeId = `node_${index + 1}`
    const nextNodeId = index < pageKeys.length - 1 ? `node_${index + 2}` : 'result_done'
    const fields = Object.entries(config[pageKey]).map(([fieldKey, label]) => ({
      key: fieldKey,
      label: String(label || fieldKey),
      inputType: /vaccine/i.test(fieldKey) ? 'vaccine' : 'text',
    }))

    nodes[nodeId] = {
      id: nodeId,
      prompt: pageKey,
      nodeType: 'input',
      fields,
      nextNodeId,
    }
  })

  nodes.result_done = {
    id: 'result_done',
    prompt: 'Decision flow complete.',
    nodeType: 'result',
  }

  return {
    type: 'decisionTree',
    startNodeId: 'node_1',
    nodes,
  }
}

export const getFormConfig = async () => {
  if (!firestore) {
    return defaultFormConfig
  }

  try {
    const snapshot = await getDoc(formConfigRef())
    if (!snapshot.exists()) {
      return defaultFormConfig
    }

    return normalizeDecisionTreeConfig(snapshot.data())
  } catch (error) {
    console.error('Error fetching form config:', error)
    return defaultFormConfig
  }
}

export const subscribeToFormConfig = (onConfig, onError) => {
  if (!firestore) {
    onConfig(defaultFormConfig)
    return () => {}
  }

  return onSnapshot(
    formConfigRef(),
    (snapshot) => {
      if (!snapshot.exists()) {
        onConfig(defaultFormConfig)
        return
      }

      onConfig(normalizeDecisionTreeConfig(snapshot.data()))
    },
    (error) => {
      console.error('Error subscribing to form config:', error)
      if (typeof onError === 'function') {
        onError(error)
      }
    },
  )
}

export const saveFormConfig = async (questions) => {
  if (!firestore) {
    return false
  }

  await setDoc(formConfigRef(), questions)

  return true
}

export const getVaccineByName = async (vaccineName) => {
  if (!firestore) {
    return null
  }

  try {
    const vaccinesRef = collection(firestore, 'vaccine')
    const q = query(vaccinesRef, where('name', '==', vaccineName))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

    const docSnap = snapshot.docs[0]
    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  } catch (error) {
    console.error('Error fetching vaccine:', error)
    return null
  }
}

export const getAllVaccines = async () => {
  if (!firestore) {
    return []
  }

  try {
    const vaccinesRef = collection(firestore, 'vaccine')
    const snapshot = await getDocs(vaccinesRef)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching vaccines:', error)
    return []
  }
}

export const addVaccine = async (payload) => {
  if (!firestore) {
    return false
  }

  await addDoc(collection(firestore, 'vaccine'), {
    name: payload.name?.trim() || '',
    data: payload.data?.trim() || '',
    description: payload.description?.trim() || '',
    updatedAt: Date.now(),
  })

  return true
}

export const updateVaccine = async (id, payload) => {
  if (!firestore || !id) {
    return false
  }

  await updateDoc(doc(firestore, 'vaccine', id), {
    name: payload.name?.trim() || '',
    data: payload.data?.trim() || '',
    description: payload.description?.trim() || '',
    updatedAt: Date.now(),
  })

  return true
}

export const deleteVaccineById = async (id) => {
  if (!firestore || !id) {
    return false
  }

  await deleteDoc(doc(firestore, 'vaccine', id))
  return true
}
