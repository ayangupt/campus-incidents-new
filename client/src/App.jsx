import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import IncidentForm from './components/IncidentForm'
import AdminPage from './components/AdminPage'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<IncidentForm />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  )
}

export default App
