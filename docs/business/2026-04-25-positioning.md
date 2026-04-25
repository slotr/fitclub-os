# Positioning Canvas — Fitness Member Management Platform

**Date:** 2026-04-25
**Status:** Draft v1, ready for kill-test against 5-10 prospects
**Framework:** April Dunford's "Obviously Awesome" positioning canvas + messaging layer

---

## Strategic decisions (locked before drafting)

| Decision | Choice | Rationale |
|---|---|---|
| Target tier | **Mid-market ($149-249/mo)** | Founder's feature set (rotating-QR, native WhatsApp, modern app, hybrid data model) is wasted on SMB price-tolerance; matches what 600-member hybrid gyms pay Glofox today |
| Geographic focus (year 1) | **WhatsApp-dominant markets**: EU south (ES/IT/GR/PT), MENA (AE/SA/EG), Turkey, India, LatAm | Where SMS is dead, US-centric vendors leave engagement on the table, Glofox/Mindbody have weak local game |
| Primary buyer | **Owner-operator of a hybrid gym, 300-1,500 members, single-to-3 locations, age 28-45, English-speaking** | Decides on instinct + ROI math; not procurement-led; lives on WhatsApp personally |
| GTM motion | **Founder-led sales + partnerships**, not self-serve initially | Mid-market doesn't trust SaaS without a human until ~$2k MRR cohort exists |
| Sales-cycle target | **14-30 days** | Ambitious but realistic for mid-market hybrid where pain is acute (Glofox renewal coming up, member churning) |

---

## 1. Competitive alternatives

What would the buyer realistically use if we did not exist?

| Alt | Why they'd choose it | Why they'd hate it |
|---|---|---|
| **ABC Glofox** | Recognized brand, branded app, "the safe pick" | Branded app costs extra, no native WhatsApp, txn fees on top, sales-gated pricing, ABC Fitness post-acquisition support quality slipped |
| **Mindbody** | Marketplace traffic, "everyone uses it" | Expensive ($300-600/mo + 2.99% txn), dated screens, no WhatsApp, slow product velocity |
| **Wellyx** | $99-299 flat all-in-one | Newer brand, support reportedly variable, WhatsApp is marketing-speak (Twilio under hood with no template flow), no rotating-QR |
| **Virtuagym** | Coaching + club hybrid, EU presence | Pricing opacity + setup fees, dated in places, weak self-service signup |
| **Mindbody + Keepme overlay** | "We get the marketplace AND AI retention" | Two SaaS bills, two integrations, two support teams — total spend $600-1,500/mo |
| **DIY: Stripe + Calendly + WhatsApp Business + Notion + spreadsheets** | Free-ish, full control | Owner becomes the integration; breaks at 100+ members; no member experience |

**Reality check:** for our exact ICP (hybrid gym, 300-1,500 members, mid-market budget), **Glofox is the deal we win or lose against ~70% of the time.** Wellyx and Mindbody are the next 25%. DIY is the day-zero competitor at <200 members.

---

## 2. Unique attributes

What we have that alternatives don't.

| Attribute | Strength | Defensibility |
|---|---|---|
| **Native WhatsApp transactional channel** with pre-approved Meta templates for the gym lifecycle | High | Medium — anyone can build, but Meta template approval + lifecycle catalog is 6-12 months of operator work |
| **Rotating-TOTP QR check-in** instead of static QR or biometric turnstile | High | Medium — engineering is straightforward, but pitch is hard to copy without admitting their static QR is insecure |
| **Hybrid-first data model** (open gym + class + PT in one schema) | High | High — incumbents would need a from-scratch rewrite to match cleanly; bolt-ons stay obvious |
| **Modern light-theme member app** built consumer-app-grade (Expo + React Native) | Medium | Low — anyone can rebuild, but most won't; UX is a lagging indicator of a healthy team |
| **Stripe-native subscription self-service** with member-facing card update + receipt + upgrade | Medium | Low — Stripe Checkout is a commodity; the polish is in the flow design |
| **Telegram channel as a second-class citizen** (cheap to ship, no one else has it) | Low | Low — easy to copy, but creates "they have everything" optics |
| **No biometric data captured anywhere** | Medium | High — incumbents who sell biometric turnstiles can't credibly counter |
| **Built on Postgres + RLS multi-tenant from day one** | Low (buyer-invisible) | Medium — affects how cheaply we can scale, not how we sell |

---

## 3. Value themes

What those attributes enable for the buyer. Three themes, ranked by buying power.

### Theme A: "Your members already live on WhatsApp. Your software should too."
**Pain:** Members miss class reminders sent by SMS or email. Front desk reminds via WhatsApp manually. Owner pays Glofox $250/mo *plus* Twilio $80/mo *plus* still does manual outreach. WhatsApp Business app sits open on the front desk laptop.
**Value we deliver:**
- Every transactional event (welcome, payment receipt, class reminder, waitlist promotion, payment failed, churn save) hits WhatsApp by default with pre-approved Meta templates.
- Two-way replies route into the admin inbox.
- No Twilio glue work, no Meta template approval rabbit hole — handled.
**Buying trigger:** Owner is staring at WhatsApp Business app + a SaaS invoice and wondering why they pay both.

### Theme B: "Stop paying for stolen workouts."
**Pain:** Members screenshot their static QR and share it with friends/family. Front desk has no way to detect. Owner suspects 5-15% revenue leakage. Biometric turnstile costs $3-8k per door + $40-80/mo per reader and triggers privacy/compliance worries.
**Value we deliver:**
- Rotating-TOTP QR refreshes every 30s on the member's phone. A screenshot is worthless 31 seconds later.
- Server replay-rejects already-used codes.
- No biometric data captured = no GDPR Article 9 / CCPA / Illinois BIPA exposure.
- Operator skips the turnstile capex; uses a $300 tablet at the door.
**Buying trigger:** Owner just had a "weird" walk-in (a friend of a member used their QR) or just got a privacy questionnaire from their insurer/landlord.

### Theme C: "One platform for open gym, classes, and PT. No more spreadsheets."
**Pain:** Owner runs an open-gym subscription on Glofox, group classes on Mindbody marketplace, PT packages on a Google Sheet. Three logins, three reports, one accountant who hates them.
**Value we deliver:**
- One data model where a member can have a monthly subscription, class bookings, and a PT package simultaneously.
- One report showing revenue by mode (subscription vs class drop-in vs PT pack).
- One inbox, one app, one bill.
**Buying trigger:** Owner just lost a member because they couldn't see that the member also bought a 10-pack of PT sessions before letting them cancel.

---

## 4. Best-fit customer (who cares a lot)

The narrower this is, the easier to sell, the easier to build.

**Primary segment (year 1):**
- Hybrid gym (open gym + group classes + PT packages — *not* pure CrossFit, *not* pure boutique pilates)
- 300-1,500 active paying members
- 1-3 locations, single-owner or husband-and-wife operator
- Owner age 28-45, English-fluent or English-comfortable
- Geography: Turkey, UAE, Spain, Italy, Greece, Egypt, India metro tier-1, Mexico, Brazil
- Currently using: Glofox / Mindbody / Wellyx / a local 2015-era tool / DIY spreadsheets
- Monthly software spend today: $150-450 across 1-3 tools
- Member-app NPS today: low — they get complaints about the existing app
- WhatsApp usage: extreme (personal + business, multiple groups)
- Pain visibility: explicit — they have already complained about their current vendor on at least one social channel or in conversation

**Secondary segments (year 2):**
- Multi-location franchises in same geography (3-15 sites)
- Boutique cycle/yoga (replace Mariana Tek) where modern app is the wedge

**Anti-customer (decline gracefully):**
- Pure CrossFit affiliates → send to Wodify
- Solo PTs without a facility → send to Trainerize
- 2,000+ member multi-club enterprise → not yet
- Owners who buy on RFP and procurement → not yet
- Owners who don't use WhatsApp personally → wrong wedge

---

## 5. Market category (frame of reference)

The buyer's first question: "what is this thing?"

**We are:** *"WhatsApp-native gym software"*

Not:
- "another Glofox alternative" (frames us as cheaper-clone, race to the bottom)
- "AI-powered fitness platform" (overpromises, attracts wrong-fit buyers)
- "all-in-one studio software" (commoditizes us alongside Wellyx)
- "modern Mindbody" (compares us to a thing buyers already think is bloated)

**Why "WhatsApp-native":**
1. It's a category buyers already understand without explanation.
2. It immediately segments our buyer (WhatsApp-heavy markets) from the wrong-fit buyer (US gyms).
3. It's defensible — no incumbent can claim it without rebuilding their messaging stack.
4. It anchors the modern-app + hybrid + rotating-QR features as expressions of one coherent thesis ("we built this for the WhatsApp generation of gym owners"), not as a feature checklist.

---

## 6. Tagline + messaging

### Tagline
**"WhatsApp-native gym software. The modern way to run a hybrid gym."**

Alternatives to test:
- "The gym software your members will actually open."
- "Run your gym from WhatsApp."
- "Glofox, but built for the WhatsApp generation."

### 30-second elevator pitch
*"We build gym management software for hybrid gyms in WhatsApp-first markets. Every payment receipt, class reminder, and waitlist promotion goes out on WhatsApp by default — no Twilio glue, no Zapier. Members check in with a rotating QR code that refreshes every 30 seconds, so screenshot-sharing stops being a revenue leak. And it's one platform for open gym, classes, and PT — no more three SaaS tools and a spreadsheet. Half the price of Glofox, native to your market."*

### 90-second pain → solution narrative

> "If you run a 600-member hybrid gym in Istanbul or Madrid or Dubai today, here's your week.
>
> You pay Glofox or Mindbody $300 a month for member management. Plus Twilio $80 a month for the WhatsApp messages your members actually open. Plus your front-desk staff spends 2 hours a day manually messaging waitlist members on WhatsApp Business. Plus your PT packages live in a Google Sheet because the platform doesn't really support them. Plus 8% of your check-ins are members sharing their QR with friends, and you know it.
>
> We built the platform that fixes all of that.
>
> WhatsApp is the channel — pre-approved templates for every gym lifecycle event, two-way replies routing into your admin inbox, no Twilio glue.
>
> Rotating QR is the check-in — your members' codes refresh every 30 seconds. Screenshots become useless. No biometric turnstiles, no privacy paperwork.
>
> One data model — open gym, classes, PT, all in one schema, one report, one bill.
>
> Half the price of Glofox. Native to your market. We onboard you in 14 days."

### Proof points (build in months 1-6 of selling)
- 5 case studies from design partners with named owners + photos + specific metrics (% revenue recovered from QR rotation, hours saved on WhatsApp manual outreach, member-app DAU vs Glofox baseline)
- 1 "Day in the life" Loom video from each design partner
- One transparent pricing page (no sales gate)
- One public-facing demo gym (anyone can sign up as a member, see the flow)
- KVKK / GDPR / SOC 2 readiness page (not certs yet, but documented posture)

### Objection handling

**"How do I know you'll be around in 3 years?"**
→ "We're charging real money from day one. We are not VC-funded yet by design — every customer is profit, not runway. Here's our 12-month roadmap and the data on customer retention." (Be ready with this honestly. If founder pivots, customers eat it.)

**"Glofox is bigger / safer."**
→ "Glofox is bigger. They are also more expensive, charge for the branded app extra, and don't have native WhatsApp. The question isn't size — it's whether their product fits how your members actually communicate. Try a 30-day pilot."

**"What if you get acquired by ABC Fitness too?"**
→ "Possible. We're charging real money so the company is durable on its own. If we sell, we sell to someone who keeps shipping — that's a contractual term in our roadmap promise."

**"Why should I pay $199/mo when Wellyx is $99?"**
→ "Wellyx is great if all-in-one cheap is the priority. We're a different bet — WhatsApp-native and hybrid-first. Test both for 30 days, your members will tell you."

**"My members are old, they don't want apps."**
→ "Your members are on WhatsApp. We meet them there. The app is for the 30% who want self-service; the WhatsApp flow is for everyone."

**"Do you do biometric / face / fingerprint?"**
→ "No, on purpose. We use rotating QR codes that change every 30 seconds — same anti-fraud, no biometric data captured, no compliance paperwork. If you want hardware turnstiles for a 24/7 access setup, we integrate with the standard ones, but we don't sell or require them."

**"Is your team big enough?"**
→ "We're small and shipping faster than the incumbents because of it. Here's our last 90 days of changelog. You'll have a direct line to the founder during onboarding."

---

## 7. Positioning summary in one paragraph (the "billboard test")

> *We are the WhatsApp-native gym management platform for hybrid gyms in WhatsApp-first markets. Every member-facing message — payment receipts, class reminders, waitlist promotions, churn saves — runs on WhatsApp by default with pre-approved Meta templates, no Twilio glue. Members check in with a rotating QR code that refreshes every 30 seconds, ending screenshot-sharing without biometric data. Open gym, classes, and PT live in one data model with one bill. Half the price of Glofox, native to your market, onboarded in 14 days. Built for hybrid gyms running 300-1,500 members in Turkey, EU south, MENA, India, and LatAm.*

---

## 8. What to test before locking this

Before scaling sales or building the rest of the product, take this canvas to **8-12 owner-operators in the target ICP** for 30-minute calls. The questions that must be answered:

1. **Is the WhatsApp pain real and acute, or are we projecting?** If 8/12 owners say "WhatsApp is fine, our SMS works" — kill Theme A as primary, demote it.
2. **Is the QR-sharing pain real?** If owners say "we don't see it" — demote Theme B, reframe as security feature, not revenue feature.
3. **Are they actually buying hybrid?** If they describe themselves purely as "we're a class place" or "we're a gym, no classes" — the hybrid angle isn't a wedge, it's a niche.
4. **Will they pay $149-249/mo?** If everyone says "we'd pay $79/mo" — we're targeting wrong tier; rewrite for SMB.
5. **Do they recognize Glofox / Mindbody / Wellyx as alternatives?** If the answer is "I haven't heard of any of those" — we've got a different competitor map and our analysis is wrong.
6. **What would make them switch in 30 days vs 6 months?** Sales-cycle calibration.

If 6/8 prospects nod along to the 90-second narrative and ask "when can I see it?" — positioning is locked, build the pitch deck (#2 in queue).

If they push back on multiple themes — rewrite this canvas, do not proceed.

---

## Appendix: things explicitly cut from this canvas

- **Iyzico/PayTR** — local market color. Real for Turkey but a feature, not a positioning angle. Mention in country-specific landing pages, not in the global pitch.
- **AI churn prediction** — too early; we don't have data yet; it would weaken Theme A by spreading message surface.
- **Multi-language support** — implementation detail; not a buying driver.
- **"Cheaper than Mindbody" as a primary message** — race to the bottom; never lead with price.
- **Founder story** — useful in slide 2 of the pitch deck, not on the billboard.
