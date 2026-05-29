import { useState, useEffect, useCallback } from "react";
import { PRODUCTS, PROMOS } from "./data/products.js";
import {
  calculateQuote,
  getInternetPrice,
  getMobilityTotal,
  getSecurityPrice,
  buildLLMContext,
} from "./utils/pricing.js";

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --telus-purple: #4B286D;
    --telus-green: #66CC00;
    --telus-green-dark: #2B8000;
    --telus-light-purple: #F2ECF9;
    --telus-mid-purple: #7B4F9E;
    --bg: #F8F7FA;
    --white: #FFFFFF;
    --text: #1A1A2E;
    --text-muted: #6B6B7B;
    --border: #E4E0EC;
    --shadow: 0 2px 8px rgba(75,40,109,0.08);
    --shadow-lg: 0 8px 32px rgba(75,40,109,0.12);
    --radius: 12px;
    --radius-sm: 8px;
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

  .app { max-width: 1200px; margin: 0 auto; padding: 0 20px 60px; }

  /* Header */
  .header {
    background: var(--telus-purple);
    color: white;
    padding: 0 20px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 16px rgba(75,40,109,0.3);
  }
  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
  }
  .header-logo { display: flex; align-items: center; gap: 10px; }
  .header-logo-mark {
    width: 32px; height: 32px;
    background: var(--telus-green);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: var(--telus-purple);
  }
  .header-title { font-size: 15px; font-weight: 600; letter-spacing: -0.2px; }
  .header-subtitle { font-size: 11px; opacity: 0.7; letter-spacing: 0.5px; text-transform: uppercase; }
  .header-badge {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
  }

  /* View switcher */
  .view-tabs {
    display: flex;
    gap: 0;
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 0 20px;
    position: sticky;
    top: 60px;
    z-index: 99;
  }
  .view-tabs-inner { max-width: 1200px; margin: 0 auto; display: flex; }
  .tab-btn {
    padding: 14px 20px;
    border: none; background: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }
  .tab-btn.active { color: var(--telus-purple); border-bottom-color: var(--telus-purple); }
  .tab-btn:hover:not(.active) { color: var(--text); }

  /* Layout */
  .layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; padding-top: 24px; }
  @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

  /* Section */
  .section { margin-bottom: 20px; }
  .section-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
  }
  .section-icon {
    width: 36px; height: 36px;
    background: var(--telus-light-purple);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .section-title { font-size: 16px; font-weight: 600; }
  .section-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  /* Cards */
  .card {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
  }
  .card:hover { border-color: var(--telus-mid-purple); box-shadow: var(--shadow); }
  .card.selected {
    border-color: var(--telus-purple);
    background: var(--telus-light-purple);
    box-shadow: var(--shadow);
  }
  .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }

  /* Product toggle */
  .product-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 12px;
  }
  .product-toggle:hover { border-color: var(--telus-mid-purple); }
  .product-toggle.active { border-color: var(--telus-purple); background: var(--telus-light-purple); }
  .product-toggle-left { display: flex; align-items: center; gap: 12px; }
  .toggle-icon { font-size: 22px; }
  .toggle-name { font-size: 15px; font-weight: 600; }
  .toggle-desc { font-size: 12px; color: var(--text-muted); }
  .toggle-switch {
    width: 44px; height: 24px;
    background: var(--border);
    border-radius: 12px;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .toggle-switch.on { background: var(--telus-purple); }
  .toggle-switch::after {
    content: '';
    position: absolute;
    width: 18px; height: 18px;
    background: white;
    border-radius: 50%;
    top: 3px; left: 3px;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .toggle-switch.on::after { transform: translateX(20px); }

  /* Tier card */
  .tier-card {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .tier-card:hover { border-color: var(--telus-mid-purple); }
  .tier-card.selected { border-color: var(--telus-purple); background: var(--telus-light-purple); }
  .tier-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .tier-name { font-size: 14px; font-weight: 600; }
  .tier-data { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .tier-price { text-align: right; }
  .tier-amount { font-size: 20px; font-weight: 700; color: var(--telus-purple); }
  .tier-period { font-size: 11px; color: var(--text-muted); }
  .tier-features { list-style: none; }
  .tier-features li { font-size: 12px; color: var(--text-muted); padding: 3px 0; display: flex; gap: 6px; align-items: flex-start; }
  .tier-features li::before { content: '✓'; color: var(--telus-green-dark); font-weight: 700; flex-shrink: 0; }
  .tier-badge {
    display: inline-block;
    background: var(--telus-green);
    color: var(--telus-purple);
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Line selector */
  .line-selector { margin-top: 14px; }
  .line-selector-label { font-size: 13px; font-weight: 500; margin-bottom: 8px; color: var(--text-muted); }
  .line-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
  .line-btn {
    width: 40px; height: 40px;
    border: 1.5px solid var(--border);
    background: var(--white);
    border-radius: var(--radius-sm);
    font-size: 14px; font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .line-btn:hover { border-color: var(--telus-mid-purple); }
  .line-btn.selected { background: var(--telus-purple); color: white; border-color: var(--telus-purple); }

  /* Business info */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group label { font-size: 12px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .form-group input, .form-group select {
    padding: 10px 12px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    background: var(--white);
    color: var(--text);
    transition: border-color 0.15s;
    outline: none;
  }
  .form-group input:focus, .form-group select:focus { border-color: var(--telus-purple); }

  /* Quote panel */
  .quote-panel {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    position: sticky;
    top: 110px;
    overflow: hidden;
  }
  .quote-panel-header {
    background: var(--telus-purple);
    color: white;
    padding: 16px 18px;
  }
  .quote-panel-title { font-size: 14px; font-weight: 600; }
  .quote-panel-subtitle { font-size: 11px; opacity: 0.7; margin-top: 2px; }
  .quote-panel-body { padding: 18px; }

  .quote-line-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .quote-line-item:last-child { border-bottom: none; }
  .qli-name { font-size: 13px; font-weight: 500; }
  .qli-detail { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .qli-price { font-size: 14px; font-weight: 600; color: var(--telus-purple); white-space: nowrap; }

  .promo-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 8px 10px;
    background: #F0FAE6;
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
  }
  .promo-name { font-size: 12px; font-weight: 600; color: var(--telus-green-dark); }
  .promo-desc { font-size: 11px; color: var(--telus-green-dark); opacity: 0.8; margin-top: 2px; }
  .promo-amount { font-size: 13px; font-weight: 700; color: var(--telus-green-dark); white-space: nowrap; }

  .perk-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    background: var(--telus-light-purple);
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
  }
  .perk-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
  .perk-text { font-size: 12px; font-weight: 500; color: var(--telus-purple); }

  .quote-total-area {
    border-top: 2px solid var(--telus-purple);
    padding-top: 14px;
    margin-top: 14px;
  }
  .quote-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .quote-total-label { font-size: 15px; font-weight: 700; }
  .quote-total-amount { font-size: 24px; font-weight: 700; color: var(--telus-purple); }
  .quote-period { font-size: 12px; color: var(--text-muted); }

  .savings-banner {
    background: #F0FAE6;
    border: 1px solid #C3E6A0;
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .savings-text { font-size: 13px; font-weight: 600; color: var(--telus-green-dark); }

  .send-btn {
    width: 100%;
    background: var(--telus-green);
    color: var(--telus-purple);
    border: none;
    border-radius: var(--radius-sm);
    padding: 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 16px;
    transition: background 0.15s;
    letter-spacing: -0.2px;
  }
  .send-btn:hover { background: #55BB00; }
  .send-btn:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; }

  .empty-state {
    text-align: center;
    padding: 32px 20px;
    color: var(--text-muted);
  }
  .empty-state-icon { font-size: 36px; margin-bottom: 12px; }
  .empty-state-text { font-size: 13px; line-height: 1.6; }

  /* Customer view */
  .customer-view { max-width: 680px; margin: 24px auto; }
  .customer-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  .customer-header {
    background: var(--telus-purple);
    color: white;
    padding: 32px;
    text-align: center;
  }
  .customer-logo-mark {
    width: 48px; height: 48px;
    background: var(--telus-green);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 700; color: var(--telus-purple);
    margin: 0 auto 16px;
  }
  .customer-heading { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
  .customer-subheading { font-size: 14px; opacity: 0.8; }
  .customer-body { padding: 28px 32px; }
  .customer-section-title {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.8px;
    color: var(--text-muted);
    margin: 20px 0 10px;
  }
  .customer-section-title:first-child { margin-top: 0; }

  .narrative-box {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    font-size: 14px;
    line-height: 1.75;
    color: var(--text);
    margin-bottom: 20px;
    box-shadow: var(--shadow);
    position: relative;
  }
  .narrative-box p {
    margin: 0 0 10px;
  }
  .narrative-box p:last-of-type {
    margin-bottom: 0;
  }
  .narrative-rep {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
  }
  .narrative-rep-avatar {
    width: 32px; height: 32px;
    background: var(--telus-purple);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 13px; font-weight: 700;
    flex-shrink: 0;
  }
  .narrative-rep-name { font-size: 13px; font-weight: 600; color: var(--text); }
  .narrative-rep-title { font-size: 11px; color: var(--text-muted); }
  .narrative-loading {
    display: flex; align-items: center; gap: 10px;
    color: var(--text-muted); font-size: 13px;
  }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid var(--border);
    border-top-color: var(--telus-purple);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .product-line {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  .product-line:last-child { border-bottom: none; }
  .pl-left { display: flex; gap: 12px; align-items: flex-start; }
  .pl-icon {
    width: 36px; height: 36px;
    background: var(--telus-light-purple);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .pl-name { font-size: 14px; font-weight: 600; }
  .pl-detail { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .pl-price { font-size: 16px; font-weight: 700; color: var(--telus-purple); white-space: nowrap; }

  .customer-total-area {
    background: var(--telus-purple);
    color: white;
    padding: 20px 24px;
    border-radius: var(--radius-sm);
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ct-label { font-size: 16px; font-weight: 600; }
  .ct-period { font-size: 12px; opacity: 0.7; }
  .ct-amount { font-size: 28px; font-weight: 700; }

  .customer-promos { margin-top: 16px; }
  .customer-promo-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #F0FAE6;
    border-radius: var(--radius-sm);
    margin-bottom: 8px;
  }
  .cp-icon { font-size: 16px; }
  .cp-name { font-size: 13px; font-weight: 600; color: var(--telus-green-dark); }
  .cp-desc { font-size: 12px; color: var(--telus-green-dark); opacity: 0.8; }
  .cp-amount { margin-left: auto; font-size: 14px; font-weight: 700; color: var(--telus-green-dark); white-space: nowrap; }

  .customer-footer {
    padding: 20px 32px;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.6;
  }
  .telus-tagline {
    font-size: 13px;
    font-weight: 600;
    color: var(--telus-purple);
    margin-top: 8px;
  }

  /* Addons */
  .addon-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
  .addon-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s;
  }
  .addon-item:hover { border-color: var(--telus-mid-purple); }
  .addon-item.selected { background: var(--telus-light-purple); border-color: var(--telus-purple); }
  .addon-check {
    width: 16px; height: 16px;
    border: 2px solid var(--border);
    border-radius: 3px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .addon-check.checked { background: var(--telus-purple); border-color: var(--telus-purple); color: white; font-size: 10px; }
  .addon-name { font-size: 13px; flex: 1; }
  .addon-price { font-size: 13px; font-weight: 600; color: var(--telus-purple); }

  .info-box {
    background: var(--telus-light-purple);
    border: 1px solid #D4C4E8;
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-size: 12px;
    color: var(--telus-purple);
    margin-top: 10px;
    line-height: 1.5;
  }
`;

// ─── API Call ─────────────────────────────────────────────────────────────────
async function generateNarrative(cart, businessInfo) {
  const context = buildLLMContext(cart, businessInfo);
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return "Configure your Anthropic API key in .env (VITE_ANTHROPIC_API_KEY) to generate personalised proposals.";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are a TELUS Business sales rep writing a short personal note directly to a customer. The person reading this is a decision-maker or representative at the customer's company — someone who cares about their team's day-to-day operations and is evaluating whether this investment makes sense for their business. Write directly to them, as if you know their business and you're explaining in plain human terms why these specific products were put together for them.

${context}

Write a paragraph of 4 sentences. Use the specific product names, speeds, data amounts, features, and pricing from the context above. The paragraph must change meaningfully if the product selection changes. It must not read like a template.

Sentence 1: Describe a real day-to-day operational challenge this business faces, grounded in their industry and team size. Be specific.
Sentence 2: Explain how the exact products selected solve that challenge. Reference the actual tier names, speeds, data caps, coverage, or standout features from the context. Be concrete.
Sentence 3: Explain the financial case. Use the real savings amount and monthly total from the context. Make it clear why bundling makes sense for this business specifically.
Sentence 4: If there are products listed under "NOT YET INCLUDED" in the context, mention one of them as a natural next step for this type of business. Name it specifically, say what it does, and mention the price. If nothing is listed under "NOT YET INCLUDED", skip this sentence and write only 3 sentences.

Rules:
- Write like a person, not a brochure. Use contractions.
- Never use dashes or em dashes to connect clauses. No semicolons. No parentheses.
- No filler: "robust", "seamlessly", "leverage", "we are pleased", "cutting-edge", "dynamic".
- Address the business by name if one is provided.
- Every sentence must earn its place. If it could appear in any quote for any business, rewrite it.
- Write all product names, tier names, speeds, data amounts, and prices in ALL CAPS. For example: PUREFIBRE 1.5G, 100GB, $135/MO, BUSINESS 5G+ COMPLETE, 1500 MBPS.`,
      }],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || response.statusText);
  return data.content?.[0]?.text || "Unable to generate narrative at this time.";
}

// ─── Components ───────────────────────────────────────────────────────────────

function ProductToggle({ product, active, onToggle }) {
  return (
    <div
      className={`product-toggle ${active ? "active" : ""}`}
      onClick={onToggle}
    >
      <div className="product-toggle-left">
        <span className="toggle-icon">{product.icon}</span>
        <div>
          <div className="toggle-name">{product.name}</div>
          <div className="toggle-desc">{product.description}</div>
        </div>
      </div>
      <div className={`toggle-switch ${active ? "on" : ""}`} />
    </div>
  );
}

function InternetSection({ cart, setCart }) {
  const isActive = !!cart.internet;
  const selectedTier = cart.internet?.tierId || PRODUCTS.internet.tiers[0].id;

  const toggle = () => {
    if (isActive) {
      setCart(c => ({ ...c, internet: null }));
    } else {
      setCart(c => ({ ...c, internet: { tierId: PRODUCTS.internet.tiers[0].id } }));
    }
  };

  return (
    <div className="section">
      <ProductToggle
        product={PRODUCTS.internet}
        active={isActive}
        onToggle={toggle}
      />
      {isActive && (
        <div>
          {PRODUCTS.internet.tiers.map(tier => (
            <div
              key={tier.id}
              className={`tier-card ${selectedTier === tier.id ? "selected" : ""}`}
              onClick={() => setCart(c => ({ ...c, internet: { tierId: tier.id } }))}
            >
              <div className="tier-card-header">
                <div>
                  <div className="tier-name">{tier.name}</div>
                  <div className="tier-data">{tier.speed}</div>
                </div>
                <div className="tier-price">
                  <div className="tier-amount">${tier.price}</div>
                  <div className="tier-period">/mo · {tier.term}-mo term</div>
                </div>
              </div>
              <ul className="tier-features">
                {tier.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <div className="info-box" style={{ marginTop: 10 }}>{tier.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MobilitySection({ cart, setCart }) {
  const isActive = !!cart.mobility;
  const selectedTierId = cart.mobility?.tierId || 'mob_complete';
  const selectedLines = cart.mobility?.lines || 2;

  const toggle = () => {
    if (isActive) {
      setCart(c => ({ ...c, mobility: null }));
    } else {
      setCart(c => ({ ...c, mobility: { tierId: 'mob_complete', lines: 2 } }));
    }
  };

  return (
    <div className="section">
      <ProductToggle
        product={PRODUCTS.mobility}
        active={isActive}
        onToggle={toggle}
      />
      {isActive && (
        <div>
          <div className="card-grid">
            {PRODUCTS.mobility.tiers.map(tier => (
              <div
                key={tier.id}
                className={`tier-card ${selectedTierId === tier.id ? "selected" : ""}`}
                onClick={() => setCart(c => ({ ...c, mobility: { ...c.mobility, tierId: tier.id } }))}
              >
                {tier.multiLineDiscount > 0 && (
                  <div className="tier-badge">Most Popular</div>
                )}
                <div className="tier-card-header">
                  <div>
                    <div className="tier-name">{tier.name}</div>
                    <div className="tier-data">{tier.data} · {tier.coverage}</div>
                  </div>
                  <div className="tier-price">
                    <div className="tier-amount">${tier.price}</div>
                    <div className="tier-period">/line/mo</div>
                  </div>
                </div>
                <ul className="tier-features">
                  {tier.features.slice(0, 4).map(f => <li key={f}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="line-selector">
            <div className="line-selector-label">Number of Lines</div>
            <div className="line-buttons">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  className={`line-btn ${selectedLines === n ? "selected" : ""}`}
                  onClick={() => setCart(c => ({ ...c, mobility: { ...c.mobility, lines: n } }))}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SecuritySection({ cart, setCart }) {
  const isActive = !!cart.security;
  const selectedTierId = cart.security?.tierId || 'sec_monitor';
  const selectedAddons = cart.security?.addons || [];
  const isBundled = !!(cart.internet || cart.mobility);

  const toggle = () => {
    if (isActive) {
      setCart(c => ({ ...c, security: null }));
    } else {
      setCart(c => ({ ...c, security: { tierId: 'sec_monitor', addons: [] } }));
    }
  };

  const toggleAddon = (addonName) => {
    setCart(c => ({
      ...c,
      security: {
        ...c.security,
        addons: selectedAddons.includes(addonName)
          ? selectedAddons.filter(a => a !== addonName)
          : [...selectedAddons, addonName],
      }
    }));
  };

  const selectedTier = PRODUCTS.security.tiers.find(t => t.id === selectedTierId);

  return (
    <div className="section">
      <ProductToggle
        product={PRODUCTS.security}
        active={isActive}
        onToggle={toggle}
      />
      {isActive && (
        <div>
          <div className="card-grid">
            {PRODUCTS.security.tiers.map(tier => {
              const displayPrice = isBundled ? tier.bundledPrice : tier.price;
              const saves = tier.price - tier.bundledPrice;
              return (
                <div
                  key={tier.id}
                  className={`tier-card ${selectedTierId === tier.id ? "selected" : ""}`}
                  onClick={() => setCart(c => ({ ...c, security: { tierId: tier.id, addons: [] } }))}
                >
                  {isBundled && saves > 0 && (
                    <div className="tier-badge">Save ${saves}/mo bundled</div>
                  )}
                  <div className="tier-card-header">
                    <div>
                      <div className="tier-name">{tier.name}</div>
                    </div>
                    <div className="tier-price">
                      {isBundled && saves > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>${tier.price}/mo</div>
                      )}
                      <div className="tier-amount">${displayPrice}</div>
                      <div className="tier-period">/mo</div>
                    </div>
                  </div>
                  <ul className="tier-features">
                    {tier.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
          {selectedTier?.addons?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="line-selector-label">Optional Add-ons</div>
              <div className="addon-list">
                {selectedTier.addons.map(addon => (
                  <div
                    key={addon.name}
                    className={`addon-item ${selectedAddons.includes(addon.name) ? "selected" : ""}`}
                    onClick={() => toggleAddon(addon.name)}
                  >
                    <div className={`addon-check ${selectedAddons.includes(addon.name) ? "checked" : ""}`}>
                      {selectedAddons.includes(addon.name) && "✓"}
                    </div>
                    <span className="addon-name">{addon.name}</span>
                    <span className="addon-price">+${addon.price}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuotePanel({ cart, onSendToCustomer }) {
  const quote = calculateQuote(cart);
  const hasItems = cart.internet || cart.mobility || cart.security;
  const isBundled = !!(cart.internet || cart.mobility);

  if (!hasItems) {
    return (
      <div className="quote-panel">
        <div className="quote-panel-header">
          <div className="quote-panel-title">Quote Summary</div>
          <div className="quote-panel-subtitle">Select products to build your quote</div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">Toggle products on the left to start building a quote for your customer.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-panel">
      <div className="quote-panel-header">
        <div className="quote-panel-title">Quote Summary</div>
        <div className="quote-panel-subtitle">Live pricing · updates automatically</div>
      </div>
      <div className="quote-panel-body">
        {cart.internet && (() => {
          const tier = PRODUCTS.internet.tiers.find(t => t.id === cart.internet.tierId);
          return tier ? (
            <div className="quote-line-item">
              <div>
                <div className="qli-name">📡 Business Internet</div>
                <div className="qli-detail">{tier.name}</div>
              </div>
              <div className="qli-price">${tier.price}/mo</div>
            </div>
          ) : null;
        })()}

        {cart.mobility && (() => {
          const tier = PRODUCTS.mobility.tiers.find(t => t.id === cart.mobility.tierId);
          const total = getMobilityTotal(cart.mobility.tierId, cart.mobility.lines);
          return tier ? (
            <div className="quote-line-item">
              <div>
                <div className="qli-name">📱 Business Mobility</div>
                <div className="qli-detail">{cart.mobility.lines} × {tier.name} ({tier.data})</div>
              </div>
              <div className="qli-price">${total}/mo</div>
            </div>
          ) : null;
        })()}

        {cart.security && (() => {
          const tier = PRODUCTS.security.tiers.find(t => t.id === cart.security.tierId);
          const price = getSecurityPrice(cart.security.tierId, isBundled, cart.security.addons || []);
          return tier ? (
            <div className="quote-line-item">
              <div>
                <div className="qli-name">🔒 Business Security</div>
                <div className="qli-detail">
                  {tier.name}
                  {cart.security.addons?.length > 0 && ` + ${cart.security.addons.join(', ')}`}
                </div>
              </div>
              <div className="qli-price">${price}/mo</div>
            </div>
          ) : null;
        })()}

        {quote.promos.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {quote.promos.filter(p => !p.isPerk).map(promo => (
              <div key={promo.id} className="promo-item">
                <div>
                  <div className="promo-name">🏷️ {promo.name}</div>
                  <div className="promo-desc">{promo.description}</div>
                </div>
                <div className="promo-amount">-${promo.amount}/mo</div>
              </div>
            ))}
            {quote.promos.filter(p => p.isPerk).map(promo => (
              <div key={promo.id} className="perk-item">
                <div className="perk-icon">⭐</div>
                <div className="perk-text">{promo.name} included</div>
              </div>
            ))}
          </div>
        )}

        <div className="quote-total-area">
          <div className="quote-total-row">
            <div>
              <div className="quote-total-label">Monthly Total</div>
              <div className="quote-period">Estimated · taxes extra</div>
            </div>
            <div className="quote-total-amount">${quote.total}/mo</div>
          </div>

          {quote.savings > 0 && (
            <div className="savings-banner">
              <span>💚</span>
              <span className="savings-text">You're saving ${quote.savings}/mo vs individual pricing</span>
            </div>
          )}
        </div>

        <button className="send-btn" onClick={onSendToCustomer}>
          Generate Customer Proposal →
        </button>
      </div>
    </div>
  );
}

function CustomerView({ cart, businessInfo }) {
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(true);
  const quote = calculateQuote(cart);
  const isBundled = !!(cart.internet || cart.mobility);

  useEffect(() => {
    setLoading(true);
    generateNarrative(cart, businessInfo)
      .then(text => { setNarrative(text); setLoading(false); })
      .catch(() => { setNarrative('Unable to generate narrative at this time.'); setLoading(false); });
  }, []);

  return (
    <div className="customer-view">
      <div className="customer-card">
        <div className="customer-header">
          <div className="customer-logo-mark">T</div>
          <div className="customer-heading">
            Your TELUS Business Proposal
            {businessInfo.businessName && ` for ${businessInfo.businessName}`}
          </div>
          <div className="customer-subheading">
            Prepared by your TELUS Business representative
          </div>
        </div>

        <div className="customer-body">
          <div className="customer-section-title">Why this package works for you</div>
          {loading ? (
            <div className="narrative-box">
              <div className="narrative-loading">
                <div className="spinner" />
                Personalising your proposal...
              </div>
            </div>
          ) : (
            <div className="narrative-box">
              {narrative.split(/(?<=[.!?])\s+/).map((sentence, i) => (
                <p key={i}>{sentence}</p>
              ))}
              <div className="narrative-rep">
                <div className="narrative-rep-avatar">TR</div>
                <div>
                  <div className="narrative-rep-name">Your TELUS Business Rep</div>
                  <div className="narrative-rep-title">SMB Account Manager · TELUS Business</div>
                </div>
              </div>
            </div>
          )}

          <div className="customer-section-title">Your Selected Products</div>

          {cart.internet && (() => {
            const tier = PRODUCTS.internet.tiers.find(t => t.id === cart.internet.tierId);
            return tier ? (
              <div className="product-line">
                <div className="pl-left">
                  <div className="pl-icon">📡</div>
                  <div>
                    <div className="pl-name">Business Internet</div>
                    <div className="pl-detail">{tier.name} · {tier.speed}</div>
                  </div>
                </div>
                <div className="pl-price">${tier.price}/mo</div>
              </div>
            ) : null;
          })()}

          {cart.mobility && (() => {
            const tier = PRODUCTS.mobility.tiers.find(t => t.id === cart.mobility.tierId);
            const total = getMobilityTotal(cart.mobility.tierId, cart.mobility.lines);
            return tier ? (
              <div className="product-line">
                <div className="pl-left">
                  <div className="pl-icon">📱</div>
                  <div>
                    <div className="pl-name">Business Mobility</div>
                    <div className="pl-detail">{cart.mobility.lines} lines · {tier.name} · {tier.data} {tier.coverage}</div>
                  </div>
                </div>
                <div className="pl-price">${total}/mo</div>
              </div>
            ) : null;
          })()}

          {cart.security && (() => {
            const tier = PRODUCTS.security.tiers.find(t => t.id === cart.security.tierId);
            const price = getSecurityPrice(cart.security.tierId, isBundled, cart.security.addons || []);
            return tier ? (
              <div className="product-line">
                <div className="pl-left">
                  <div className="pl-icon">🔒</div>
                  <div>
                    <div className="pl-name">Business Security — {tier.name}</div>
                    {cart.security.addons?.length > 0 && (
                      <div className="pl-detail">Includes: {cart.security.addons.join(', ')}</div>
                    )}
                  </div>
                </div>
                <div className="pl-price">${price}/mo</div>
              </div>
            ) : null;
          })()}

          {quote.promos.length > 0 && (
            <div className="customer-promos">
              <div className="customer-section-title">Savings & Perks Applied</div>
              {quote.promos.filter(p => !p.isPerk).map(promo => (
                <div key={promo.id} className="customer-promo-item">
                  <span className="cp-icon">🏷️</span>
                  <div>
                    <div className="cp-name">{promo.name}</div>
                    <div className="cp-desc">{promo.description}</div>
                  </div>
                  <div className="cp-amount">-${promo.amount}/mo</div>
                </div>
              ))}
              {quote.promos.filter(p => p.isPerk).map(promo => (
                <div key={promo.id} className="customer-promo-item">
                  <span className="cp-icon">⭐</span>
                  <div>
                    <div className="cp-name">{promo.name}</div>
                    <div className="cp-desc">{promo.description}</div>
                  </div>
                  <div className="cp-amount" style={{ color: 'var(--telus-purple)' }}>Included</div>
                </div>
              ))}
            </div>
          )}

          <div className="customer-total-area">
            <div>
              <div className="ct-label">Total Monthly Investment</div>
              <div className="ct-period">Estimated · taxes and fees extra</div>
            </div>
            <div className="ct-amount">${quote.total}/mo</div>
          </div>

          {quote.savings > 0 && (
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--telus-green-dark)', fontWeight: 600 }}>
              💚 You're saving ${quote.savings}/mo by bundling TELUS products
            </div>
          )}
        </div>

        <div className="customer-footer">
          Pricing shown is estimated and subject to applicable taxes, fees, and final verification.
          Product availability may vary by location. Contact your TELUS Business representative for complete details.
          <div className="telus-tagline">the future is friendly®</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('builder'); // 'builder' | 'customer'
  const [cart, setCart] = useState({
    internet: null,
    mobility: null,
    security: null,
  });
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    industry: '',
    employees: '1-10',
  });

  const hasItems = cart.internet || cart.mobility || cart.security;

  return (
    <>
      <style>{styles}</style>
      <div className="header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="header-logo-mark">T</div>
            <div>
              <div className="header-title">SMB Quote Builder</div>
              <div className="header-subtitle">TELUS Business · Agentic AI Sales Team</div>
            </div>
          </div>
          <div className="header-badge">Prototype v0.1</div>
        </div>
      </div>

      <div className="view-tabs">
        <div className="view-tabs-inner">
          <button className={`tab-btn ${view === 'builder' ? 'active' : ''}`} onClick={() => setView('builder')}>
            🛠️ Quote Builder
          </button>
          <button
            className={`tab-btn ${view === 'customer' ? 'active' : ''}`}
            onClick={() => hasItems && setView('customer')}
            style={{ opacity: hasItems ? 1 : 0.4, cursor: hasItems ? 'pointer' : 'not-allowed' }}
          >
            📄 Customer View
          </button>
        </div>
      </div>

      <div className="app">
        {view === 'builder' ? (
          <div className="layout">
            <div>
              {/* Business info */}
              <div className="section">
                <div className="section-header">
                  <div className="section-icon">🏢</div>
                  <div>
                    <div className="section-title">Customer Details</div>
                    <div className="section-subtitle">Used to personalise the proposal narrative</div>
                  </div>
                </div>
                <div style={{ background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 18 }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Business Name</label>
                      <input
                        placeholder="e.g. Henderson HVAC Services"
                        value={businessInfo.businessName}
                        onChange={e => setBusinessInfo(b => ({ ...b, businessName: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Industry</label>
                      <input
                        placeholder="e.g. Home Services / HVAC"
                        value={businessInfo.industry}
                        onChange={e => setBusinessInfo(b => ({ ...b, industry: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Team Size</label>
                      <select value={businessInfo.employees} onChange={e => setBusinessInfo(b => ({ ...b, employees: e.target.value }))}>
                        <option>1-5 employees</option>
                        <option>6-10 employees</option>
                        <option>11-20 employees</option>
                        <option>21-30 employees</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="section-header">
                <div className="section-icon">📦</div>
                <div>
                  <div className="section-title">Select Products</div>
                  <div className="section-subtitle">Toggle products on to configure and price them</div>
                </div>
              </div>
              <InternetSection cart={cart} setCart={setCart} />
              <MobilitySection cart={cart} setCart={setCart} />
              <SecuritySection cart={cart} setCart={setCart} />
            </div>

            <QuotePanel cart={cart} onSendToCustomer={() => hasItems && setView('customer')} />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <button
                onClick={() => setView('builder')}
                style={{
                  background: 'none', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                  color: 'var(--text-muted)',
                }}
              >
                ← Back to Quote Builder
              </button>
            </div>
            <CustomerView cart={cart} businessInfo={businessInfo} />
          </div>
        )}
      </div>
    </>
  );
}
