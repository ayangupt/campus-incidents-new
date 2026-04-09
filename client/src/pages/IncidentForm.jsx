import { useState } from 'react';
import { LOCATIONS, CATEGORIES, SEVERITIES } from '../constants';
import api from '../services/api';
import './IncidentForm.css';

export default function IncidentForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    severity: '',
    reporterName: '',
    reporterEmail: '',
    dateOfIncident: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear messages when user starts typing
    setSuccessMessage('');
    setErrorMessage('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate required fields
    if (!formData.title.trim()) {
      setErrorMessage('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Description is required');
      return;
    }
    if (!formData.location) {
      setErrorMessage('Location is required');
      return;
    }
    if (!formData.category) {
      setErrorMessage('Category is required');
      return;
    }
    if (!formData.severity) {
      setErrorMessage('Severity is required');
      return;
    }
    if (!formData.reporterName.trim()) {
      setErrorMessage('Reporter name is required');
      return;
    }
    if (!formData.reporterEmail.trim()) {
      setErrorMessage('Reporter email is required');
      return;
    }
    if (!validateEmail(formData.reporterEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!formData.dateOfIncident) {
      setErrorMessage('Date of incident is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/incidents', formData);
      setSuccessMessage('Incident reported successfully! Thank you for your report.');
      setFormData({
        title: '',
        description: '',
        location: '',
        category: '',
        severity: '',
        reporterName: '',
        reporterEmail: '',
        dateOfIncident: '',
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit incident. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="incident-form-container">
      <header className="incident-form-header">
        <h1>UChicago Campus Incident Report</h1>
      </header>

      <div className="incident-form-card">
        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="alert alert-error">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief title of the incident"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the incident"
              rows="5"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group form-group-half">
              <label htmlFor="location">Location *</label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              >
                <option value="">Select a location...</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-group-half">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-group-half">
              <label htmlFor="severity">Severity *</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
              >
                <option value="">Select severity...</option>
                {SEVERITIES.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-group-half">
              <label htmlFor="dateOfIncident">Date of Incident *</label>
              <input
                type="date"
                id="dateOfIncident"
                name="dateOfIncident"
                value={formData.dateOfIncident}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-group-half">
              <label htmlFor="reporterName">Reporter Name *</label>
              <input
                type="text"
                id="reporterName"
                name="reporterName"
                value={formData.reporterName}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group form-group-half">
              <label htmlFor="reporterEmail">Reporter Email *</label>
              <input
                type="email"
                id="reporterEmail"
                name="reporterEmail"
                value={formData.reporterEmail}
                onChange={handleChange}
                placeholder="your.email@uchicago.edu"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
