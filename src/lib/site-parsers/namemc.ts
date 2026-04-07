import * as cheerio from 'cheerio';
import type { ParseResult } from './index';

export async function parseNameMC(url: string): Promise<ParseResult> {
  const html = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  }).then(res => res.text());

  const $ = cheerio.load(html);

  const skinCanvas = $('canvas.skin-3d');
  const id = skinCanvas.attr('data-id');
  const name = $('h1 a').text() || $('h1').text();
  const slim = skinCanvas.attr('data-model') === 'slim';

  if (!id) {
    throw new Error('Could not find skin ID on NameMC page');
  }

  const data = await fetch(`https://s.namemc.com/i/${id}.js`).then(res => res.text());
  const match = /\{'[^']+':\s*'([^']+)'\}/.exec(data);

  if (!match) {
    throw new Error('Could not extract skin data from NameMC');
  }

  return {
    name,
    slim,
    file: `data:image/png;base64,${match[1]}`,
  };
}
