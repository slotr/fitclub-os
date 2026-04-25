# Wireframe Specs — Screen-by-Screen

**Date:** 2026-04-25
**Tool:** Claude Design (artifact mode), one screen at a time
**Scope:** Member mobile (Expo) + Admin web (Next.js) + public marketing site
**Reference docs:** `2026-04-25-positioning.md`, `2026-04-25-sales-deck.md`, design spec section 7

---

## Global design system

Apply to every screen unless noted. Anything mentioned here, do not re-state per screen.

### Tokens

```
Background:        #fafaf9  (warm white)
Surface:           #ffffff  (cards, modals)
Foreground:        #1a1a1a  (body text, near-black)
Foreground-muted:  #6b7280  (secondary, captions)
Border:            #e7e5e4  (1px, subtle)

Accent (primary):  #f59e0b  (amber 500 — CTA, highlights)
Accent-fg:         #1a1a1a  (text on amber)

State-good:        #16a34a  (green 600 — open/available)
State-warn:        #ca8a04  (amber 600 — waitlist/attention)
State-bad:         #dc2626  (red 600 — failure/danger)
State-info:        #2563eb  (blue 600 — neutral notice)

Backgrounds for category cards (soft pastel):
  Yoga       #fef3c7
  CrossFit   #fee2e2
  Pilates    #dbeafe
  Strength   #ede9fe
  Cardio     #d1fae5
  PT         #fce7f3
```

### Typography

```
Family:   Inter (web) / SF Pro (iOS) / system (Android)
Weights:  400, 500, 600, 700, 800

Display:  32px / 800 / -0.02em
H1:       24px / 700 / -0.01em
H2:       18px / 600
Body:     14px / 400 / 1.5
Small:    12px / 500
Label:    11px / 500 / uppercase / 0.04em tracking
Number:   tabular-nums for any KPI/price
```

### Spacing & radius

```
Spacing:  4 / 8 / 12 / 16 / 24 / 32 / 48 / 64
Radius:   8 / 12 / 16 / 24 (cards 12-16, modals 24, pills 999)
Shadow:   0 1px 3px rgba(0,0,0,.04) for resting cards
          0 8px 30px rgba(0,0,0,.08) for floating/modal
```

### Component patterns

- **Pill:** rounded-full, padding 4×10px, 11px label, soft background + dark fg.
- **Card:** white surface, radius 12-16, resting shadow, 16-20px padding inside.
- **CTA button:** dark `#1a1a1a` background, white text, radius 12, 10×16px padding, 14px/600 label.
- **Secondary button:** white, 1px border, dark text.
- **Input:** white, 1px border, radius 8, 10×12px padding.
- **Empty state:** centered icon (lucide), 16px label, 12px description, optional CTA.

---

## Section A — Member mobile app (Expo)

iPhone 15-class frame (390×844). Status bar dark on light. Bottom tab bar 4 tabs.

---

### A1 — Splash / app open

**Purpose:** First frame on cold start. Brand impression.

**Layout:**
- Full screen warm white background.
- Centered: gym logo (120×120), 32px gap, gym name (24/700), 8px gap, "Powered by [our brand]" caption in muted.
- No spinner; transition to A2 after auth check (~500ms).

**States:**
- First-open: fade through to A2.
- Returning logged-in: fade through to D1 (Home).

---

### A2 — Phone OTP request

**Purpose:** Login via phone number. Member-friendly default; passwords are friction.

**Layout:**
- Top: 24px back arrow on left.
- Headline (28/700): "Welcome back."
- Sub (14/400 muted): "Enter your phone to continue."
- Phone input with country code dropdown (default to gym's country). Phone format hint as placeholder.
- Continue CTA (full-width).
- Tiny 11/500 muted at the bottom: "By continuing you agree to our [Terms] and [Privacy]."

**States:**
- Empty: CTA disabled.
- Valid format: CTA enabled (dark).
- Submitting: button shows spinner, disabled.
- Error: red 12px text under input ("Phone format invalid").

---

### A3 — Phone OTP verify

**Purpose:** Enter the 6-digit code.

**Layout:**
- Headline: "Code sent to +90 5XX XXX XX XX."
- Sub: "Enter the 6-digit code below."
- 6 separated boxes for the digits (auto-advance, paste-friendly).
- Resend link (muted) 30s countdown.
- "Wrong number?" link goes back to A2.

**States:**
- Wrong code: shake animation + red text "Code didn't match."
- Expired: "Code expired. Tap resend."
- Verifying: subtle progress indicator.

---

### A4 — Profile complete

**Purpose:** Capture full name, birthdate, optional email & gender after first login.

**Layout:**
- Headline: "Tell us about you."
- Sub: "Takes 30 seconds."
- Inputs (stacked):
  - Full name (text, required)
  - Birthdate (date picker, required for age-based class restrictions)
  - Email (text, optional, "for receipts")
  - Gender (segmented: Male / Female / Other / Prefer not to say)
  - Photo upload (optional, "Members find this useful at the front desk")
- Continue CTA.

**States:** standard.

---

### A5 — Plan picker

**Purpose:** Choose a subscription plan.

**Layout:**
- Headline: "Pick your plan."
- Sub: "You can change or cancel any time from the app."
- 2-3 plan cards stacked vertically, each:
  - Plan name (18/700)
  - Price + cycle (24/800 + "/month" muted)
  - 3-5 feature bullets with check icons
  - "Choose this plan" button (dark, full-width)
- Recommended plan card: 1px amber border + "Most popular" pill top-right.
- Below cards: tiny "Need something custom? [Contact us]" link.

**States:**
- Selected: card subtly elevated (additional shadow).
- Sold out: "Coming soon" overlay, button disabled.

---

### A6 — Stripe Checkout (in-app browser)

**Purpose:** Hosted Stripe Checkout. Not our screen, but transition matters.

**Spec:**
- Open via `expo-web-browser` modal sheet.
- Stripe Checkout page: branded with gym logo + accent color.
- On success → A7 (welcome + permissions).
- On cancel → back to A5 (plan picker).

---

### A7 — Welcome + permissions

**Purpose:** Onboard the member into notifications + the QR concept. Last screen before the app's main tabs.

**Layout (3 cards, scrollable if needed):**

**Card 1 — Notifications:**
- Icon (bell)
- Title: "Stay in the loop on WhatsApp."
- Body: "Class reminders, payment receipts, and more — straight to your WhatsApp."
- Two buttons: "Allow" (dark) / "Maybe later" (text).

**Card 2 — Push:**
- Icon (phone-vibrate)
- Title: "Get push notifications too."
- Body: "Optional. Quick alerts when something needs you."
- Triggers iOS push permission dialog.

**Card 3 — Your QR is ready:**
- Icon (qr-code)
- Title: "Your check-in code is in the app."
- Body: "Show it at the door when you arrive. It refreshes every 30 seconds, so screenshotting won't work — your code is tied to your phone."
- Single "Got it" button → D1 (Home).

---

### B1 — Home (the killer screen)

**Purpose:** Default landing after login. Must show the QR prominently, the next class, weekly progress.

**Layout (top to bottom):**

```
┌─────────────────────────────────────┐
│  Status bar                         │
│                                     │
│  Hi Hakan                           │
│  Active membership · 23 days left   │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  CHECK-IN QR  ·  refreshes 28s║  │
│  ║                               ║  │
│  ║       [ QR code 240×240 ]     ║  │
│  ║       countdown ring around   ║  │
│  ║                               ║  │
│  ║    Show this at the door      ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  ┌──────────────┬──────────────┐    │
│  │ THIS WEEK    │ NEXT CLASS   │    │
│  │ 4 visits     │ Yoga 18:00   │    │
│  └──────────────┴──────────────┘    │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ Recent activity                │ │
│  │ ● Yesterday · checked in       │ │
│  │ ● Mon · Yoga Flow attended     │ │
│  │ ● Sun · Payment received       │ │
│  └────────────────────────────────┘ │
│                                     │
│  [ Bottom tab bar: ● Home  Classes  Pay  Profile ]
└─────────────────────────────────────┘
```

**Details:**
- The QR card has a faint countdown ring (SVG circle that decrements over 30s) around the QR. When < 5 seconds, ring color flashes amber.
- Greeting personalizes by name.
- "Active membership · 23 days left" small status under name.
- Pull-to-refresh updates the QR + activity feed.
- Tapping the QR card opens A8 (full-screen QR).

**Empty/edge states:**
- Membership expired: QR card replaced with "Your membership has ended. Renew →" with a renewal CTA.
- Past-due payment: amber banner above the QR: "Payment failed. Update your card →"
- Frozen membership: grey-out QR with "Membership paused" overlay.

---

### A8 — Full-screen QR

**Purpose:** Larger view at the door. Brightness auto-max.

**Layout:**
- Black background (better QR contrast in bright gym lobby).
- White QR (~70% of screen width) centered.
- 32px below: "Show at the door" + countdown ring + "28s remaining".
- Top-right: close X.
- Auto-brightness to max while screen is open.

---

### B2 — Classes list

**Purpose:** Browse + book classes.

**Layout:**

```
┌─────────────────────────────────────┐
│ Classes                             │
│                                     │
│ [Today] [Tomorrow] [Wed] [Thu] [Fri]│
│  ▔▔▔▔▔                              │  (active tab underline)
│                                     │
│ ┌────────────────────────────────┐  │
│ │ [Y]  Yoga Flow                 │  │
│ │      18:00 · Ayşe · 8/12       │  │
│ │                       [ Open ] │  │  (green pill)
│ └────────────────────────────────┘  │
│ ┌────────────────────────────────┐  │
│ │ [C]  CrossFit WOD              │  │
│ │      19:30 · Mehmet · 12/12    │  │
│ │                    [ Waitlist ]│  │  (amber pill)
│ └────────────────────────────────┘  │
│ ┌────────────────────────────────┐  │
│ │ [P]  Pilates                   │  │
│ │      20:00 · Selin · 4/8       │  │
│ │                       [ Open ] │  │
│ └────────────────────────────────┘  │
│                                     │
│  Filter: [All] [Yoga] [CrossFit]    │  (chips, scrollable)
└─────────────────────────────────────┘
```

**Details:**
- Day tabs scrollable horizontally, ~7 days visible.
- Each row: 32×32 colored category icon (background from category palette), class name (15/600), instructor + time + capacity (12/400 muted), state pill on right.
- Tap row → C1 (class detail).
- Empty state: "No classes today. Check tomorrow."

---

### C1 — Class detail

**Purpose:** Class info + book/cancel action.

**Layout:**
- Hero header (200px tall): instructor avatar + class color background.
- Title (24/700) + subtitle (time + duration).
- Instructor card: avatar + name + "View profile →"
- Description block (3-5 lines).
- Capacity meter: visual bar + "8/12 booked, 4 spots left".
- Location chip: "Studio A · 2nd floor".
- Sticky bottom bar: "Book this class — Free with your plan" or "Cancel booking" (red).

**States:**
- Open: dark CTA "Book this class".
- Waitlist: amber CTA "Join waitlist (3 ahead of you)".
- Booked: green pill above bar "You're booked!" + "Cancel" button.
- Past: greyed out, no CTA.

---

### C2 — Booking confirmation modal

**Purpose:** After tap "Book", confirm with details.

**Layout:**
- Modal sheet 60% screen height.
- Title: "Booking confirmed!" or "You're on the waitlist."
- Visual: large green/amber check icon.
- Body: class name + time + location + cancellation policy ("Cancel up to 1 hour before for free.")
- "Add to calendar" link.
- "Done" CTA closes modal.

---

### B3 — Membership & payment

**Purpose:** Show current plan + payment history + manage card.

**Layout:**

```
┌─────────────────────────────────────┐
│ Membership & Payment                │
│                                     │
│ ╔═════════════════════════════════╗ │
│ ║ PREMIUM PLAN                    ║ │
│ ║ ₺899 /month                     ║ │
│ ║ Next payment: 15 May 2026       ║ │
│ ║ [ Manage card ]                 ║ │  (light button on dark)
│ ╚═════════════════════════════════╝ │  (this card is dark theme inverse)
│                                     │
│ Payment history                     │
│ ┌────────────────────────────────┐  │
│ │ 15 Apr 2026 · Premium · ₺899   │  │
│ ├────────────────────────────────┤  │
│ │ 15 Mar 2026 · Premium · ₺899   │  │
│ ├────────────────────────────────┤  │
│ │ 15 Feb 2026 · Premium · ₺899   │  │
│ └────────────────────────────────┘  │
│                                     │
│ [ Change plan ]    [ Pause/Cancel ] │
└─────────────────────────────────────┘
```

**States:**
- Past-due: red banner + "Pay now" CTA (opens Stripe Customer Portal).
- Paused: amber overlay on hero card: "Membership paused — resume any time."
- No payment history: empty state "Your first payment will appear here."

---

### B4 — Profile / settings

**Purpose:** Personal info, notification preferences, support, sign out.

**Layout (sectioned list):**

**Section: Profile**
- Avatar + name + email (tap to edit).

**Section: Notifications**
- Push toggle
- Email toggle
- WhatsApp toggle (with "Connected as +90 5XX..." subtext)
- Telegram toggle (deep-link button to bind: "Connect Telegram")
- Marketing opt-in toggle (separate, KVKK)
- Quiet hours (22:00-08:00 toggle)

**Section: Membership**
- Link to B3.

**Section: Support**
- "Contact the gym" → opens WhatsApp deep link to gym's number.
- "Help & FAQ" → web view.
- "Terms" / "Privacy".

**Section: Account**
- Sign out (text link).
- Delete account (red text link, opens confirm modal — KVKK right-to-erasure).

---

### A9 — Notifications inbox (optional, ship later)

**Purpose:** History of in-app notifications. Lower priority — most members read on WhatsApp.

**Layout:** simple list of cards, newest first. Each card: icon + title + body excerpt + time. Tap → expands.

---

## Section B — Admin web (Next.js)

Desktop-first (1280-1920px). Sidebar 224px wide on left. Topbar 56px. Content max-width 1280px.

---

### W1 — Login

**Purpose:** Admin / staff sign in.

**Layout:**
- Centered card 400×440.
- Logo top-center.
- "Admin sign in" title.
- Email + Password inputs.
- "Sign in" CTA full-width.
- Tiny links: "Forgot password" / "Magic link instead".

**States:** standard error / submitting.

---

### W2 — Admin shell layout

**Purpose:** Persistent chrome around all admin pages.

**Sidebar (224px):**
- Logo + tenant name top.
- Nav items (icon + label, 14/500):
  - Dashboard
  - Members
  - Plans
  - Classes
  - Events
  - Check-ins
  - Payments
  - Notifications
  - Reports
  - Audit log
  - Settings
- Active item: amber 4px left border + slightly darker bg.
- Bottom: collapsed user card (avatar + name + sign-out icon).

**Topbar (56px):**
- Left: page breadcrumb.
- Center: global search (cmd+K).
- Right: notification bell, "+ New" dropdown (member, plan, class, event, payment manual entry), user avatar.

**Content area:** padded 24-32px, max 1280px.

---

### W3 — Dashboard

**Purpose:** First-glance health of the gym.

**Layout (above fold):**
- Date selector: "Today" "This week" "This month" "Last 30d" segmented.
- 4 KPI cards across:
  1. **Active members** (big number + delta vs last period in green/red)
  2. **MRR** (₺ value + delta)
  3. **Today's check-ins** (count + bar showing peak hour)
  4. **Churn (30d)** (% + delta)
- Below: 2 cards side by side:
  - **Live check-in feed** (last 10 events, real-time via Supabase channel; member name + time + source pill)
  - **Today's class schedule** (mini calendar; capacity dots filled per class)

**Below fold:**
- Charts row:
  - MRR over 90 days (line)
  - Attendance heatmap (day × hour grid)
  - Class fill rates (bar by class)
- "What needs attention" panel:
  - Failed payments awaiting retry (count + list)
  - Members at risk (basic churn signal: 14d no-show + payment failure)
  - Waitlist auto-promotes pending notification

---

### W4 — Members list

**Purpose:** Search + filter + bulk action on members.

**Layout:**
- Top bar: search input (full-width), filters (Status: All/Active/Paused/Past due/Cancelled · Plan: All/Basic/Premium · Joined: this month/last 90d/all-time), "+ New member" CTA.
- Table:
  - Columns: Photo · Name · Email · Plan · Status pill · Joined · Last visit · Actions (kebab)
  - Row hover: light bg.
  - Click row → W5 (member detail).
  - Bulk select via checkboxes; bulk actions menu (export, message via WhatsApp template, deactivate).
- Pagination: 50 per page or infinite scroll with sticky table header.

**Empty state:** "No members yet. [+ Add your first member]"

---

### W5 — Member detail

**Purpose:** Single source of truth for a member.

**Layout (3 columns or stacked on smaller screens):**

**Left column (320px):**
- Avatar large + name + status pill.
- Quick facts: phone, email, birthdate, joined date.
- Actions: Edit · Send message · Mark check-in · Cancel membership.

**Center column (main):**
- Tabs: **Overview** · Memberships · Payments · Bookings · Check-ins · Notes
- **Overview:** activity timeline (chronological feed of check-ins, class attendance, payments, notes).
- **Memberships:** list of active + past memberships, with start/end dates, status, plan.
- **Payments:** list of paid + failed + refunded; row click opens Stripe invoice.
- **Bookings:** list with status (confirmed/waitlist/attended/no-show).
- **Check-ins:** chronological list with source (qr/manual/kiosk) + gate.
- **Notes:** internal admin notes (KVKK-conscious; show "visible to staff only").

**Right column (280px):**
- Engagement summary card: visits this month, attended/no-show ratio, last contact.
- Risk score: traffic-light indicator + reason ("3 failed payments in 30d").
- Communication log: last 5 WhatsApp/email/push events.

---

### W6 — Member create / edit modal

**Purpose:** Quick add or edit form.

**Layout:** modal sheet, 480px wide.
- Form fields per the existing zod schema.
- "Send welcome WhatsApp" toggle (default on).
- "Auto-create membership with plan __" optional dropdown.
- "Cancel" / "Save" footer.

---

### W7 — Plans list + create

**Purpose:** Manage subscription plans.

**Layout (list view):**
- Cards for each plan side-by-side (max 3 per row).
- Each card: name, price + cycle, member count using this plan, active toggle, "Edit" button.
- "+ New plan" card with dashed border at the end.

**Create/edit form:**
- Name, description, price (minor units + currency), duration (days), features (comma list), Stripe price ID (auto-created on save), active toggle.

---

### W8 — Classes & sessions

**Purpose:** Manage class types + sessions (instances).

**Layout:**
- Tab bar: **Schedule** · Class types · Instructors

**Schedule view:**
- Calendar (day/week/month toggle).
- Sessions rendered as colored blocks; click to open W9.
- "+ Schedule session" CTA.
- Bulk-create: "Schedule recurring → Mon-Fri 18:00 Yoga, 20 weeks".

**Class types view:**
- Table: name, default capacity, default duration, color, active toggle.

**Instructors view:**
- Cards: avatar, name, contact, classes assigned, status.

---

### W9 — Class session detail

**Purpose:** See bookings for one session, manage attendance.

**Layout:**
- Hero: session name, date+time, instructor, location, capacity meter.
- 2 tabs: **Confirmed** · Waitlist
- Confirmed list: avatar, name, status (booked / attended / no-show); admin can mark attended/no-show inline.
- Waitlist list: position number, name, when joined; "Promote" button per row.
- Action footer: "Cancel session" (with red confirm — sends notifications to all bookings).

---

### W10 — Check-ins

**Purpose:** Live feed + manual check-in + history.

**Layout (top-down):**
- **Live feed card** (40% width): last 20 events, real-time, member name + time + source pill.
- **Manual check-in form** (60% width): member search (autocomplete by name/email/phone), "Mark check-in" CTA, source dropdown (manual/kiosk).
- Below: filterable history table (date range, source, gate, member).

---

### W11 — Payments

**Purpose:** All payment events.

**Layout:**
- KPI strip: MRR · MTD revenue · Failed last 30d · Refunds last 30d.
- Tabs: **All** · Paid · Failed · Refunded
- Table: date · member · plan · amount · status pill · Stripe invoice link · attempt #
- Failed-payment row has inline "Retry" + "Send dunning message" action.

---

### W12 — Notifications

**Purpose:** Compose + audit notification activity.

**Tabs:** **Templates** · Compose · History

**Templates tab:**
- Cards by category (welcome, payment, reminder, marketing, etc).
- For each: name, channel(s), language(s), preview, last edited.
- "Edit" opens a template editor with variable placeholders.

**Compose tab:**
- Recipient selector: single member / segment / all.
- Channel pick: push / email / WhatsApp / Telegram / all.
- Template pick + variable preview.
- Schedule: now / later (datetime).
- "Send" CTA → confirm modal showing recipient count + cost estimate.

**History tab:**
- Table of sends: time, template, channel, recipients, delivered count, failed count, click-through (if available).

---

### W13 — Reports

**Purpose:** Operator decision-making analytics.

**Layout:** dashboard with multiple panels, each can be expanded:
- **Revenue:** MRR, ARR, revenue by plan, revenue by mode (subscription/class drop-in/PT).
- **Members:** active members trend, new members per week, churn cohort.
- **Attendance:** heatmap day × hour, class fill rates, no-show rates.
- **Payments:** failed-payment recovery rate, dunning funnel.
- Each panel: CSV export button + "Share via WhatsApp" link (sends a static snapshot).

---

### W14 — Audit log

**Purpose:** Compliance & internal investigations.

**Layout:** table sorted by createdAt desc.
- Columns: Time · Actor · Action · Target type · Target ID · IP · Payload (collapsed JSON, expand on click).
- Filters: date range, actor, action.
- Export CSV.

---

### W15 — Settings

**Tabs:** **General** · Branding · Channels · Team · Billing · Compliance

- **General:** tenant name, slug, timezone, locale, contact info.
- **Branding:** logo upload, accent color picker (sets the CSS variable across member app + admin), tone of voice for templates.
- **Channels:** WhatsApp Business (status: connected/pending/disconnected, BSP details, template approval status), Telegram bot (token + bind URL), Email (Resend domain status), Push (Expo project status).
- **Team:** staff list + roles (admin/staff/instructor), invite flow.
- **Billing:** the gym's billing for OUR platform (their subscription to us; Stripe Customer Portal embed).
- **Compliance:** data export, member data deletion log, audit log shortcut, KVKK / GDPR posture.

---

## Section C — Public marketing site

Single-page or 4-page site, conversion-focused.

---

### M1 — Homepage

**Sections (top to bottom):**

1. **Hero**
   - Tagline (huge, 56px+/800): "WhatsApp-native gym software."
   - Sub: "The modern way to run a hybrid gym."
   - 2 CTAs: "Book a 14-day pilot" (dark) · "See it in action" (text link, opens demo).
   - Hero visual: 3 mobile mockups offset (member home, classes, membership) + 1 admin dashboard mockup behind them.

2. **Logos strip:** "Trusted by hybrid gyms in [TR · ES · AE · IN · BR]" (when we have logos; placeholders for now).

3. **3 themes (matches sales deck slides 5-7):**
   - WhatsApp-native
   - Rotating QR
   - One platform for hybrid
   - Each with icon + headline + 60-word body + screenshot/illustration.

4. **Comparison table** (Glofox / Mindbody / Wellyx / Us).

5. **Pricing card** (single $199 plan, see deck slide 10).

6. **FAQ accordion** (8-10 common objections).

7. **Final CTA** (full-width amber section): "Try us for 14 days. We migrate your data this week. [Book the call]"

8. **Footer** (links + KVKK/GDPR + social).

---

### M2 — Pricing page

Full version of the pricing card + feature breakdown table + FAQ.

---

### M3 — Demo page

- "Try it as a member" form (asks for phone, sends WhatsApp with demo gym link).
- "Book a 30-minute walkthrough" calendar embed (Calendly or Cal.com).

---

### M4 — Trust page

- Compliance posture (KVKK/GDPR/SOC 2 — what we do, what we promise).
- Security posture.
- Founder bio + photo.
- Roadmap link.
- Public changelog.

---

## Render order recommendation

When building artifacts in Claude Design, render in this order. Each builds on the previous and lets you stop early if something doesn't land.

1. **B1 — Home (member)** — the screenshot that ends up on the deck slide 4 + 8.
2. **W3 — Dashboard (admin)** — the screenshot that anchors the "professional tool" narrative.
3. **A5 — Plan picker** — needed for the pitch demo flow.
4. **A8 — Full-screen QR** — money shot for the slide 6 (rotating QR).
5. **B2 — Classes list** — second-most-shown member screen.
6. **B3 — Membership & payment** — proves Stripe-native polish.
7. **W4 — Members list** + **W5 — Member detail** — proves the admin depth.
8. **W12 — Notifications** — proves the WhatsApp-first thesis.
9. **M1 — Homepage hero** — the single most important marketing artifact.
10. Everything else, as time allows.

---

## How to brief Claude Design per artifact

Send Claude Design (or this Claude in artifact mode) the global design tokens (top of this file) ONCE, then per screen send only the relevant section verbatim. End each request with:

> "Render this as a single HTML/CSS artifact. Use only the tokens and component patterns above. No external images — use SVG, gradients, or CSS for any visual element. Do not invent additional sections beyond what the spec lists."

The first artifact will need the most back-and-forth. By the third or fourth screen, Claude will be consistent.

---

## What to test before locking these specs

Before pixel-perfecting any of this, run **B1 (Home)** and **W3 (Dashboard)** as low-fi artifacts past 3-5 prospects from the customer-interview pool. Watch for:
- Do they understand the rotating QR + countdown ring without explanation?
- Do they read the dashboard KPIs as "their reality" or as "generic SaaS"?
- Do they ask about features that aren't in the wireframe (gap — add)?
- Do they ignore features that are in the wireframe (cut — too noisy)?

If 4/5 prospects can't articulate what the home screen is for in their own words within 10 seconds, the specs are wrong. Rework before continuing.
