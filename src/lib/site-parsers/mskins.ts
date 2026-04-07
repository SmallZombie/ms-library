import * as cheerio from 'cheerio';
import type { ParseResult } from './index';

export async function parseMSkins(url: string): Promise<ParseResult> {
  const html = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  }).then(res => res.text());

  const $ = cheerio.load(html);

  const name = $('h1').first().text().trim();
  const imgSrc = $('img.skin-viewer-img, img[src*="skin"]').first().attr('src');

  if (!imgSrc) {
    throw new Error('Could not find skin image on MSkins page');
  }

  const absoluteUrl = imgSrc.startsWith('http') ? imgSrc : `https://www.minecraftskins.com${imgSrc}`;
  const response = await fetch(absoluteUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  return {
    name,
    slim: false,
    file: `data:image/png;base64,${base64}`,
  };
}
