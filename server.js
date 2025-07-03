require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const REIT = require('./models/REIT');
const News = require('./models/News');
const reitService = require('./services/reitService');
const geminiService = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// API Routes
// Get all REITs
app.get('/api/reits', async (req, res) => {
  try {
    const reits = await REIT.find({}).sort({ lastUpdated: -1 });
    res.json({
      success: true,
      data: reits,
      lastUpdated: reits[0]?.lastUpdated || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get highest yielding REITs
app.get('/api/reits/highest-yield', async (req, res) => {
  try {
    const reits = await REIT.find({ yield: { $gt: 0 } })
      .sort({ yield: -1 })
      .limit(10);
    res.json({
      success: true,
      data: reits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get largest REITs by market cap
app.get('/api/reits/largest', async (req, res) => {
  try {
    const reits = await REIT.find({ marketCap: { $gt: 0 } })
      .sort({ marketCap: -1 })
      .limit(10);
    res.json({
      success: true,
      data: reits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific REIT
app.get('/api/reits/:ticker', async (req, res) => {
  try {
    const reit = await REIT.findOne({ ticker: req.params.ticker.toUpperCase() });
    if (!reit) {
      return res.status(404).json({
        success: false,
        error: 'REIT not found'
      });
    }
    res.json({
      success: true,
      data: reit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get news
app.get('/api/news', async (req, res) => {
  try {
    const news = await News.find({ isActive: true })
      .sort({ publishedAt: -1 })
      .limit(20);
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'REIT API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Cron Job Functions
async function updateREITData() {
  try {
    console.log('🔄 Starting REIT data update...');
    
    const reitData = await reitService.fetchREITData();
    console.log(`📊 Fetched data for ${reitData.length} REITs`);

    console.log('🤖 Generating AI insights...');
    const insights = await geminiService.batchAnalyzeREITs(reitData);

    for (const reit of reitData) {
      await REIT.findOneAndUpdate(
        { ticker: reit.ticker },
        { 
          ...reit,
          aiInsights: insights[reit.ticker] || '',
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ REIT data updated successfully');
  } catch (error) {
    console.error('❌ Error updating REIT data:', error);
  }
}

async function generateNews() {
  try {
    console.log('📰 Generating news...');
    
    const recentREITs = await REIT.find({}).sort({ lastUpdated: -1 }).limit(5);
    const newsData = await geminiService.generateNews(recentREITs);
    
    if (newsData) {
      const news = new News({
        title: newsData.title,
        summary: newsData.summary,
        source: 'AI Market Analysis',
        category: newsData.category,
        impact: newsData.impact,
        publishedAt: new Date(),
        readTime: `${Math.floor(Math.random() * 4) + 3} min read`
      });
      
      await news.save();
      console.log('📰 News generated successfully');
    }
  } catch (error) {
    console.error('❌ Error generating news:', error);
  }
}

// Setup Cron Jobs
// Run every 15 minutes during market hours
cron.schedule('*/15 9-16 * * 1-5', updateREITData, {
  timezone: "America/New_York"
});

// Run once every hour outside market hours
cron.schedule('0 * * * *', updateREITData);

// Generate news twice daily
cron.schedule('0 9,15 * * 1-5', generateNews, {
  timezone: "America/New_York"
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 REIT API Server running on port ${PORT}`);
  console.log('🚀 REIT data cron job started');
  
  // Run immediately when started
  updateREITData();
  generateNews();
});