import { describe, it, expect } from 'vitest';
import { parseUsdRub } from '../lib/cbr';

// Minimal CBR XML fixture (real response format).
const XML_FIXTURE = `<?xml version="1.0" encoding="windows-1251"?>
<ValCurs Date="01.04.2026" name="Foreign Currency Market">
  <Valute ID="R01235">
    <NumCode>840</NumCode>
    <CharCode>USD</CharCode>
    <Nominal>1</Nominal>
    <Name>Доллар США</Name>
    <Value>92,5000</Value>
    <VunitRate>92,5000</VunitRate>
  </Valute>
  <Valute ID="R01239">
    <NumCode>978</NumCode>
    <CharCode>EUR</CharCode>
    <Nominal>1</Nominal>
    <Value>100,1234</Value>
  </Valute>
</ValCurs>`;

describe('CBR XML parser', () => {
  it('parses USD rate with comma decimal', () => {
    expect(parseUsdRub(XML_FIXTURE)).toBeCloseTo(92.5, 4);
  });

  it('handles nominal != 1', () => {
    const xml = XML_FIXTURE.replace('<Nominal>1</Nominal>', '<Nominal>10</Nominal>')
      .replace('<Value>92,5000</Value>', '<Value>925,0000</Value>');
    expect(parseUsdRub(xml)).toBeCloseTo(92.5, 4);
  });

  it('rejects sanity-failing rate (<30 or >500)', () => {
    const tooLow = XML_FIXTURE.replace('<Value>92,5000</Value>', '<Value>10,0000</Value>');
    expect(() => parseUsdRub(tooLow)).toThrow(/sane range/);
    const tooHigh = XML_FIXTURE.replace(
      '<Value>92,5000</Value>',
      '<Value>999,0000</Value>'
    );
    expect(() => parseUsdRub(tooHigh)).toThrow(/sane range/);
  });

  it('throws when USD valute missing', () => {
    const noUsd = XML_FIXTURE.replace(/R01235/g, 'R99999');
    expect(() => parseUsdRub(noUsd)).toThrow(/R01235/);
  });
});
