# TELUS SMB Quote Builder
**Prototype v0.1 · Built for TELUS SMB Agentic AI Sales Team**

---

## What I Built

A rep-facing SMB Quote Builder that lets a TELUS sales rep select products, configure a multi-product order, and generate a professional proposal ready to send to a customer — in under 2 minutes.

**Core features:**
- Interactive product selector with live pricing updates
- Three TELUS SMB products: Business Internet, Business Mobility, Business Security
- Real-time quote summary with running totals
- Automated promotional pricing rules
- AI-generated personalised proposal narrative (Claude API) — grounded in the specific tier, speed, data, features, and pricing configured by the rep
- Clean customer-facing proposal view with selected products, configured features, pricing, promotions, and AI narrative

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Add your Anthropic API key
echo "VITE_ANTHROPIC_API_KEY=your_key_here" > .env

# Start the dev server
npm run dev
# Open http://localhost:5173

# Run tests
npm test
```

---

## Product Data Sources

All pricing sourced directly from **telus.com/en/business** (verified May 2026).

**Business Internet:**
- PureFibre 1.5G + Business Wi-Fi: $120/mo on 3-year term
- Includes: 1500 Mbps download, 940 Mbps upload, Business Wi-Fi, Wi-Fi 6
- Available with TELUS Business Bundles only

**Business Mobility (BYOD):**
- Business 5G Standard: $60/mo · 100GB Canada
- Business 5G+ Complete: $45/mo · 100GB Canada (includes $10 pre-auth + $20 multi-line discount)
- Business 5G+ Complete CAN-US: $55/mo · 200GB Canada+US
- Business 5G+ Complete Unlimited: $85/mo · Unlimited Canada

**Business Security:**
- Smart Camera: $20/mo (self-monitored)
- Monitor: $50/mo standalone · $40/mo bundled (saves $10)
- Protect: $60/mo standalone · $50/mo bundled (saves $10)

---

## Promotional Rules

**Rule 1 — Business Bundle Discount**
- Trigger: Internet + Mobility both selected
- Discount: $10/mo off the combined package
- Source: TELUS bundle savings visible on telus.com/en/business/bundles
- How it surfaces: Shown as a line item in the quote summary with amount

**Rule 2 — Security Bundle Savings**
- Trigger: Security selected alongside Internet or Mobility
- Discount: $10/mo (Monitor and Protect both drop $10/mo when bundled)
- Source: "Save $10 monthly when bundled with TELUS Business services" — telus.com/en/business/security
- How it surfaces: Bundled price shown on tier card with strikethrough of standalone price + promo line in summary

**Rule 3 — Priority Queue + Dedicated Success Manager (Perk)**
- Trigger: 2 or more products selected
- Discount: $0 (value perk, not monetary)
- Source: TELUS Business premium support offering — telus.com/en/business
- How it surfaces: Shown as a star perk in the quote summary and customer proposal

---

## Tech Stack

- **React 18** — component-based UI with hooks
- **Vite** — build tooling and dev server
- **Vitest** — unit tests for pricing logic
- **Claude API (claude-sonnet-4-6)** — AI-generated proposal narratives
- **DM Sans + DM Mono** — typography
- **CSS-in-JS (style tag)** — no external CSS framework, full control

**AI tools used in development:**
- Claude Code for component scaffolding and refactoring
- Cursor for inline editing and debugging

---

## AI-Generated vs. What I Directed

**What I directed and own:**

- The product concept, scope, and feature set
- All product data, pricing, and tier structures — sourced and verified manually from telus.com/en/business
- All promotional rules and the logic for how discounts stack
- The decision to use a component-based quote builder rather than fixed bundle packages
- The AI narrative prompt — written, iterated, and refined by me to produce specific, non-generic output grounded in the configured quote
- The context passed to Claude — structured to include real tier names, speeds, data caps, features, and savings figures so the narrative changes meaningfully with each product selection
- All test cases and pricing edge case decisions (documented in UNCERTAINTY_LOG.md)

**What AI helped generate:**

- React component structure and CSS styling (scaffolded via Claude Code, reviewed and adjusted by me)
- Utility function boilerplate (`calculateQuote`, `getCartSummary`, `buildLLMContext`) — logic designed by me, implementation assisted by AI
- Inline refactors and debugging during development

---

## What I Would Improve

1. **CRM integration** — the business name and industry fields are manual today. In production this would pull from Salesforce or TELUS's internal CRM automatically when a rep opens the tool for a specific account.

2. **More product coverage** — Business Connect (phone system), Business Wi-Fi as a standalone add-on, and the full bundle plan structures (Business Connect Bundle at $205/mo, Business Secure Bundle at $245/mo) would be the natural next additions.

3. **Quote persistence** — quotes disappear on page refresh. A rep needs to be able to save, share, and resume a quote. Backend storage with rep authentication would solve this.

4. **Pricing accuracy verification** — TELUS pricing has footnotes and conditions that are difficult to capture fully from the public website. The tool should integrate with TELUS's internal pricing engine for production use.

5. **Mobile responsiveness** — the two-column layout needs adaptation for tablet and phone use cases.

---

## Scoping Decisions

**Internet:** I included only the PureFibre 1.5G + Business Wi-Fi tier because it was the only clearly priced standalone internet product on the TELUS Business site. Lower speed tiers may exist but pricing was not clearly surfaced publicly.

**Mobility:** I used BYOD (Bring Your Own Device) pricing as the baseline since it represents the clearest per-line cost for SMB customers not bundling a new device purchase.

**Security:** I included all three security tiers (Smart Camera, Monitor, Protect) as they were clearly priced and directly relevant to the 1-30 employee SMB segment.

**Bundle pricing:** Rather than replicating the full Business Connect Bundle ($205/mo) and Business Secure Bundle ($245/mo) as fixed packages, I chose a component-based approach where reps configure individual products. This gives more flexibility and better reflects how reps actually sell. Bundle savings are applied automatically as promotions.
