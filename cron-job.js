require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');
const REIT = require('./models/REIT');
const News = require('./models/News');
const reitService = require('./services/reitService');
const geminiService = require('./services/geminiService');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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

// Run immediately when started
updateREITData();
generateNews();

console.log('🚀 REIT data cron job started');