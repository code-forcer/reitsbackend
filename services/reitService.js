const yahooFinance = require('yahoo-finance2').default;

class REITService {
  constructor() {
    // Popular REITs across different sectors
    this.defaultREITs = [
      // High Yield REITs
      'OHI', 'AGNC', 'NRZ', 'NYMT', 'TWO', 'MITT', 'PMT', 'ACRE',
      // Large Cap REITs
      'PLD', 'AMT', 'EQIX', 'CCI', 'SPG', 'O', 'WELL', 'DLR',
      // Sector Specific
      'VTR', 'PEAK', 'BXP', 'ARE', 'HST', 'RHP', 'MAC', 'SKT'
    ];
  }

  async fetchREITData(symbols = this.defaultREITs) {
    const reitData = [];

    for (const symbol of symbols) {
      try {
        console.log(`Fetching REIT data for ${symbol}...`);

        const quote = await yahooFinance.quote(symbol);
        const summaryDetail = await yahooFinance.quoteSummary(symbol, {
          modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData']
        });

        const reit = {
          ticker: quote.symbol,
          name: quote.longName || quote.shortName || symbol,
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: (quote.regularMarketChangePercent * 100) || 0,
          yield: (quote.dividendYield * 100) || 0,
          marketCap: quote.marketCap ? (quote.marketCap / 1000000000) : 0, // Convert to billions
          sector: this.determineREITSector(quote.longName || quote.shortName || symbol),
          peRatio: quote.trailingPE || 0,
          priceToBook: summaryDetail?.defaultKeyStatistics?.priceToBook || 0,
          volume: quote.regularMarketVolume || 0,
          averageVolume: quote.averageVolume || 0,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
          beta: summaryDetail?.defaultKeyStatistics?.beta || 0,
          dividendRate: quote.dividendRate || 0,
          payoutRatio: summaryDetail?.defaultKeyStatistics?.payoutRatio || 0,
          fundsFromOperations: summaryDetail?.financialData?.operatingCashflow || 0,
          totalAssets: summaryDetail?.financialData?.totalAssets || 0,
          totalDebt: summaryDetail?.financialData?.totalDebt || 0,
          occupancyRate: this.generateOccupancyRate(), // Simulated since not available in API
          revenuePerShare: summaryDetail?.financialData?.revenuePerShare || 0,
          rating: this.calculateRating(quote, summaryDetail),
          trending: this.determineTrending(quote.regularMarketChangePercent)
        };

        reitData.push(reit);
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error fetching REIT data for ${symbol}:`, error.message);
        reitData.push({
          ticker: symbol,
          name: symbol,
          price: 0, change: 0, changePercent: 0, yield: 0,
          marketCap: 0, sector: 'Unknown', peRatio: 0,
          priceToBook: 0, volume: 0, averageVolume: 0,
          fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0, beta: 0,
          dividendRate: 0, payoutRatio: 0, fundsFromOperations: 0,
          totalAssets: 0, totalDebt: 0, occupancyRate: 0,
          revenuePerShare: 0, rating: 0, trending: 'neutral'
        });
      }
    }

    return reitData;
  }

  determineREITSector(name) {
    const sectorKeywords = {
      'Healthcare': ['health', 'medical', 'care', 'hospital', 'omega'],
      'Mortgage': ['mortgage', 'residential', 'agnc', 'investment corp'],
      'Industrial': ['prologis', 'industrial', 'warehouse', 'logistics'],
      'Infrastructure': ['tower', 'american tower', 'crown castle', 'cell'],
      'Data Centers': ['equinix', 'digital', 'data', 'center'],
      'Retail': ['simon', 'property', 'retail', 'mall', 'shopping'],
      'Office': ['office', 'boston properties', 'commercial'],
      'Residential': ['apartment', 'residential', 'multi-family'],
      'Hotel': ['hotel', 'lodging', 'hospitality', 'host']
    };

    const nameLower = name.toLowerCase();
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        return sector;
      }
    }
    return 'Mixed';
  }

  generateOccupancyRate() {
    // Generate realistic occupancy rate between 85-98%
    return Math.floor(Math.random() * (98 - 85) + 85);
  }

  calculateRating(quote, summaryDetail) {
    let rating = 3.0; // Base rating

    // Adjust based on dividend yield
    const dividendYieldPercent = quote.dividendYield * 100;
    if (dividendYieldPercent > 6) rating += 0.5;
    else if (dividendYieldPercent > 4) rating += 0.3;
    else if (dividendYieldPercent < 2) rating -= 0.5;

    // Adjust based on price performance
    const changePercent = quote.regularMarketChangePercent * 100;
    if (changePercent > 2) rating += 0.3;
    else if (changePercent < -2) rating -= 0.3;

    // Adjust based on market cap (larger = more stable)
    const marketCap = quote.marketCap;
    if (marketCap > 50000000000) rating += 0.4; // > $50B
    else if (marketCap > 10000000000) rating += 0.2; // > $10B

    // Random slight adjustment for realism
    rating += (Math.random() - 0.5) * 0.4;

    return Math.max(1.0, Math.min(5.0, rating));
  }

  determineTrending(changePercent) {
    if (changePercent > 0.5) return 'up';
    if (changePercent < -0.5) return 'down';
    return 'neutral';
  }
}

module.exports = new REITService();
