const mongoose = require('mongoose');

const reitSchema = new mongoose.Schema({
  ticker: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
  changePercent: { type: Number, default: 0 },
  yield: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },
  sector: { type: String, default: '' },
  peRatio: { type: Number, default: 0 },
  priceToBook: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
  averageVolume: { type: Number, default: 0 },
  fiftyTwoWeekHigh: { type: Number, default: 0 },
  fiftyTwoWeekLow: { type: Number, default: 0 },
  beta: { type: Number, default: 0 },
  dividendRate: { type: Number, default: 0 },
  payoutRatio: { type: Number, default: 0 },
  fundsFromOperations: { type: Number, default: 0 },
  totalAssets: { type: Number, default: 0 },
  totalDebt: { type: Number, default: 0 },
  occupancyRate: { type: Number, default: 0 },
  revenuePerShare: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  aiInsights: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  trending: { type: String, enum: ['up', 'down', 'neutral'], default: 'neutral' }
}, {
  timestamps: true
});

module.exports = mongoose.model('REIT', reitSchema);