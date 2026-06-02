// pricing.test.js
// Run with: npm test
// Tests cover core pricing logic and promotional rules

import { describe, it, expect } from 'vitest';
import {
  getMobilityPricePerLine,
  getMobilityTotal,
  getInternetPrice,
  getSecurityPrice,
  getAppliedPromos,
  calculateQuote,
} from '../src/utils/pricing.js';

// ─── Internet Pricing ─────────────────────────────────────────────────────────

describe('getInternetPrice', () => {
  it('returns $120/mo for PureFibre 1.5G', () => {
    expect(getInternetPrice('internet_1500')).toBe(120);
  });

  it('returns 0 for unknown tier', () => {
    expect(getInternetPrice('nonexistent')).toBe(0);
  });
});

// ─── Mobility Pricing ─────────────────────────────────────────────────────────

describe('getMobilityPricePerLine', () => {
  it('returns $60/mo for 5G Standard single line', () => {
    expect(getMobilityPricePerLine('mob_standard', 1)).toBe(60);
  });

  it('returns $45/mo for 5G+ Complete single line', () => {
    expect(getMobilityPricePerLine('mob_complete', 1)).toBe(45);
  });

  it('returns $85/mo for Unlimited single line', () => {
    expect(getMobilityPricePerLine('mob_unlimited', 1)).toBe(85);
  });
  
  it('returns 0 for unknown tier', () => {
    expect(getMobilityPricePerLine('nonexistent', 1)).toBe(0);
  });
});

describe('getMobilityTotal', () => {
  it('returns $45 for 1 line of 5G+ Complete', () => {
    expect(getMobilityTotal('mob_complete', 1)).toBe(45);
  });

  it('returns $90 for 2 lines of 5G+ Complete', () => {
    expect(getMobilityTotal('mob_complete', 2)).toBe(90);
  });

  it('returns $225 for 5 lines of 5G+ Complete', () => {
    expect(getMobilityTotal('mob_complete', 5)).toBe(225);
  });

  it('returns $300 for 5 lines of 5G Standard', () => {
    expect(getMobilityTotal('mob_standard', 5)).toBe(300);
  });
});

// ─── Security Pricing ─────────────────────────────────────────────────────────

describe('getSecurityPrice', () => {
  it('returns $20/mo for Smart Camera standalone', () => {
    expect(getSecurityPrice('sec_camera', false)).toBe(20);
  });

  it('returns $50/mo for Monitor standalone', () => {
    expect(getSecurityPrice('sec_monitor', false)).toBe(50);
  });

  it('returns $40/mo for Monitor when bundled', () => {
    expect(getSecurityPrice('sec_monitor', true)).toBe(40);
  });

  it('returns $60/mo for Protect standalone', () => {
    expect(getSecurityPrice('sec_protect', false)).toBe(60);
  });

  it('returns $50/mo for Protect when bundled', () => {
    expect(getSecurityPrice('sec_protect', true)).toBe(50);
  });

  it('returns bundled price + addon for Protect with Guard Response', () => {
    expect(getSecurityPrice('sec_protect', true, ['Guard Response'])).toBe(62);
  });

  it('returns 0 for unknown tier', () => {
    expect(getSecurityPrice('nonexistent', false)).toBe(0);
  });
});

// ─── Promotional Rules ────────────────────────────────────────────────────────

describe('getAppliedPromos', () => {
  it('applies no promos for empty cart', () => {
    expect(getAppliedPromos({})).toHaveLength(0);
  });

  it('applies no promos for internet only', () => {
    const cart = { internet: { tierId: 'internet_1500' } };
    const promos = getAppliedPromos(cart);
    expect(promos.filter(p => !p.isPerk)).toHaveLength(0);
  });

  it('applies bundle discount for internet + mobility', () => {
    const cart = {
      internet: { tierId: 'internet_1500' },
      mobility: { tierId: 'mob_complete', lines: 2 },
    };
    const promos = getAppliedPromos(cart);
    const bundlePromo = promos.find(p => p.id === 'bundle_discount');
    expect(bundlePromo).toBeDefined();
    expect(bundlePromo.amount).toBe(10);
  });

  it('applies security bundle discount when security bundled with internet', () => {
    const cart = {
      internet: { tierId: 'internet_1500' },
      security: { tierId: 'sec_monitor', addons: [] },
    };
    const promos = getAppliedPromos(cart);
    const secPromo = promos.find(p => p.id === 'security_bundle');
    expect(secPromo).toBeDefined();
    expect(secPromo.amount).toBe(10); // Monitor: $50 standalone - $40 bundled = $10 saving
  });

  it('includes Priority Queue perk for 2+ products', () => {
    const cart = {
      internet: { tierId: 'internet_1500' },
      mobility: { tierId: 'mob_complete', lines: 1 },
    };
    const promos = getAppliedPromos(cart);
    const perk = promos.find(p => p.id === 'priority_queue');
    expect(perk).toBeDefined();
  });

  it('does NOT apply Priority Queue for single product', () => {
    const cart = { internet: { tierId: 'internet_1500' } };
    const promos = getAppliedPromos(cart);
    const perk = promos.find(p => p.id === 'priority_queue');
    expect(perk).toBeUndefined();
  });
});

// ─── Full Quote Calculation ────────────────────────────────────────────────────

describe('calculateQuote', () => {
  it('returns correct total for internet only', () => {
    const cart = { internet: { tierId: 'internet_1500' } };
    const quote = calculateQuote(cart);
    expect(quote.subtotal).toBe(120);
    expect(quote.total).toBe(120);
    expect(quote.savings).toBe(0);
  });

  it('applies $10 bundle discount for internet + mobility', () => {
    const cart = {
      internet: { tierId: 'internet_1500' },
      mobility: { tierId: 'mob_complete', lines: 2 },
    };
    const quote = calculateQuote(cart);
    expect(quote.subtotal).toBe(120 + 90); // 120 internet + 45*2 mobility
    expect(quote.totalDiscount).toBe(10);
    expect(quote.total).toBe(200);
  });

  it('applies security bundle discount when bundled', () => {
    const cart = {
      internet: { tierId: 'internet_1500' },
      security: { tierId: 'sec_protect', addons: [] },
    };
    const quote = calculateQuote(cart);
    // Security is bundled so uses $50 bundledPrice (saves $10)
    // Plus $10 security bundle promo
    expect(quote.subtotal).toBe(120 + 50); // internet + bundled security price
    expect(quote.totalDiscount).toBe(10);
    expect(quote.total).toBe(160);
  });

  it('calculates full bundle correctly', () => {
    const cart = {
      internet: { tierId: 'internet_1500' },
      mobility: { tierId: 'mob_complete', lines: 3 },
      security: { tierId: 'sec_monitor', addons: [] },
    };
    const quote = calculateQuote(cart);
    // Internet: $120
    // Mobility: $45 * 3 = $135
    // Security bundled: $40
    // Subtotal: $295
    // Bundle discount (internet+mobility): -$10
    // Security bundle discount: -$10 (Monitor $50 standalone - $40 bundled, already applied in price)
    expect(quote.subtotal).toBe(120 + 135 + 40);
    expect(quote.total).toBeLessThan(quote.subtotal);
  });

  it('total is never negative', () => {
    const cart = {
      internet: { tierId: 'internet_1500' },
      mobility: { tierId: 'mob_complete', lines: 1 },
      security: { tierId: 'sec_camera', addons: [] },
    };
    const quote = calculateQuote(cart);
    expect(quote.total).toBeGreaterThanOrEqual(0);
  });
});
