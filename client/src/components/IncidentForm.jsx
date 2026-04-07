import { useState } from 'react'

const initialFormState = {
  name: '',
  email: '',
  date: new Date().toISOString().split('T')[0],
  location: '',
  category: '',
  priority: 'Medium',
  description: ''
}

function IncidentForm() {
  const [form, setForm] = useState({ ...initialFormState })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Please enter a valid email address.'
    if (!form.date) return 'Date of incident is required.'
    if (!form.location.trim()) return 'Location is required.'
    if (!form.category) return 'Category is required.'
    if (!form.description.trim()) return 'Description is required.'
    if (form.description.trim().length < 10)
      return 'Description must be at least 10 characters.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    const error = validate()
    if (error) {
      setMessage({ type: 'error', text: error })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Server error (${res.status})`)
      }

      setMessage({ type: 'success', text: 'Incident reported successfully!' })
      setForm({ ...initialFormState, date: new Date().toISOString().split('T')[0] })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Report an Incident</h2>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Contact Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date of Incident *</label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={form.date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <input
            id="location"
            name="location"
            type="text"
            required
            placeholder="e.g., Regenstein Library, Room 301"
            value={form.location}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            required
            value={form.category}
            onChange={handleChange}
          >
            <option value="">-- Select Category --</option>
            <option value="IT">IT</option>
            <option value="Facility">Facility</option>
            <option value="Security">Security</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description * (min 10 characters)</label>
          <textarea
            id="description"
            name="description"
            required
            rows="5"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Incident'}
        </button>
      </form>
    </div>
  )
}

export default IncidentForm
