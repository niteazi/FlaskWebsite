import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import FormPage from './pages/FormPage'
import ResultsPage from './pages/ResultsPage'
import AboutPage from './pages/AboutPage'
import MyAccount from './pages/MyAccount'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/account" element={<MyAccount />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
