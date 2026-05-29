import { PRODUCTS, PROMOS } from '../data/products.js';

/**
 * Calculate the monthly price for a single mobility line
 * @param {string} tierId - The mobility tier ID
 * @param {number} lineCount - Number of lines
 * @returns {number} Price per line per month
 */
export function getMobilityPricePerLine(tierId, lineCount = 1) {
  const tier = PRODUCTS.mobility.tiers.find(t => t.id === tierId);
  if (!tier) return 0;

  // Multi-line discount applies when bundled (2+ lines for eligible plans)
  if (lineCount >= 2 && tier.multiLineDiscount > 0) {
    return tier.price; // Price already includes multi-line discount per TELUS pricing
  }

  // Single line - add back the multi-line discount to get base price
  return tier.price + (lineCount === 1 ? 0 : 0);
}

/**
 * Calculate total monthly mobility cost
 * @param {string} tierId - The mobility tier ID
 * @param {number} lineCount - Number of lines
 * @returns {number} Total monthly cost for all lines
 */
export function getMobilityTotal(tierId, lineCount) {
  const pricePerLine = getMobilityPricePerLine(tierId, lineCount);
  return pricePerLine * lineCount;
}

/**
 * Calculate internet monthly cost
 * @param {string} tierId - Internet tier ID
 * @returns {number} Monthly price
 */
export function getInternetPrice(tierId) {
  const tier = PRODUCTS.internet.tiers.find(t => t.id === tierId);
  return tier ? tier.price : 0;
}

/**
 * Calculate security monthly cost
 * @param {string} tierId - Security tier ID
 * @param {boolean} isBundled - Whether other TELUS services are in cart
 * @param {Array} addons - Selected addon IDs
 * @returns {number} Monthly security cost
 */
export function getSecurityPrice(tierId, isBundled = false, addons = []) {
  const tier = PRODUCTS.security.tiers.find(t => t.id === tierId);
  if (!tier) return 0;

  const basePrice = isBundled ? tier.bundledPrice : tier.price;
  const addonCost = addons.reduce((sum, addonName) => {
    const addon = tier.addons?.find(a => a.name === addonName);
    return sum + (addon ? addon.price : 0);
  }, 0);

  return basePrice + addonCost;
}

/**
 * Calculate all applicable promotions for the current cart
 * @param {Object} cart - Current cart state
 * @returns {Array} Array of applied promotions with amounts
 */
export function getAppliedPromos(cart) {
  const applied = [];

  // Bundle discount: Internet + Mobility
  if (PROMOS.bundleDiscount.condition(cart)) {
    applied.push({
      ...PROMOS.bundleDiscount,
      amount: PROMOS.bundleDiscount.discount,
    });
  }

  // Security bundle discount
  if (PROMOS.securityBundle.condition(cart)) {
    const amount = PROMOS.securityBundle.discountFn(cart);
    if (amount > 0) {
      applied.push({
        ...PROMOS.securityBundle,
        amount,
      });
    }
  }

  // Priority Queue perk (no monetary value but surface it)
  if (PROMOS.priorityQueue.condition(cart)) {
    applied.push({
      ...PROMOS.priorityQueue,
      amount: 0,
    });
  }

  return applied;
}

/**
 * Calculate the full quote totals
 * @param {Object} cart - Current cart state
 * @returns {Object} Subtotal, discounts, total, and applied promos
 */
export function calculateQuote(cart) {
  let subtotal = 0;

  // Internet
  if (cart.internet) {
    subtotal += getInternetPrice(cart.internet.tierId);
  }

  // Mobility
  if (cart.mobility) {
    subtotal += getMobilityTotal(cart.mobility.tierId, cart.mobility.lines);
  }

  // Security (check if bundled)
  const isBundled = !!(cart.internet || cart.mobility);
  if (cart.security) {
    subtotal += getSecurityPrice(
      cart.security.tierId,
      isBundled,
      cart.security.addons || []
    );
  }

  // Apply promos
  const promos = getAppliedPromos(cart);
  const totalDiscount = promos.reduce((sum, p) => sum + p.amount, 0);
  const total = Math.max(0, subtotal - totalDiscount);

  return {
    subtotal,
    totalDiscount,
    total,
    promos,
    savings: subtotal - total,
  };
}

/**
 * Get a human-readable summary of what's in the cart
 * @param {Object} cart - Current cart state
 * @returns {string} Summary for LLM prompt
 */
export function getCartSummary(cart) {
  const lines = [];

  if (cart.internet) {
    const tier = PRODUCTS.internet.tiers.find(t => t.id === cart.internet.tierId);
    if (tier) lines.push(`Internet: ${tier.name} at $${tier.price}/mo`);
  }

  if (cart.mobility) {
    const tier = PRODUCTS.mobility.tiers.find(t => t.id === cart.mobility.tierId);
    if (tier) {
      lines.push(`Mobility: ${cart.mobility.lines} x ${tier.name} (${tier.data} ${tier.coverage}) at $${tier.price}/line/mo`);
    }
  }

  if (cart.security) {
    const tier = PRODUCTS.security.tiers.find(t => t.id === cart.security.tierId);
    if (tier) {
      const isBundled = !!(cart.internet || cart.mobility);
      const price = isBundled ? tier.bundledPrice : tier.price;
      lines.push(`Security: ${tier.name} at $${price}/mo${cart.security.addons?.length ? ` + addons: ${cart.security.addons.join(', ')}` : ''}`);
    }
  }

  const quote = calculateQuote(cart);
  lines.push(`Total: $${quote.total}/mo`);

  if (quote.promos.length > 0) {
    lines.push(`Promos applied: ${quote.promos.map(p => p.name).join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Get business context for LLM narrative generation
 * @param {Object} cart - Current cart state
 * @param {Object} businessInfo - Business details from rep
 * @returns {string} Context string for LLM
 */
export function buildLLMContext(cart, businessInfo) {
  const quote = calculateQuote(cart);
  const isBundled = !!(cart.internet || cart.mobility);
  const sections = [];

  if (cart.internet) {
    const tier = PRODUCTS.internet.tiers.find(t => t.id === cart.internet.tierId);
    if (tier) {
      sections.push(
        `BUSINESS INTERNET — ${tier.name}
  Speed: ${tier.speed}
  Term: ${tier.term}-month contract
  Key features: ${tier.features.slice(0, 3).join(', ')}
  Price: $${tier.price}/mo`
      );
    }
  }

  if (cart.mobility) {
    const tier = PRODUCTS.mobility.tiers.find(t => t.id === cart.mobility.tierId);
    if (tier) {
      const totalPrice = getMobilityTotal(cart.mobility.tierId, cart.mobility.lines);
      sections.push(
        `BUSINESS MOBILITY — ${tier.name}
  Lines: ${cart.mobility.lines}
  Data: ${tier.data} at ${tier.coverage}
  Key features: ${tier.features.slice(0, 3).join(', ')}
  Price: $${tier.price}/line/mo ($${totalPrice}/mo total for ${cart.mobility.lines} lines)`
      );
    }
  }

  if (cart.security) {
    const tier = PRODUCTS.security.tiers.find(t => t.id === cart.security.tierId);
    if (tier) {
      const price = getSecurityPrice(cart.security.tierId, isBundled, cart.security.addons || []);
      const addons = cart.security.addons?.length
        ? `\n  Add-ons: ${cart.security.addons.join(', ')}`
        : '';
      sections.push(
        `BUSINESS SECURITY — ${tier.name}
  Key features: ${tier.features.slice(0, 3).join(', ')}${addons}
  Price: $${price}/mo${isBundled ? ` (bundled rate, saves $${tier.price - tier.bundledPrice}/mo vs standalone)` : ''}`
      );
    }
  }

  const promoLines = quote.promos
    .filter(p => !p.isPerk)
    .map(p => `  - ${p.name}: -$${p.amount}/mo`)
    .join('\n');
  const perkLines = quote.promos
    .filter(p => p.isPerk)
    .map(p => `  - ${p.name} (included)`)
    .join('\n');

  const upsellLines = [];
  if (!cart.internet) {
    const tier = PRODUCTS.internet.tiers[0];
    upsellLines.push(`  - BUSINESS INTERNET (${tier.name}): $${tier.price}/mo — ${tier.features[0]}, ${tier.features[2]}`);
  }
  if (!cart.mobility) {
    const tier = PRODUCTS.mobility.tiers.find(t => t.id === 'mob_complete');
    upsellLines.push(`  - BUSINESS MOBILITY (${tier.name}): $${tier.price}/line/mo — ${tier.data} ${tier.coverage}, ${tier.features[1]}`);
  }
  if (!cart.security) {
    const tier = PRODUCTS.security.tiers.find(t => t.id === 'sec_monitor');
    const bundledPrice = (cart.internet || cart.mobility) ? tier.bundledPrice : tier.price;
    upsellLines.push(`  - BUSINESS SECURITY (${tier.name}): $${bundledPrice}/mo when bundled — ${tier.features[0]}, ${tier.features[1]}`);
  }

  return `
CUSTOMER
  Business: ${businessInfo.businessName || 'the customer'}
  Industry: ${businessInfo.industry || 'small business'}
  Team size: ${businessInfo.employees || '1-30 employees'}

SELECTED PRODUCTS
${sections.join('\n\n')}

PROMOTIONS APPLIED
${promoLines || '  None'}
${perkLines ? `\nPERKS INCLUDED\n${perkLines}` : ''}

MONTHLY TOTAL: $${quote.total}/mo${quote.savings > 0 ? ` (saving $${quote.savings}/mo vs individual pricing)` : ''}
${upsellLines.length > 0 ? `\nNOT YET INCLUDED (available to add)\n${upsellLines.join('\n')}` : ''}
  `.trim();
}
