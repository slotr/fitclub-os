# Competitive Analysis: Fitness Member Management Software (Global / Professional Tier)

**Date:** 2026-04-25
**Audience:** Founder evaluating a new entrant in the global / professional fitness software market
**Scope:** English-language, professionally-engineered, mid-market and above. Turkish local vendors are explicitly out of scope.
**Target ICP under evaluation:** Hybrid fitness business (open gym + group classes + PT packages), 300-1,500 active members per location, single or multi-location, English-speaking management.

---

## 1. Market segmentation

### 1.1 Global enterprise / mid-market
The big incumbents. Strong brand, broad feature surface, expensive, complex to deploy, sales-led GTM.

- **Mindbody** (USA, 2001) — wellness market leader, marketplace flywheel, sales-gated pricing.
- **ABC Glofox** (Ireland, 2014, acquired by ABC Fitness 2022) — boutique fitness, branded apps, ABC's franchise muscle.
- **ClubReady** (USA, 2008) — full-service for franchise chains and big-box.
- **ABC IGNITE** (USA) — large multi-location operators, ex-DataTrak, replaces Club Solutions.
- **Zen Planner** (USA, 2006, acquired by Daxko) — affiliate-friendly, mature, broad SMB.
- **Daxko Operations** (USA) — YMCAs, JCCs, family fitness chains.
- **Perfect Gym** (Poland, 2010, acquired by Constellation 2022) — large multi-club operators in EU/MENA.
- **Zenoti** (USA/India) — wellness + spa, multi-location, ~$340M raised.
- **Mariana Tek** (USA, 2015, by Xplor) — boutique studio cycle/yoga, premium UX.
- **Hapana** (UK/AU, 2019) — global boutique chains, F45-adjacent, modern stack.

### 1.2 Specialist (vertical-focused)
Built around one workflow really well; weaker on hybrid use cases.

- **Wodify** (USA, 2011) — CrossFit affiliates and functional fitness boxes.
- **PushPress** (USA, 2014) — small functional gyms, free starter tier, modern UX.
- **ABC Trainerize** (Canada, 2011, by ABC Fitness) — solo PTs and online coaching, not a club platform.
- **Triib** (USA, 2014) — boxing/MMA/CrossFit niche.
- **Resamania** (France, by Deciplus) — traditional French/EU clubs.
- **TeamUp** (USA, 2012) — class-based studios, group fitness, simple.
- **Booker** (USA, by Mindbody) — wellness + spa, separate product surface from Mindbody core.

### 1.3 Modern challenger
SaaS-native, cleaner UX, broader feature scope than specialists, cheaper than enterprise.

- **Virtuagym** (Netherlands, 2008) — coaching + club mix, big in EU.
- **Wellyx** (UAE/UK, 2018) — flat-rate aggressive pricing, all-in-one.
- **GymMaster** (New Zealand, 2007) — 24/7 access control focus.
- **Gymdesk** (USA, 2014) — value-priced, founder-led, all-features-in-all-plans.
- **EZFacility** (USA, 2002, by Jonas Software) — multi-sport facilities + gyms.
- **Club OS** (USA, 2010) — sales/CRM specialist for big-box fitness.
- **Hapana** (also fits here) — bridges challenger and enterprise.

### 1.4 Engagement-led / AI overlay
Newer category, focused on retention and conversion rather than admin. Sit on top of core platforms.

- **Keepme + Antares** (UK, 2018) — AI churn scoring + sales agent, omnichannel including WhatsApp.
- **Loyalsnap** (USA, 2017) — retention CRM for boutique studios.
- **MAKO CRM / 1club AI** — AI-led sales/retention layers for gym groups.
- **FitGymSoftware** (India, ~2018) — markets WhatsApp Business as a primary channel; serves India SMB. Reference model for WhatsApp-first GTM.

### 1.5 Adjacent (referenced, not direct competitors)
- **Trainerize** when used solo by PTs without club tooling (already listed as specialist).
- **Calendly / Acuity / SimplyBook.me** — generic booking SaaS.
- **Stripe Billing + custom CRM** — what tech-savvy single-location owners build themselves.

---

## 2. Master comparison table

Pricing in USD/month per location for ~500 active members. "Sales gate" = undisclosed pricing requiring a sales conversation. Public-facing or third-party-validated values only.

| Vendor (HQ) | Founded | Target segment | Pricing entry | Pricing scale (~500 members) | Free trial | Web admin | Member mobile app | QR check-in | WhatsApp | Telegram | Class booking + waitlist | PT package mgmt | Subscription billing | Sales/CRM | Reports | Best for | Notable weakness |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Mindbody** (US) | 2001 | Wellness, multi-location, mid-large | Sales gate, ~$139/mo Starter | $300-600/mo + 2.99% + $0.30 per txn | Demo only | Excellent | Native iOS+Android (branded $$) | Static QR / barcode | None native; Twilio/Zapier | No | Strong | Yes | In-app + processor | Strong | Strong | Marketplace + multi-location chains | Expensive, opaque pricing, dated screens, app fees |
| **ABC Glofox** (IE/US) | 2014 | Boutique, franchises | ~$110/mo Base | $200-600/mo + 2.5-2.9% txn | Demo only | Good | Native (branded $$) | Static QR | None native | No | Strong | Basic | Stripe-style processor | Basic | Good | Boutique studios + chains | Sales-gated pricing, branded app costs extra |
| **ClubReady** (US) | 2008 | Franchises, big-box | $149/mo Launch | $299-499/mo (Velocity/Eclipse) | No | Good | Native | Static QR | Via add-on | No | Basic | Yes | In-app | Strong | Strong | Franchise & lead-heavy ops | Heavy, sales-led, US-centric |
| **ABC IGNITE** (US) | n/a | Enterprise multi-club | Sales gate | $500-2,000+/mo est. | Demo only | Good | Native | RFID + QR + biometric | No | No | Yes | Yes | In-app | Strong | Strong | 50+ location chains | Enterprise-only, very heavy |
| **Zen Planner** (US) | 2006 | Affiliate gyms, MMA, yoga | $99/mo | $169-348/mo by member tier | Demo + trial | Good | Native (Member + Staff) | Static QR | No | No | Strong | Yes | In-app | Basic | Strong | Affiliate / MMA / mid-size | Tier escalates fast, dated UI |
| **Daxko Operations** (US) | n/a | YMCA / JCC / family chains | Sales gate | $1,000+/mo est. | Demo only | Good | Native | Static QR + RFID | No | No | Strong | Yes | In-app | Strong | Strong | YMCA/JCC operators | Not for commercial gym independents |
| **Perfect Gym** (PL) | 2010 | Mid-large EU clubs | ~$129/mo per club | $200-400+/mo | Demo only | Good | Native | Static QR + RFID | Via integration | No | Strong | Yes | In-app | Strong | Strong | Mid/large EU operators | Hardware-heavy, sales-led |
| **Zenoti** (US/IN) | 2010 | Wellness + spa, multi-loc | Sales gate | $300-1,000+/mo | Demo only | Excellent | Native | Static QR | Via integration | No | Strong (spa-led) | Yes | In-app | Strong | Strong | Wellness/spa multi-loc | Spa-shaped; gym is secondary |
| **Mariana Tek** (US) | 2015 | Boutique cycle/yoga premium | Sales gate | $300-700/mo est. | Demo only | Excellent | Excellent | Static QR | No | No | Strong | Limited | In-app | Good | Good | Premium boutique cycle/yoga | Niche, only fits boutique class model |
| **Hapana** (UK/AU) | 2019 | Global boutique chains | Sales gate | $250-600/mo est. | Demo | Excellent | Native | Static QR | Via integration | No | Strong | Basic | In-app | Good | Good | Global boutique brand chains | Newer, smaller installed base |
| **Wodify** (US) | 2011 | CrossFit boxes | $79/mo | $159-300/mo | Demo | Good | Native | Static QR | No | No | Strong (WOD-aware) | Basic | In-app | Basic | Good | CrossFit / functional fitness | Not a fit for hybrid open-gym |
| **PushPress** (US) | 2014 | Small functional gyms | Free tier; Pro $159/mo | $159-559/mo | Free plan | Good | Native | Static QR | No native | No | Good | Basic | In-app | Basic | Good | Small US boxes | Higher card fees on free; US-centric |
| **ABC Trainerize** (CA) | 2011 | Solo PTs, online coaching | $5-10/mo | $40-250/mo by client count | 30-day | Good | Excellent (coaching focus) | None (no club check-in) | No | No | Limited | Excellent | Stripe processor | None | Basic | Solo PT / hybrid PT-led | Not a club mgmt platform |
| **Triib** (US) | 2014 | Boxing/MMA/CrossFit | Sales gate | $150-300/mo est. | Demo | Good | Native | Static QR | No | No | Good | Basic | In-app | Basic | Basic | Combat sports niche | Niche only |
| **Resamania** (FR) | 2010 | EU traditional clubs | Sales gate | €150-400/mo | Demo | Good | Native | Static QR + biometric | No | No | Good | Yes | Local processors | Basic | Good | French/EU traditional | EU-only, French-first |
| **TeamUp** (US) | 2012 | Class-based small studios | $89/mo | $89-249/mo | 30-day | Good | Native (basic) | Static QR | No | No | Strong | Limited | Stripe | Basic | Basic | Group fitness studios | Class-only, weak on PT/open gym |
| **Booker** (US, by Mindbody) | 2010 | Wellness/spa | Sales gate | $200-500/mo | Demo | Good | Limited | Static QR | No | No | Good (spa-shaped) | Limited | In-app | Good | Good | Day spa + wellness | Fitness is afterthought |
| **Virtuagym** (NL) | 2008 | Studios, coaching, mid clubs | ~$29/mo entry, real ~$125+ | Quote-based, ~$200-400/mo | 14-day | Good | Native | Static QR | Via Twilio add-on | No | Strong | Yes (coaching strength) | In-app + processor | Good | Good | Coaching + club hybrid in EU | Pricing opacity, setup fees |
| **Wellyx** (UAE/UK) | 2018 | Boutique to mid clubs | $99/mo (Excel) | $99-299/mo flat | Demo | Good | Native, branded | Static QR | Marketed (Twilio under) | No | Strong (waitlist) | Yes | In-app | Good | Good | All-in-one mid market | Newer brand, support variability |
| **GymMaster** (NZ) | 2007 | 24/7 access gyms | $89/mo Foundation | $129-249/mo by tier | Demo | Good | Native | Static QR + 24/7 access | No | No | Good | Basic | Stripe + add-on fees | Basic | Good | 24/7 / unstaffed gyms | Per-feature surcharges, dated UX |
| **Gymdesk** (US) | 2014 | Small/medium gyms | $75/mo | $100-200/mo | 30-day | Good | Native | Static QR | No native (email/SMS) | No | Good | Basic | Stripe | Basic | Good | Owner-operated SMB gyms | Limited PT package depth |
| **EZFacility** (US) | 2002 | Multi-sport + gyms | Sales gate | $200-400/mo est. | Demo | Average | Native | Static QR + RFID | No | No | Good | Yes | In-app | Good | Good | Multi-sport + leagues | Older codebase, dated UX |
| **Club OS** (US) | 2010 | Big-box sales teams | Sales gate | $200-400/mo est. | Demo | Good | Limited | None | No | No | Basic | Limited | None native (overlay) | Strong | Strong | High-volume sales floors | Not member mgmt by itself |
| **Keepme + Antares** (UK) | 2018 | Multi-site retention/sales overlay | Sales gate | $300-1,000+/mo est. | Demo | Excellent | None (overlay) | None | Native (omnichannel AI) | No | None | None | None | Strong (AI) | Strong (churn AI) | Top-of-stack retention/AI sales | Doesn't replace core; expensive |
| **Loyalsnap** (US) | 2017 | Boutique retention | Sales gate | $200-500/mo est. | Demo | Good | None | None | Via Twilio | No | None | None | None | Strong | Good | Boutique retention overlay | Overlay only |
| **FitGymSoftware** (IN) | ~2018 | India SMB | ~$30-60/mo est. | ~$60-120/mo | Demo | Basic-Good | Native | Static QR | Native (WhatsApp Business) | No | Basic | Basic | Local processors | Basic | Basic | India SMB; reference model | Not internationally localized |

Where "est." appears, value is interpolated from public market signals — confirm before relying.

---

## 3. Pricing reality (USD/month per location, ~500 members)

| Tier | Vendor | Monthly cost | What's included | What's excluded |
|---|---|---|---|---|
| **Enterprise** | Mindbody (Accelerate) | $279-499 | Core + booking + reporting | Branded app, marketplace fees, txn 2.99% |
| **Enterprise** | ABC IGNITE | $500-2,000+ est. | Multi-loc + RFID + analytics | Hardware, custom integrations |
| **Enterprise** | ClubReady (Velocity) | $299 | Sales + member mgmt | Marketing automation tier-up |
| **Enterprise** | Daxko Operations | $1,000+ est. | Family-fitness multi-site | Setup, hardware |
| **Mid-market** | ABC Glofox (Plus + branded app) | $199-300 | Core + branded app | Custom integrations, txn 2.5-2.9% |
| **Mid-market** | Zen Planner | $169-269 | Member + staff app, billing | Higher tiers for marketing automation |
| **Mid-market** | Perfect Gym | $200-400 | Mid-market club mgmt | Hardware, custom |
| **Mid-market** | Zenoti | $300-1,000+ | Wellness multi-loc | Sales gate, scaled by volume |
| **Mid-market** | Mariana Tek | $300-700 est. | Premium boutique UX | Niche fit only |
| **Mid-market** | Hapana | $250-600 est. | Global boutique stack | Newer; smaller community |
| **Mid-market** | Virtuagym | $200-400 | Coaching + club hybrid | Setup fees |
| **Mid-market** | Wellyx (Pro) | $199 flat | All-in-one | Fewer integrations |
| **Specialist** | Wodify | $159-249 | CrossFit-shaped workflow | Marketing add-ons; not for open-gym |
| **Specialist** | PushPress (Pro) | $159-300 | Booking + billing | Higher card fees on free |
| **Specialist** | Triib | $150-300 est. | Combat-sports niche | Niche only |
| **Specialist** | TeamUp | $89-249 | Class-based small studios | Weak PT, no open-gym |
| **Specialist** | Resamania | €150-400 | EU traditional clubs | EU + French only |
| **SMB** | GymMaster | $129-199 | Core + access control | Per-feature surcharges |
| **SMB** | Gymdesk | $75-150 | All features in all plans | Limited PT depth |
| **SMB** | EZFacility | $200-400 est. | Multi-sport + gyms | Older UI |
| **Coaching** | Trainerize (Studio) | $60-250 | Coaching + client app | No walk-in / open-gym flow |
| **Overlay** | Club OS | $200-400 est. | Sales floor CRM | Not standalone |
| **Overlay** | Keepme + Antares | $300-1,000+ | AI sales + retention | Doesn't replace core |
| **Overlay** | Loyalsnap | $200-500 est. | Retention CRM | Doesn't replace core |

**Pricing observation:** the professional global market clusters in three bands:
- **$60-200/mo** — SMB/coaching, single-location, basic feature set.
- **$200-500/mo** — mid-market, polished UX, branded app, real CRM.
- **$500+/mo** — enterprise multi-location, sales-gated.

A new entrant aiming at the mid-market band must price at **$149-249/mo** to undercut Glofox/Mindbody by 30-50% while signalling "we're not a discount tool." Below $99 the conversation becomes a feature-tolerance race against Gymdesk/PushPress free.

---

## 4. Feature gap analysis (global market)

For each gap: who is strong, who is weak, the opportunity.

### 4.1 WhatsApp as a native transactional channel
**Genuinely native:** Almost no one in the professional tier. India-market players (FitGymSoftware, FitplusCRM) market it but are not localized. Keepme Antares uses WhatsApp as an outbound AI agent channel but is an expensive overlay, not a core platform.
**Afterthought:** Mindbody, Glofox, Virtuagym, Wodify, PushPress, Mariana Tek, Hapana — all route WhatsApp through Twilio or Zapier with manual template management, no pre-built lifecycle templates, no Meta Business onboarding flow.
**Why it matters:** WhatsApp has 2B+ MAU globally and is the dominant business messaging channel in EU south, MENA, India, LatAm. SMS deliverability and cost are inferior in every market that matters outside North America. Members expect class reminders, payment receipts, and waitlist promotions on WhatsApp.
**Opportunity:** Be the only platform where WhatsApp is a first-class channel: pre-approved Meta templates for the standard gym lifecycle (welcome, payment due, class reminder, waitlist promotion, churn save), Meta Business verification handled, two-way reply routing into the admin inbox.

### 4.2 Polished native member mobile app
**Strong:** Mindbody, Glofox (when branded), Wellyx, Mariana Tek, Hapana, Trainerize. Generally clean iOS/Android with white-label options.
**Weak:** ClubReady, Zen Planner, GymMaster, EZFacility, Triib, Booker — older codebases, dense layouts, inconsistent type, member apps that feel like internal admin tools.
**Opportunity:** A modern Expo/React-Native app with consumer-grade UX (think Strava / Peloton / Headspace polish) is a real differentiator. Many incumbents would need a from-scratch rewrite to match.

### 4.3 Rotating QR / TOTP check-in security
**Strong:** No vendor in this analysis publicly markets rotating TOTP QR. Most use static per-member QR codes (trivially screenshotable and shareable) plus a turnstile reader. Enterprise tiers lean on RFID + biometrics (fingerprint, face) as the anti-fraud answer.
**Weak:** Glofox, Mindbody, Mariana Tek, Hapana, Virtuagym, Wellyx, GymMaster, Wodify, PushPress, all SMB players — static QR everywhere.
**Opportunity:** Rotating-QR / TOTP is a genuine technical differentiator and a specific anti-pass-sharing pitch. It also lets the operator skip biometric hardware entirely while offering equivalent security — meaningful in markets where biometric data has regulatory weight (EU GDPR Article 9, CA privacy laws, post-2023 wave of US state laws).

### 4.4 Hybrid (open gym + class + PT) data model
**Strong:** Virtuagym handles coaching+club mix in EU. Wellyx markets all-in-one. ClubReady covers big-box hybrid. Hapana modern but boutique-leaning.
**Weak:** Specialists fail at hybrid by design — Wodify is class-shaped, Trainerize is coaching-shaped, GymMaster is access-shaped, Mariana Tek is studio-shaped, TeamUp is class-only, Booker is spa-shaped. Even Mindbody's data model still bears the marks of a class-booking-first design.
**Opportunity:** Build the data model around all three modes from day one — open gym (subscription + walk-in/turnstile), class (booking + waitlist + capacity + instructor), PT (package + session-tracking + trainer commission + scheduling). This is a real architectural moat: bolt-ons ship feature-complete in a release, but a coherent hybrid data model can't be retrofitted without breaking customers.

### 4.5 Modern light-theme UI
**Strong:** Mariana Tek, Hapana, Wellyx, Gymdesk, PushPress, Trainerize. Clean modern interfaces, restrained palettes, decent type.
**Weak:** Mindbody (legacy screens still surface), ClubReady, Zen Planner, EZFacility, Triib, Resamania, Daxko Operations, ABC IGNITE — visibly older design conventions, dense forms, gradient buttons, inconsistent typography, "enterprise" aesthetic.
**Opportunity:** Visual polish alone is a credible buying-decision driver in the mid-market. A modern light-theme product with consumer-app-grade attention to type, spacing, and motion signals "premium" and is impossible to fake without rewriting the UI layer. Combined with #4.2 above, this is one of the cleanest narratives a new entrant can run.

### 4.6 AI-driven retention / churn prediction
**Strong:** Keepme Score (claims 95% accuracy), Keepme Antares as an AI sales agent, Loyalsnap retention CRM, MAKO CRM. All are overlays — they sit on top of a core platform like Mindbody or Glofox.
**Weak:** Practically every core platform vendor. Mindbody, Glofox, ClubReady, Wellyx, Virtuagym treat retention as a reporting concern, not a predictive one.
**Opportunity:** Even a basic "members at risk" dashboard (no-show streak + payment failure + reduced visits + class booking decline) baked into the core product would let a new entrant compete with Keepme without paying overlay prices. A real ML model can come later; the perceived value of "the system tells you who's about to cancel" is high relative to engineering cost.

### 4.7 Self-service member signup and Stripe-native checkout
**Strong:** Trainerize (coaching-led), Gymdesk (lead funnel + signup widget), Wellyx (waitlists), Glofox (branded app signup), Mariana Tek (premium boutique signup).
**Weak:** ClubReady and most enterprise vendors expect a sales rep or front-desk staff to onboard a new client. Stripe Customer Portal-grade self-service card update flows are inconsistent across vendors.
**Opportunity:** "Member downloads the app, registers with phone OTP, picks a plan, pays via Stripe Checkout, gets a rotating QR within 60 seconds, walks in" — that flow is rarely end-to-end smooth even at the mid-market tier. It is the single most marketable demo a new entrant can build.

### 4.8 Multi-tenant / single-pane multi-location
**Strong:** Mindbody, Glofox, ABC IGNITE, ClubReady, Daxko, Zenoti, Hapana — all designed for multi-location operators.
**Weak:** SMB tier (Gymdesk, PushPress, GymMaster, TeamUp) — multi-location is bolted on or absent.
**Opportunity:** Not a primary differentiation angle since incumbents own this, but a clean RLS-based multi-tenant architecture from day one positions the product to grow upmarket without rewriting.

---

## 5. Pricing positioning recommendations (global / pro)

Three viable tiers. All assumed per location, monthly, USD.

### 5.1 SMB tier — "modern Gymdesk alternative"
**Range:** $79-149/mo
**Compete against:** Gymdesk, PushPress, GymMaster, TeamUp
**Includes:** Web admin, native mobile app, rotating QR check-in, Stripe Checkout, class booking + waitlist, PT package management, push + email + WhatsApp notifications, basic CRM, reports.
**Excludes:** AI churn, multi-location, branded white-label app, custom integrations.
**Risk:** Gymdesk has aggressive flat pricing and is hard to undercut without losing margin.

### 5.2 Mid-market tier — "Glofox at half the price"
**Range:** $149-249/mo
**Compete against:** Glofox, Virtuagym, Wellyx, Mariana Tek, Hapana
**Includes:** Everything above + native WhatsApp + Telegram, branded member app, advanced waitlist + dynamic pricing, lead funnel + sales pipeline, multi-location, deeper reports, Stripe Customer Portal, basic AI churn signals.
**Excludes:** Real ML retention, AI sales agents, custom integrations, dedicated CSM.
**Risk:** Buyers in this band already know Glofox/Mindbody by name; trust gap requires excellent demos and case studies.

### 5.3 Premium tier — "engagement-led with AI"
**Range:** $349-599/mo
**Compete against:** Mindbody, Keepme/Antares overlays, Hapana, multi-location chains buying ClubReady
**Includes:** Everything above + AI churn-risk scoring, automated retention sequences via WhatsApp, AI sales-agent style lead nurture, custom integrations, dedicated CSM, multi-location SLAs, GDPR/SOC 2 trail.
**Excludes:** None meaningful — this is the "we do it all" tier.
**Risk:** Premium-tier sales cycles are long. Useful as a price anchor early; revenue source later.

### Recommendation
Given the founder's stated feature set (web admin + native member app + rotating-QR TOTP + WhatsApp/Telegram/Push/Email + class booking + waitlist + light-theme UI), the natural landing zone is **the mid-market tier ($149-249/mo)**.

Rationale: rotating-QR security and native WhatsApp + Telegram are not features SMB buyers will pay extra for at $99/mo. They are exactly what a 600-member hybrid gym actively considering Glofox will pay for, because it gives them parity-or-better functionality at half the cost without the Twilio/Zapier glue work. Launch with one mid-tier SKU; add a stripped SMB tier later only if needed for defensive purposes.

---

## 6. Top 3 strategic threats (global)

The three vendors most likely to beat the founder in a competitive sale, ranked by displacement risk for the mid-market hybrid ICP.

### 6.1 ABC Glofox
**Why they win:** Brand recognition among ambitious gym owners worldwide, strong branded-app marketing, well-known in boutique/CrossFit circles, ABC Fitness's franchise-channel muscle since 2022 acquisition. Pitching against Glofox is pitching against an emotional choice ("the recognized name = serious operation").
**Where they're vulnerable:** Branded app costs extra, sales-gated pricing, no native WhatsApp, static QR only, no rotating-TOTP, transaction fees on top of subscription, support reviews mixed since the ABC acquisition.
**How the founder loses to them:** Multi-location boutique chains, premium urban clubs, owners with English-fluent management who shop internationally.

### 6.2 Mindbody
**Why they win:** Marketplace traffic flywheel (consumers find studios via the Mindbody app), 25-year incumbency, broadest marketplace partner ecosystem, name-recognition for "the wellness software." A non-trivial portion of new-member acquisition for boutique studios is Mindbody-driven.
**Where they're vulnerable:** Expensive ($300-600/mo + 2.99% txn), opaque pricing, dated screens in places, slow product velocity (incumbent inertia), branded apps cost extra, no WhatsApp, static QR.
**How the founder loses to them:** Wellness/yoga/pilates studios where Mindbody marketplace traffic is their main acquisition channel; multi-loc operators with established Mindbody integrations.

### 6.3 Wellyx
**Why they win:** Aggressive flat-rate pricing ($99-299/mo with all features), young modern UX, all-in-one positioning ("we replace 5 tools"), good marketing — aimed exactly at the mid-market underserved by Glofox-pricing. Marketed WhatsApp story (Twilio under the hood, but customers don't notice).
**Where they're vulnerable:** Newer brand without the case studies, support quality reportedly variable, WhatsApp is marketing-speak rather than a real product surface, no rotating-QR, no AI retention.
**How the founder loses to them:** Cost-conscious mid-market operators who want all-in-one, owners who prioritize total monthly spend over feature depth.

Honorable mentions: Hapana (premium boutique chains), Virtuagym (EU coaching+club hybrid), Keepme (when the customer wants AI retention specifically and is willing to add an overlay rather than switch core).

---

## 7. Top 3 white-space opportunities (global)

Three concrete angles where a new entrant has the best shot to win.

### 7.1 The "WhatsApp-first hybrid gym OS"
No vendor in the professional global market combines (a) native WhatsApp transactional messaging with pre-approved Meta templates for the standard gym lifecycle, (b) a hybrid open-gym + class + PT data model, and (c) modern self-service member onboarding with Stripe Checkout. Each piece exists somewhere; the combination does not. The pitch: *"Your members live on WhatsApp. Your software should too. We're the only platform where every payment receipt, class reminder, waitlist promotion, and churn-save flow runs on WhatsApp by default — not as an integration."*

This angle has the strongest international pull. It targets EU south (Spain, Italy, Greece, Turkey), MENA, India, LatAm, parts of SE Asia — all WhatsApp-dominant markets where US-centric vendors leave member engagement on the table.

### 7.2 The "rotating-QR + privacy-clean" angle
Every hardware-led incumbent (ABC IGNITE, Daxko, Perfect Gym, EZFacility, traditional EU clubs) sells biometric turnstiles. Privacy regulators globally — GDPR (EU), CCPA/CPRA (CA), Illinois BIPA, and post-2023 US state laws — treat biometric data as sensitive personal data with stricter consent and processing requirements. A rotating-TOTP QR over a member's phone offers equivalent anti-fraud security without ever capturing biometric data. Sell it as both a security feature *and* a compliance feature. Owners increasingly do not want to think about privacy audits.

### 7.3 The "modern member app, full stop" angle
Most professional incumbents ship member apps that look like internal admin tools repackaged. Members increasingly evaluate gym software the way they evaluate consumer apps — Strava, Peloton, Headspace, Apple Fitness+ have raised the floor. A modern Expo/React-Native app with consumer-grade visual polish (restrained palette, generous spacing, intentional motion, fast load) is a real competitive moat for mid-market owners who lose 18-month-tenure members because the incumbent's app feels like 2017. Combined with #7.1 above, "the only modern gym software where the member app feels as good as Trendyol/Strava and lives on WhatsApp" is a buyable narrative for any owner under 45.

A fourth runner-up worth considering: a **Stripe Connect-style model** where the platform takes a percentage of subscription revenue rather than charging a flat platform fee. PushPress runs an aggressive version of this (free tier + higher card-processing rate). Adopting this in the mid-market would unlock buyers currently priced out of Glofox without the shame of going Gymdesk. But this conflicts with mid-market positioning and should probably wait until year two.

---

## 8. Sources

### Global vendor research
- [Mindbody pricing — fitvizpro breakdown](https://www.fitvizpro.com/blog/mindbody-pricing)
- [Mindbody pricing page](https://www.mindbodyonline.com/business/pricing)
- [Glofox plans](https://www.glofox.com/plans/)
- [ABC Glofox pricing — Exercise.com](https://www.exercise.com/grow/how-much-does-glofox-cost/)
- [ABC Glofox profile — Capterra](https://www.capterra.com/p/136861/Glofox/)
- [ABC Fitness acquires Glofox](https://abcfitness.com/news/abc-fitness-acquires-glofox/)
- [Zen Planner pricing](https://zenplanner.com/pricing/)
- [Zen Planner review — Gymdesk blog](https://gymdesk.com/blog/zen-planner-review)
- [ClubReady — Exercise.com](https://www.exercise.com/grow/how-much-does-clubready-cost/)
- [ClubReady — Capterra](https://www.capterra.com/p/104884/ClubReady/)
- [ABC IGNITE](https://www.abcfitness.com/our-platform/abc-ignite)
- [Daxko Operations](https://www.daxko.com/products/operations/)
- [Perfect Gym — Exercise.com](https://www.exercise.com/grow/how-much-does-perfect-gym-cost/)
- [Perfect Gym — Capterra](https://www.capterra.com/p/143255/Perfect-Gym/)
- [Zenoti homepage](https://www.zenoti.com/)
- [Mariana Tek by Xplor](https://www.marianatek.com/)
- [Hapana homepage](https://www.hapana.com/)
- [Virtuagym pricing](https://business.virtuagym.com/our-prices/)
- [Virtuagym — Exercise.com](https://www.exercise.com/grow/how-much-does-virtuagym-cost/)
- [Wellyx pricing](https://wellyx.com/pricing/)
- [Wellyx — Capterra](https://www.capterra.com/p/224567/Wellyx/)
- [GymMaster pricing](https://www.gymmaster.com/gymmaster-pricing-page/)
- [GymMaster — Capterra](https://www.capterra.com/p/57469/GymMaster/)
- [Gymdesk pricing](https://gymdesk.com/pricing)
- [EZFacility homepage](https://www.ezfacility.com/)
- [Wodify pricing](https://www.wodify.com/pricing)
- [PushPress pricing breakdown — Wodify blog](https://www.wodify.com/blog/pushpress-pricing-plans)
- [Trainerize pricing](https://www.trainerize.com/pricing/)
- [Trainerize — Capterra](https://www.capterra.com/p/140262/Trainerize/)
- [Triib homepage](https://triib.com/)
- [Resamania (Deciplus)](https://www.deciplus.com/)
- [TeamUp homepage](https://goteamup.com/)
- [Booker by Mindbody](https://www.booker.com/)
- [Best gym management software 2026 — Kisi](https://www.getkisi.com/blog/best-gym-management-systems-compared)
- [Best gym management software 2026 — 1club](https://1club.ai/blog/best-gym-management-software-2026)
- [Gym software pricing 2026 — Mako](https://makocrm.so/blog/gym-software-pricing)

### Engagement / AI overlay research
- [Keepme homepage](https://www.keepme.ai)
- [Keepme Antares one-year retrospective](https://www.keepme.ai/blog/one-year-of-antares)
- [Keepme Score](https://www.keepme.ai/keepme-score)
- [Loyalsnap homepage](https://www.loyalsnap.com/)
- [FitGymSoftware homepage](https://fitgymsoftware.com/)
- [FitGymSoftware WhatsApp Business integration](https://fitgymsoftware.com/features/whatsapp-business-integration.html)

### WhatsApp / payments research
- [Twilio WhatsApp Business API](https://www.twilio.com/en-us/messaging/channels/whatsapp)
- [Twilio template approval process](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses)
- [Stripe Billing](https://stripe.com/billing)
- [Stripe Customer Portal](https://stripe.com/billing/customer-portal)

---

*Document length ~3,000 words excluding tables. Pricing labeled "est." indicates interpolated values; confirm before relying. All comparisons reflect publicly available product information as of April 2026; actual feature depth varies by sales motion and may exceed/undershoot the table.*
