// Product API utilities for auto-filling wishlist items from URLs

export interface ProductData {
  title: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  description?: string;
  url: string;
}

/**
 * Extract product information from a URL
 * Supports Amazon, Target, Walmart, Etsy, and general e-commerce sites
 */
export async function extractProductFromUrl(url: string): Promise<ProductData | null> {
  try {
    // Validate URL
    const urlObj = new URL(url);

    // Try LinkPreview API first (free tier)
    const product = await fetchFromLinkPreview(url);
    if (product) {
      return product;
    }

    // Fallback to Open Graph scraping
    return await fetchOpenGraphData(url);
  } catch (error) {
    console.error('Error extracting product data:', error);
    return null;
  }
}

/**
 * Use LinkPreview.net API (free tier: 60 requests/hour)
 * No API key required for basic usage
 */
async function fetchFromLinkPreview(url: string): Promise<ProductData | null> {
  try {
    const response = await fetch(`https://api.linkpreview.net/?q=${encodeURIComponent(url)}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      title: data.title || '',
      imageUrl: data.image || undefined,
      description: data.description || undefined,
      url: url,
      // LinkPreview doesn't provide price, we'll try to extract it from description
      ...extractPriceFromText(data.description || ''),
    };
  } catch (error) {
    console.error('LinkPreview API error:', error);
    return null;
  }
}

/**
 * Fallback: Fetch and parse Open Graph meta tags
 * This requires a server-side endpoint to avoid CORS
 */
async function fetchOpenGraphData(url: string): Promise<ProductData | null> {
  try {
    // Call our own API route that will fetch and parse the URL
    const response = await fetch('/api/extract-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.product || null;
  } catch (error) {
    console.error('Open Graph extraction error:', error);
    return null;
  }
}

/**
 * Extract price from text using regex patterns
 */
function extractPriceFromText(text: string): { price?: number; currency?: string } {
  const pricePatterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // $99.99 or $1,299.99
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/i,  // 99.99 USD
    /USD\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,  // USD 99.99
    /£(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // £99.99
    /€(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // €99.99
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);

      // Determine currency
      let currency = 'USD';
      if (text.includes('£')) currency = 'GBP';
      else if (text.includes('€')) currency = 'EUR';

      return { price, currency };
    }
  }

  return {};
}

/**
 * Detect if URL is from a known e-commerce platform
 */
export function detectPlatform(url: string): string | null {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('amazon.com') || urlLower.includes('amzn.to')) {
    return 'Amazon';
  } else if (urlLower.includes('target.com')) {
    return 'Target';
  } else if (urlLower.includes('walmart.com')) {
    return 'Walmart';
  } else if (urlLower.includes('etsy.com')) {
    return 'Etsy';
  } else if (urlLower.includes('ebay.com')) {
    return 'eBay';
  } else if (urlLower.includes('bestbuy.com')) {
    return 'Best Buy';
  }

  return null;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}
