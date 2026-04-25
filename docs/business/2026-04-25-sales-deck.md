# Sales Deck Draft — WhatsApp-Native Gym OS

**Date:** 2026-04-25
**Audience:** Hybrid gym owner-operator, 300-1,500 members, target geographies
**Format:** 12 slides, 30-minute meeting, presented by founder
**Goal of the meeting:** Move from cold prospect → 14-day pilot commitment OR explicit no-fit signal

---

## Design direction (apply to every slide)

- **Aesthetic:** modern light, warm-white background `#fafaf9`, near-black text `#1a1a1a`, single accent (amber `#f59e0b` for primary, deep green `#16a34a` for "good", muted red `#dc2626` for "bad/leakage").
- **Type:** Inter Display for headlines (700/800), Inter for body (400/500). Generous line-height (1.4 body, 1.15 headlines).
- **Layout:** Asymmetric. Big number or bold statement on left, supporting detail on right. Avoid "academic poster" 4-quadrant layouts.
- **Imagery:** Real product screenshots whenever possible (member mobile + admin web from the existing build). Avoid stock photos of generic muscular people. If you need a face, use the founder's photo on slide 11.
- **Density:** Maximum 35-40 words per slide body. If you need more, split into two slides.
- **Numbers:** Always with a source citation in 11pt grey at the bottom (e.g. "Statista 2025" or "Internal estimate"). Build trust with citations.
- **Charts:** Hand-drawn-feeling SVG, not Excel screenshots. One color, one accent.
- **Tone:** Confident, specific, never breathless. Numbers over adjectives.

Use Claude Design (artifact mode) to render each slide. Reference this doc and ask Claude to produce the slide as an HTML/CSS artifact one at a time.

---

## Slide 1 — Title

**Headline (centered, big):**
**WhatsApp-native gym software.**
*The modern way to run a hybrid gym.*

**Sub:** [Founder Name] · [Date] · [Gym Owner Name's Gym Name]

**Visual:** Simple. Logo top-left. One line of accent color across the bottom. Empty space on purpose.

**Speaker notes:**
> "Thanks for the 30 minutes. I'll keep this tight. You spend it telling me about your gym; I spend it showing you how we built the platform around the way your members actually live."

---

## Slide 2 — Their week today (the pain mirror)

**Headline:** Your week today.

**Body (5 bullets, ticks turning into red Xs):**
- ❌ Your members miss the SMS class reminders. Front desk re-sends them on WhatsApp manually.
- ❌ You pay Glofox $250 + Twilio $80 + still have a WhatsApp Business inbox open all day.
- ❌ Your PT packages live in a spreadsheet.
- ❌ You suspect 5-15% of check-ins are shared QR screenshots. You can't prove it.
- ❌ Three logins, three reports, one frustrated accountant.

**Visual:** Half-screen — a phone mockup showing 3 different gym-related WhatsApp threads (member to gym, gym to member, internal staff), and a laptop with Glofox + Google Sheet open on top of each other.

**Speaker notes:**
> "Stop me if any of this isn't true. We talk to a lot of hybrid gym owners and these five things come up in every single call. If yours don't — different conversation, but I'd still love to know what does."

**(Pause for 30 seconds. Listen. They will correct you on which bullets are theirs.)**

---

## Slide 3 — Why now

**Headline:** Two things changed in the last 24 months.

**Two-column layout.**

**Left column:**
**1. WhatsApp won.**
- 2.95B monthly active users globally (Meta, Q4 2025)
- 80%+ messaging-app market share in TR, ES, IT, AE, IN, BR, MX
- 80% of business messages are now opened within 30 minutes
- *SMS is dead in our markets. Email is for receipts.*

**Right column:**
**2. Members became consumers.**
- App-store benchmarks: members compare your gym app to Strava, Peloton, Apple Fitness+, Trendyol
- A "good enough" admin-tool-grade member app churns members at +18% YoY (industry stat — confirm)
- The threshold for "professional" gym software jumped two tiers in two years

**Visual:** Two simple line charts. Left: WhatsApp MAU growth 2018-2025. Right: rising consumer app NPS bar.

**Speaker notes:**
> "Glofox and Mindbody were built when SMS reminders were the future. The world moved. We built for the world that exists now."

---

## Slide 4 — What we are

**Headline (very big):** WhatsApp-native gym software.

**Sub:** Built for hybrid gyms in WhatsApp-first markets.

**3 sentence body:**
- Every payment receipt, class reminder, waitlist promotion, and churn save runs on WhatsApp by default. No Twilio glue. No Zapier.
- Members check in with a QR code that refreshes every 30 seconds. Screenshot-sharing stops being a revenue leak.
- Open gym, classes, and PT live in one platform. One app, one report, one bill.

**Visual:** Three icons in a row, each tied to a one-line value statement. Below, a single screenshot of the member app home screen (the one with the rotating QR + week stats).

**Speaker notes:**
> "Three things we do better than anyone in your market. Every one of them is a real engineering bet, not a marketing label. Let me show you each."

---

## Slide 5 — Theme A: Your members live on WhatsApp

**Headline:** Your members already live on WhatsApp. Now your software does too.

**Two-column layout.**

**Left column — visual:**
A series of 4 WhatsApp message bubbles (mockup, not real), showing:
- "Welcome Hakan! Your Premium Monthly is active 💪"
- "Yoga at 18:00 starts in 1 hour. Tap to confirm or cancel."
- "A spot opened in CrossFit WOD at 19:30. Want it? Reply YES."
- "Payment of ₺899 received. Receipt: [link]"

**Right column — copy:**
- Pre-approved Meta Business templates for the entire gym lifecycle.
- Two-way replies route into your admin inbox.
- Meta Business verification handled by us, not you.
- Optional: SMS + email + push as fallbacks.
- *No Twilio account, no Zapier, no $80/mo on top.*

**Speaker notes:**
> "Glofox can send WhatsApp through Twilio if you set it up yourself. We send it because we're built on it. The difference looks small until you've spent 6 hours getting Meta to approve a template."

---

## Slide 6 — Theme B: Stop paying for stolen workouts

**Headline:** Stop paying for stolen workouts.

**Two-column layout.**

**Left column — visual:**
A side-by-side: "Static QR" (generic per-member code, with arrow to "screenshot → friend's phone") vs "Rotating QR" (countdown ring + 30-second refresh, with crossed-out screenshot).

**Right column — copy:**
- Member's QR refreshes every 30 seconds in the app.
- Server replay-rejects already-used codes.
- A screenshot is worthless 31 seconds later.
- No biometric data captured, anywhere.
- No turnstile capex. A $300 tablet at the door does the job.
- **Recover an estimated 5-15% of leaked check-ins on day one.**

**Speaker notes:**
> "If you've ever had a member check in and known something was off — this is it. Glofox, Mindbody, Wellyx — they all use static codes. Anyone with a screenshot can walk in. We made that not work."

---

## Slide 7 — Theme C: One platform for the whole gym

**Headline:** One platform. Open gym, classes, PT. No more spreadsheets.

**Visual: a clean diagram with 3 boxes feeding into one platform:**
```
  Open gym             Classes              PT packages
  (subscription)       (booking + waitlist) (sessions + commission)
       \                    |                    /
        \                   |                   /
         +----[ One member · One bill · One report ]----+
```

**Body (3 bullets):**
- One data model. A member with a monthly subscription, 8 booked classes, and a 10-pack of PT sessions is one row, not three tools.
- One report. Revenue by mode, not by tool.
- One member app, one admin panel, one bill.

**Speaker notes:**
> "Most platforms started life as a class-booking tool, or a CrossFit tool, or a PT-coaching tool. The hybrid stuff is bolted on. We started with hybrid. It's the difference between a Swiss Army knife and a single tool that does one thing."

---

## Slide 8 — Product (live demo / screenshots)

**Headline:** This is what you'll show your members on Monday.

**Visual: 4 mobile mockups in a row, with light shadows. Captions under each.**
1. **Home screen** — name + active membership + rotating QR + countdown ring + week stats.
2. **Classes** — schedule view with capacity dots, "Open" / "Waitlist" pills.
3. **Membership & payment** — current plan card + payment history + manage card button (Stripe Customer Portal).
4. **Profile + notifications** — channel toggles (push/email/WhatsApp/Telegram).

Below: one admin dashboard screenshot showing live check-in feed + 4 KPI cards.

**Speaker notes:**
> "I'm going to spend 5 minutes on this demo. If you've got 10 minutes after, I'll let you click through it yourself on your phone. We have a public demo gym anyone can sign up to."

**(In an actual meeting: show a Loom recording of the real flow OR open the demo on the founder's phone and pass it to the prospect.)**

---

## Slide 9 — Why us, not them

**Headline:** Picked against the obvious alternatives.

**Comparison table (5 columns, 6 rows). Tick = ✓ Cross = ✗ Half = ◐**

| Capability | Us | Glofox | Mindbody | Wellyx |
|---|---|---|---|---|
| Native WhatsApp templates | ✓ | ✗ | ✗ | ◐ (Twilio under) |
| Rotating QR (TOTP) | ✓ | ✗ | ✗ | ✗ |
| Hybrid data model (open + class + PT) | ✓ | ◐ | ◐ | ◐ |
| Modern member app | ✓ | ◐ | ◐ | ✓ |
| Pricing transparency | ✓ | ✗ (sales gate) | ✗ (sales gate) | ✓ |
| Onboarding in 14 days | ✓ | 30-60 days | 30-90 days | 14-30 days |
| Monthly cost (~500 members) | **$199** | $250-450 + 2.5% txn | $300-600 + 2.99% txn | $99-299 |

**Speaker notes:**
> "Wellyx is cheaper. We are not the cheapest tool. We are the right tool for owners who want WhatsApp built in and rotating QR security baked in. If price is your only axis, Wellyx is your answer and that's fine."

---

## Slide 10 — Pricing

**Headline:** One plan. No surprises.

**Big visual: a single pricing card.**

```
┌─────────────────────────────────────┐
│  GROWTH                             │
│  $199 / month per location          │
│                                     │
│  ✓ Unlimited members                │
│  ✓ Native WhatsApp + Telegram       │
│  ✓ Rotating QR check-in             │
│  ✓ Hybrid data model                │
│  ✓ Branded member app               │
│  ✓ Stripe-native billing            │
│  ✓ 14-day onboarding                │
│  ✓ Founder on-call during pilot     │
│                                     │
│  + Stripe processing fees passed    │
│    through at cost (no markup)      │
└─────────────────────────────────────┘
```

**Below:**
- Pilot pricing for first 10 customers: **$99/mo for the first 6 months**, then $199/mo.
- No setup fee. No annual contract. Cancel any time during pilot.
- Optional: $99/mo Premium add-on (multi-location, AI churn signals, advanced reports). Year 2.

**Speaker notes:**
> "I'm not going to ask you to do a 12-month contract. The pilot is 6 months at $99. If we don't earn it, you walk."

---

## Slide 11 — Who I am, who's behind this

**Headline:** Who built this.

**Two-column layout.**

**Left column:**
- Photo of founder (square crop, neutral background).
- One-line bio: *"[Name] — built [previous credible thing] before this. Based in [city]."*
- "I personally onboard every customer for the first 100 sales. You'll have my number."

**Right column — what we promise about durability:**
- We charge real money from day one. Not VC-runway-funded yet, by design.
- Public 12-month roadmap, updated quarterly.
- Open changelog at /changelog.
- If we sell the company, the buyer must commit to keeping the product running for 24 months minimum. It's in our investor agreements.

**Speaker notes:**
> "Two questions every owner asks: who are you, and will you still be here in 3 years. I'm being honest about both. Charging from day one means we don't need to chase scale at the expense of you."

---

## Slide 12 — The ask

**Headline:** Try us for 14 days.

**Body (3 simple bullets, large):**
1. **We migrate your member data this week.** From Glofox / Mindbody / spreadsheet — we handle it.
2. **You're live with rotating QR + WhatsApp by Friday.** I'm on call the whole time.
3. **If after 14 days you don't want to continue, we hand back your data and walk.** No charge.

**Bottom of slide, single line:**
*"Want to do this? We start Monday."*

**Visual:** A simple calendar visual showing 14 days highlighted, ending on a "Live" marker.

**Speaker notes:**
> "Two weeks. Real members, real check-ins, real WhatsApp. If at the end of it your front-desk staff isn't happier and your member app DAU isn't up, you walk. I'll send the data export myself. Want to do this?"

**(Stop talking. Wait for the answer.)**

---

## Appendix slides (use only if asked / drilled into)

### A1 — Compliance and security
- KVKK (Turkey) / GDPR (EU) / CCPA (CA) compliant out of the box.
- No biometric data captured.
- Daily Postgres backups, 30-day point-in-time recovery.
- Stripe handles all card data (PCI scope minimal).
- WhatsApp template content stays under your control.

### A2 — Integrations
- Stripe Checkout + Customer Portal.
- Iyzico / PayTR (TR market): on roadmap, Q2.
- WhatsApp Business via Meta-approved BSP (Twilio).
- Telegram Bot API.
- Resend for email.
- Public REST + webhook API for custom integrations.

### A3 — Migration support
- We extract from Glofox / Mindbody / spreadsheet.
- Members get a one-time WhatsApp message to set up their app + see their plan.
- Active subscriptions transition with no payment lapse.
- 14-day parallel-run option (you keep paying Glofox while we run; we don't bill until you cancel them).

### A4 — Roadmap (12 months)
- **Q2 2026:** Iyzico + PayTR integration. Multi-location dashboards. AI churn-risk signals.
- **Q3 2026:** Native iOS + Android (we're Expo, this is just submission). Lead funnel + sales pipeline. Class instructor portal.
- **Q4 2026:** Marketing automation builder. Custom reports. Public API GA.
- **Q1 2027:** Multi-tenant white label. SOC 2 Type II.

### A5 — Common objections (cheat sheet for the founder)

| Objection | One-line response |
|---|---|
| "Glofox is bigger." | "Bigger isn't the same as better-fit. Try 30 days." |
| "We don't trust new vendors." | "We charge from day one. We hand back your data on day 15 if you walk." |
| "My members don't use apps." | "Your members use WhatsApp. We meet them there. The app is opt-in." |
| "$199 is more than Wellyx." | "Wellyx is great if cheap is the priority. We're a different bet." |
| "What if you get acquired?" | "Buyer commits to 24-month minimum continuity. Contractual." |
| "Do you have biometric/face?" | "On purpose, no. Rotating QR gives equivalent anti-fraud, no compliance burden." |

---

## How to use this deck

### In a 30-min meeting
- Slides 1-3: 5 minutes (set frame)
- Slides 4-7: 10 minutes (themes)
- Slide 8: 5 minutes (live demo)
- Slides 9-12: 7 minutes (compete + price + ask)
- 3 minutes for their questions (you'll often spend more — let it run)

### In an async / Loom send
- Pre-record slides 1-9 as a 7-minute video.
- Send pricing (slide 10) and ask (slide 12) as a follow-up email.
- Skip slide 11 in async; leave it for a live call.

### In a pitch event / 5-minute lightning pitch
- Slides 1, 2, 4, 8, 12 only. 1 minute each. Cut everything else.

---

## What to test before locking this deck

Same kill-test as the positioning canvas:
1. **Run slides 1-7 against 8 prospects.** Watch for which themes get nods vs blank stares.
2. **Track click-through on slide 12 in async sends.** If <20% reply yes to a 14-day pilot, the deck or the price or the offer is wrong.
3. **Listen for unprompted phrases.** If 4+ prospects say *"is this just a Glofox alternative?"* — slide 4 is failing to land the category.
4. **A/B test pricing.** Half see $199, half see $149. If conversion is the same — go $199 and bank the margin.
