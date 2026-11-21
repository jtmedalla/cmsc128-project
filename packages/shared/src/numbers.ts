/**
 * Number words residents spell numbers with: English, the Spanish-derived words
 * common in Tagalog and Hiligaynon, and native Tagalog and Hiligaynon.
 * Tagalog's "-ng" forms ("isang", "dalawampung") are read by dropping "ng".
 */
// prettier-ignore
const NUMBER_WORDS: Record<string, number> = {
  // English.
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
  // Spanish-derived, in local and Spanish spellings.
  uno: 1, dos: 2, tres: 3, kwatro: 4, kuwatro: 4, kuatro: 4, cuatro: 4,
  singko: 5, sinko: 5, cinco: 5, sais: 6, seis: 6, siyete: 7, syete: 7,
  siete: 7, otso: 8, ocho: 8, nuwebe: 9, nwebe: 9, nueve: 9, diyes: 10,
  dyes: 10, diez: 10, onse: 11, dose: 12, doce: 12, trese: 13, trece: 13,
  katorse: 14, catorce: 14, kinse: 15, quince: 15,
  // "disi" starts 16 to 19 ("disisais", "disi-otso"); see NUMBER_PREFIXES.
  disi: 10,
  beinte: 20, bente: 20, veinte: 20, trenta: 30, treinta: 30, traynta: 30,
  kwarenta: 40, kuwarenta: 40, cuarenta: 40, singkwenta: 50,
  singkuwenta: 50, sinkwenta: 50, cincuenta: 50, sisenta: 60, sesenta: 60,
  sitenta: 70, setenta: 70, otsenta: 80, ochenta: 80, nobenta: 90,
  noventa: 90, siyento: 100, syento: 100, ciento: 100, cien: 100,
  // Tagalog.
  isa: 1, dalawa: 2, tatlo: 3, apat: 4, lima: 5, anim: 6, pito: 7, walo: 8,
  siyam: 9, sampu: 10,
  // "labing" starts 11 to 19 ("labing-isa", "labinlima"); see NUMBER_PREFIXES.
  labing: 10,
  dalawampu: 20, tatlumpu: 30, apatnapu: 40, limampu: 50, animnapu: 60,
  pitumpu: 70, walumpu: 80, siyamnapu: 90, sandaan: 100,
  // Hiligaynon, where it differs from Tagalog.
  duha: 2, anum: 6, napulo: 10,
};

/**
 * Words that multiply the single digit before them: "one hundred",
 * "duha ka pulo" (Hiligaynon, 2 × 10). Alone, each is its own value.
 */
const MULTIPLIER_WORDS: Record<string, number> = {
  hundred: 100,
  daan: 100,
  pulo: 10,
};

/**
 * Words between two parts of one number: "sixty and five", "bente y uno",
 * "kwarenta'y singko", "dalawampu't isa", "napulo kag isa", "duha ka pulo".
 */
const NUMBER_JOINERS = new Set(['and', 'y', 't', 'at', 'kag', 'ka']);

/**
 * Prefixes written joined to the next number word, split off so each part is
 * its own word: "labinlima" to "labing lima", "disi-otso" to "disi otso",
 * "bentiuno" to "bente uno".
 */
const NUMBER_PREFIXES: [RegExp, string][] = [
  // "in(?!g)" so "labing isa", already split, is left alone.
  [/\blab(?:ing|in(?!g)|im)-?(?=[a-z])/g, 'labing '],
  [/\b(?:disi|dyesi|diyesi)-?(?=[a-z])/g, 'disi '],
  [/\b[bv]ei?nti-?(?=[a-z])/g, 'bente '],
];

/** A number word's value, reading "isang" as "isa". */
function numberWordValue(word: string): number | undefined {
  return (
    NUMBER_WORDS[word] ??
    MULTIPLIER_WORDS[word] ??
    (word.endsWith('ng') ? NUMBER_WORDS[word.slice(0, -2)] : undefined)
  );
}

/**
 * `text` (lowercase) with spelled-out numbers turned into digits, so
 * patterns can match them: "sixty five pataas" is "65 pataas", "sixties" is
 * "60s".
 * A part joins the number before it only if smaller than the last part, so
 * "twenty-one" is 21 but "twenty-thirty" stays a range, "20-30".
 */
export function spellOutNumbers(text: string): string {
  const unprefixed = NUMBER_PREFIXES.reduce(
    (t, [prefix, split]) => t.replace(prefix, split),
    text,
  );
  // Words land at odd indexes, with whatever sits between them at even ones.
  const parts = unprefixed.split(/([a-z]+)/);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const word = parts[i] ?? '';
    const start = i % 2 === 1 ? numberWordValue(word) : undefined;
    // A spelled decade: "sixties" is "60s".
    const decade = word.endsWith('ies')
      ? NUMBER_WORDS[`${word.slice(0, -3)}y`]
      : undefined;
    if (decade !== undefined && i % 2 === 1) {
      out.push(`${decade}s`);
      continue;
    }
    if (start === undefined) {
      out.push(word);
      continue;
    }

    let total = start;
    let last = start;
    for (;;) {
      // The next word must follow with only spaces, hyphens or an
      // apostrophe ("dalawampu't") between, and maybe a joiner.
      if (!/^[\s'-]+$/.test(parts[i + 1] ?? '')) break;
      let next = i + 2;
      if (
        NUMBER_JOINERS.has(parts[next] ?? '') &&
        /^[\s-]+$/.test(parts[next + 1] ?? '')
      ) {
        next += 2;
      }
      const nextWord = parts[next] ?? '';
      const multiplier = MULTIPLIER_WORDS[nextWord];
      const value = numberWordValue(nextWord);
      if (multiplier !== undefined && total < 10) {
        total *= multiplier;
        last = total;
      } else if (
        multiplier === undefined &&
        value !== undefined &&
        value < last
      ) {
        total += value;
        last = value;
      } else {
        break;
      }
      i = next;
    }
    out.push(String(total));
  }
  return out.join('');
}
