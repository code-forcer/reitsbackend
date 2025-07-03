const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateREITInsights(reitData) {
    try {
      const prompt = `
        Analyze this REIT data and provide a brief insight (max 100 words):
        
        REIT: ${reitData.ticker} (${reitData.name})
        Current Price: $${reitData.price}
        Change: ${reitData.changePercent}%
        Dividend Yield: ${reitData.yield}%
        Market Cap: $${reitData.marketCap}B
        P/E Ratio: ${reitData.peRatio}
        Sector: ${reitData.sector}
        
        Provide a concise analysis focusing on:
        1. REIT performance and dividend sustainability
        2. Sector-specific outlook
        3. Investment attractiveness (neutral tone)
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 'AI insights temporarily unavailable';
    }
  }

  async generateNews(marketData) {
    try {
      const prompt = `
        Based on current REIT market data, generate a realistic news headline and summary:
        
        Market Context:
        - Top performing REITs by yield
        - Recent sector trends
        - Market conditions
        
        Create a news item with:
        - Realistic headline (max 80 characters)
        - Brief summary (max 150 words)
        - Category (Market Update, Sector Analysis, Earnings, etc.)
        - Impact assessment (positive/negative/neutral)
        
        Format as JSON:
        {
          "title": "headline",
          "summary": "summary",
          "category": "category",
          "impact": "impact"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      try {
        const newsData = JSON.parse(response.text());
        return newsData;
      } catch (parseError) {
        console.error('Error parsing AI news response:', parseError);
        return {
          title: "REIT Market Shows Mixed Performance",
          summary: "Real estate investment trusts continue to navigate changing market conditions with varied sector performance.",
          category: "Market Update",
          impact: "neutral"
        };
      }
    } catch (error) {
      console.error('Gemini News Generation Error:', error);
      return null;
    }
  }

  async batchAnalyzeREITs(reitsData) {
    const insights = {};
    
    for (let i = 0; i < reitsData.length; i += 3) {
      const batch = reitsData.slice(i, i + 3);
      
      const batchPromises = batch.map(async (reit) => {
        try {
          const insight = await this.generateREITInsights(reit);
          return { ticker: reit.ticker, insight };
        } catch (error) {
          console.error(`Error analyzing ${reit.ticker}:`, error);
          return { ticker: reit.ticker, insight: 'Analysis unavailable' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        insights[result.ticker] = result.insight;
      });

      if (i + 3 < reitsData.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return insights;
  }
}

module.exports = new GeminiService();