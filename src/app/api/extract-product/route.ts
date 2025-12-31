import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChristmasPlanner/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL' },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Extract Open Graph and meta tags
    const product = extractProductData(html, url);

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error extracting product:', error);
    return NextResponse.json(
      { error: 'Failed to extract product data' },
      { status: 500 }
    );
  }
}

function extractProductData(html: string, url: string) {
  const data: any = { url };

  console.log('=== Extracting product data for:', url);

  // Extract Open Graph tags
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
  const ogDescription = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
  const ogPrice = html.match(/<meta\s+property="og:price:amount"\s+content="([^"]*)"/i);
  const ogCurrency = html.match(/<meta\s+property="og:price:currency"\s+content="([^"]*)"/i);

  // Also try product schema tags
  const productPrice = html.match(/<meta\s+property="product:price:amount"\s+content="([^"]*)"/i);
  const productCurrency = html.match(/<meta\s+property="product:price:currency"\s+content="([^"]*)"/i);

  console.log('OG Image found:', !!ogImage);
  console.log('OG Price found:', !!ogPrice);
  console.log('Product Price found:', !!productPrice);

  // Extract title
  if (ogTitle) {
    data.title = decodeHtmlEntities(ogTitle[1]);
  } else {
    const titleTag = html.match(/<title>([^<]*)<\/title>/i);
    if (titleTag) {
      data.title = decodeHtmlEntities(titleTag[1]);
    }
  }

  // Extract image - try multiple methods
  if (ogImage) {
    data.imageUrl = ogImage[1];
    console.log('✓ Image extracted from OG tag:', data.imageUrl);
  } else {
    // Try other image meta tags
    const twitterImage = html.match(/<meta\s+(?:name|property)="twitter:image"\s+content="([^"]*)"/i);
    const itemImage = html.match(/<meta\s+itemprop="image"\s+content="([^"]*)"/i);
    const landingImage = html.match(/<img[^>]+id="landingImage"[^>]+src="([^"]*)"/i);

    console.log('Twitter Image found:', !!twitterImage);
    console.log('Item Image found:', !!itemImage);
    console.log('Landing Image found:', !!landingImage);

    if (twitterImage) {
      data.imageUrl = twitterImage[1];
      console.log('✓ Image extracted from Twitter tag:', data.imageUrl);
    } else if (itemImage) {
      data.imageUrl = itemImage[1];
      console.log('✓ Image extracted from itemprop:', data.imageUrl);
    } else if (landingImage) {
      data.imageUrl = landingImage[1];
      console.log('✓ Image extracted from landingImage:', data.imageUrl);
    } else {
      // Try to find product images (skip sprites and icons)
      // Look for images in common product image containers
      const productImagePatterns = [
        // Amazon product images
        /<img[^>]+id="[^"]*imgBlk[^"]*"[^>]+src="([^"]*)"/i,
        /<img[^>]+class="[^"]*product-image[^"]*"[^>]+src="([^"]*)"/i,
        // Images with "images/I/" in path (Amazon product images)
        /<img[^>]+src="(https?:\/\/[^"]*\/images\/I\/[^"]*)"/i,
        // Any image with "product" in the path or class
        /<img[^>]+(?:class="[^"]*product[^"]*"|src="[^"]*product[^"]*")[^>]+src="([^"]*)"/i,
      ];

      for (const pattern of productImagePatterns) {
        const match = html.match(pattern);
        if (match) {
          const imgUrl = match[1];
          // Skip tiny sprites and icons
          if (!imgUrl.includes('sprite') && !imgUrl.includes('icon') && !imgUrl.includes('nav-')) {
            data.imageUrl = imgUrl;
            console.log('✓ Image extracted from product image pattern:', imgUrl);
            break;
          }
        }
      }

      // Last resort: find first large image (but skip sprites)
      if (!data.imageUrl) {
        const allImgs = html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"[^>]*>/gi);
        for (const match of allImgs) {
          const imgUrl = match[1];
          // Skip sprites, icons, and navigation images
          if (!imgUrl.includes('sprite') && !imgUrl.includes('icon') && !imgUrl.includes('nav-') && !imgUrl.includes('logo')) {
            data.imageUrl = imgUrl;
            console.log('✓ Image extracted from first valid img tag:', imgUrl);
            break;
          }
        }
      }

      if (!data.imageUrl) {
        console.log('✗ No image found in HTML');
      }
    }
  }

  // Extract description
  if (ogDescription) {
    data.description = decodeHtmlEntities(ogDescription[1]);
  } else {
    const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    if (metaDesc) {
      data.description = decodeHtmlEntities(metaDesc[1]);
    }
  }

  // Extract price
  if (ogPrice || productPrice) {
    const priceValue = (ogPrice || productPrice)?.[1];
    if (priceValue) {
      data.price = parseFloat(priceValue);
      console.log('✓ Price extracted from meta tags:', data.price);
    }
  }

  // Extract currency
  if (ogCurrency || productCurrency) {
    data.currency = (ogCurrency || productCurrency)?.[1];
  }

  // If no price found in meta tags, try to extract from HTML
  if (!data.price) {
    console.log('No price in meta tags, trying HTML patterns...');
    // Try to find price in common HTML patterns
    const pricePatterns = [
      /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)</i,
      /<span[^>]*class="[^"]*price[^"]*"[^>]*>\$?([0-9,]+\.?\d*)</i,
      /<span[^>]*id="[^"]*price[^"]*"[^>]*>\$?([0-9,]+\.?\d*)</i,
      /class="[^"]*priceblock[^"]*"[^>]*>\$?([0-9,]+\.?\d*)/i,
      /"price":"?\$?([0-9,]+\.?\d*)"/i,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        console.log('Price pattern matched:', match[0]);
        const priceStr = match[1].replace(/,/g, '').replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          data.price = price;
          data.currency = 'USD';
          console.log('✓ Price extracted from HTML:', price);
          break;
        }
      }
    }

    if (!data.price) {
      console.log('✗ No price found in HTML patterns');
    }

    // If still no price, try description
    if (!data.price && data.description) {
      const priceData = extractPriceFromText(data.description);
      if (priceData.price) {
        data.price = priceData.price;
        data.currency = priceData.currency;
        console.log('✓ Price extracted from description:', priceData.price);
      }
    }
  }

  console.log('=== Final extracted data:', {
    title: data.title,
    price: data.price,
    currency: data.currency,
    hasImage: !!data.imageUrl,
    hasDescription: !!data.description
  });

  return data;
}

function extractPriceFromText(text: string): { price?: number; currency?: string } {
  const pricePatterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/i,
    /USD\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /£(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /€(\d+(?:,\d{3})*(?:\.\d{2})?)/,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);

      let currency = 'USD';
      if (text.includes('£')) currency = 'GBP';
      else if (text.includes('€')) currency = 'EUR';

      return { price, currency };
    }
  }

  return {};
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
