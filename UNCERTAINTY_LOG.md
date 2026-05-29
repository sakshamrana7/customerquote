# Uncertainty Log

*2-3 specific places where I am not fully confident in how the AI-generated code handles pricing logic or edge cases.*

---

## 1. Multi-Line Mobility Discount Logic

**What I am uncertain about:**
The TELUS website shows that plans like Business 5G+ Complete include a "$20 TELUS multi-line discount" built into the displayed price. I am not fully confident whether this $20 discount applies per line (meaning the first line does not get it) or whether it is a flat discount that makes the per-line price $20 cheaper for all lines on the account.

**What I assumed:**
I treated the displayed price ($45/mo for 5G+ Complete) as the per-line price for any number of lines, meaning 3 lines = $135/mo total. This may understate the cost for single-line accounts where the multi-line discount technically should not apply.

**Why this matters:**
If a rep is quoting a single line, the real price might be $65/mo ($45 + $20 that would normally be the multi-line discount), not $45/mo. This could cause a rep to quote too low and create an expectation mismatch when the customer receives their bill.

**What I would do in production:**
Integrate with TELUS's internal pricing API to get exact per-line pricing based on account size, or add a footnote to the quote warning that pricing is estimated and subject to verification.

---

## 2. Bundle Discount Stacking Logic

**What I am uncertain about:**
I apply the $10 bundle discount (Internet + Mobility) and the $10 security bundle discount as separate, stackable promos. I am not confident these two discounts can actually stack simultaneously, or whether TELUS caps the total bundle discount at a single amount.

**What I assumed:**
Both discounts apply independently. So a customer with Internet + Mobility + Security (Monitor) saves $10 (bundle) + $10 (security bundled price difference) = $20/mo total savings.

**Why this matters:**
If TELUS only applies one bundle discount per account, the quote total shown to the customer would be lower than what TELUS would actually charge. A rep sending this quote could create a pricing promise they cannot deliver.

**What I would do in production:**
Get explicit clarification from TELUS pricing team on discount stacking rules. Add a note to the quote saying "savings are estimated and subject to bundle eligibility verification."

---

## 3. Security Bundled Pricing vs. Promotional Pricing

**What I am uncertain about:**
The security bundled prices ($40 for Monitor instead of $50, $50 for Protect instead of $60) are shown on the TELUS website as "when bundled with eligible TELUS Business service" on a 36-month term. My tool applies these bundled prices whenever any other TELUS product is in the cart, but I am not sure if both conditions must be true simultaneously — i.e. does the customer need a 36-month contract on the security product specifically, or does bundling with an eligible internet/mobility plan automatically qualify them?

**What I assumed:**
If the customer has Internet or Mobility in the cart, the bundled security price applies automatically regardless of contract length on the security product.

**Why this matters:**
If the 36-month security contract is a hard requirement for the bundled price, a customer who selects a shorter security term would be charged $10/mo more than what the quote shows. The customer-facing proposal would be inaccurate.

**What I would do in production:**
Add a contract term selector to the security section and only apply bundled pricing when the rep selects a 36-month security term. Flag this in the UI with a tooltip explaining the condition.
