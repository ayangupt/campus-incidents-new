const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  location: {
    type: String,
    required: true,
    enum: [
      'Booth School of Business', 'Crerar Library', 'Eckhart Hall',
      'Harper Memorial Library', 'Henry Crown Field House', 'Hutchinson Commons',
      'Kent Chemical Laboratory', 'Mansueto Library', 'Max Palevsky Cinema',
      'Pick Hall', 'Ratner Athletics Center', 'Regenstein Library',
      'Reynolds Club', 'Rockefeller Chapel', 'Rosenwald Hall',
      'Ryerson Physical Laboratory', 'Smart Museum of Art', 'Stuart Hall',
      'Swift Hall', 'University Bookstore', 'Other'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Infrastructure/Maintenance', 'Safety Hazard', 'Vandalism',
      'Technology/AV Issue', 'Cleanliness', 'Noise Complaint',
      'Accessibility', 'Other'
    ]
  },
  severity: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  reporterName: { type: String, required: true, trim: true },
  reporterEmail: { type: String, required: true, trim: true, lowercase: true },
  dateOfIncident: { type: Date, required: true },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Resolved'],
    default: 'New'
  }
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
