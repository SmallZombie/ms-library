import { parseNameMC } from './namemc';
import { parseMSkins } from './mskins';

export interface ParseResult {
  name: string;
  slim: boolean;
  file: string;
}

interface Parser {
  isSupported: (url: string) => boolean;
  parse: (url: string) => Promise<ParseResult>;
}

const parsers: Parser[] = [
  { isSupported: (url) => url.includes('namemc.com'), parse: parseNameMC },
  { isSupported: (url) => url.includes('minecraftskins.com'), parse: parseMSkins },
];

export async function parseSite(url: string): Promise<ParseResult | null> {
  for (const parser of parsers) {
    if (parser.isSupported(url)) {
      return parser.parse(url);
    }
  }
  return null;
}
