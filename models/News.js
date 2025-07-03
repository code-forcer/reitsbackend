const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  source: { type: String, default: '' },
  publishedAt: { type: Date, default: Date.now },
  category: { type: String, default: 'General' },
  impact: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
  readTime: { type: String, default: '3 min read' },
  relatedTickers: [{ type: String }],
  url: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('News', newsSchema);