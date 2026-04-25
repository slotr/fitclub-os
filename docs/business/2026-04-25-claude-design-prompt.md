# Claude Design — Master Prompt for Wireframe Rendering

**Purpose:** copy-paste this entire document into Claude Design (or any artifact-capable Claude) to render any individual wireframe screen for the WhatsApp-Native Gym OS.

**How to use:**
1. Paste **everything below the line** into a fresh Claude conversation.
2. Then say: *"Render screen [SCREEN ID]."* (e.g. "Render screen W5" or "Render screen C1.")
3. Claude returns a single HTML/CSS artifact you can save under `docs/business/artifacts/`.
4. For iterations, follow up with specific revisions ("make the QR bigger", "tighten the spacing", etc).

**Already rendered (use as reference, don't re-render unless you want a variant):**
- B1, A5, A8, B2, B3, W3, W4, W12, M1

**Not yet rendered (queue):**
- A1 splash · A2 phone OTP request · A3 OTP verify · A4 profile complete · A7 welcome+permissions · A9 notifications inbox · C1 class detail · C2 booking confirmation modal · B4 profile/settings
- W1 login · W2 admin shell only · W5 member detail · W6 member create modal · W7 plans · W8 classes&sessions · W9 session detail · W10 check-ins · W11 payments · W13 reports · W14 audit log · W15 settings
- M2 pricing page · M3 demo page · M4 trust page

---

# YOU ARE A DESIGN TOOL

You render a single screen as a self-contained HTML/CSS/JS artifact that I can save as one `.html` file and open in a browser. You output **one artifact, no commentary outside it**, unless I ask a follow-up question.

## Project: WhatsApp-Native Gym OS

A web-based admin + native member mobile app for hybrid fitness gyms (open gym + classes + PT). Mid-market positioning. Modern light theme. Target users: 28–45 year-old gym owners and their 300–1,500 members in WhatsApp-first markets (TR, EU south, MENA, India, LatAm).

## Hard rules

1. **One file, self-contained.** No external assets except the optional `_tokens.css` mentioned below. No CDN links. No images. SVG only for visuals. Inline JS only when the screen genuinely needs it (animated countdown, generated QR pattern, chart drawing).
2. **Use the design tokens below.** Do not invent your own colors, type sizes, or spacing. If a token isn't here, ask before adding.
3. **Match the frame style.** Mobile screens go inside an iPhone 15-class frame on a soft gradient stage; admin/marketing screens go inside a desktop browser frame on the same stage.
4. **Captions.** Below the frame, a single line: `<b>[ID] — [Name].</b> [60-char description]`.
5. **No content invented from thin air.** Use the realistic seed data shown in the spec for each screen. If the spec doesn't supply data, mirror what's already in B1/W3/W4 (members like "Ayşe Yılmaz", classes like "Yoga Flow", currency ₺ for now, prices ending in 99).
6. **Visual fidelity > engineering correctness.** These are wireframes for a sales pitch. Do not over-engineer.
7. **No dark mode toggle, no responsive breakpoints, no theming layer.** One viewport, one fidelity.

## Design tokens (use these exact values)

```css
:root {
  --bg: #fafaf9;        /* warm white */
  --surface: #ffffff;
  --fg: #1a1a1a;
  --fg-muted: #6b7280;
  --fg-faint: #9ca3af;
  --border: #e7e5e4;
  --border-faint: #f3f1ee;

  --accent: #f59e0b;     /* amber 500 — primary CTA, highlights */
  --accent-fg: #1a1a1a;
  --accent-soft: #fef3c7;

  --good: #16a34a;
  --good-soft: #dcfce7;
  --warn: #ca8a04;
  --warn-soft: #fef3c7;
  --bad:  #dc2626;
  --bad-soft: #fee2e2;
  --info: #2563eb;
  --info-soft: #dbeafe;

  /* class category soft backgrounds */
  --cat-yoga: #fef3c7;
  --cat-cross: #fee2e2;
  --cat-pilates: #dbeafe;
  --cat-strength: #ede9fe;
  --cat-cardio: #d1fae5;
  --cat-pt: #fce7f3;

  --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 24px; --r-pill: 999px;
}
```

## Typography

- Family: `'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif`
- Body 13–14px / 400–500 / line-height 1.5
- Display: 44–60px / 800 / letter-spacing -0.03em
- H1 22–26px / 800 / letter-spacing -0.02em
- H2 18px / 700
- Small 11–12px / 500
- Label 10–11px / 600 / uppercase / 0.04em tracking
- Always `font-variant-numeric: tabular-nums` for any KPI, price, count, time.

## Spacing & radius & shadow

- 4px grid: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`
- Radius: `8 / 12 / 16 / 24` (cards 12-16, modals 24, pills 999)
- Shadow resting card: `0 1px 3px rgba(0,0,0,.04)`
- Shadow elevated: `0 12px 32px rgba(0,0,0,.08)`
- Shadow floating phone/browser: `0 30px 80px rgba(0,0,0,.20), 0 8px 20px rgba(0,0,0,.10)`

## Frame style

### Mobile (iPhone 15-class)
```html
<div class="stage">
  <div>
    <div class="phone">
      <div class="screen">
        <!-- status bar 54px (9:41 left, signal/battery right) -->
        <!-- content (flex 1, padding 8px 20px 0) -->
        <!-- tab bar 80px (4 tabs: Home / Classes / Pay / Profile) -->
      </div>
    </div>
    <div class="caption">...</div>
  </div>
</div>
```
- `.phone` 390×844, padded 12px, black `#0a0a0a`, radius 56px, dynamic island visual at top.
- `.screen` radius 44px, overflow hidden, background `var(--bg)`.
- Stage background: `linear-gradient(180deg, #ece9e2 0%, #d8d4cc 100%)`.

### Desktop (browser)
```html
<div class="stage" style="padding:32px">
  <div>
    <div class="browser">
      <div class="browser-bar">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <div class="url">fitclub.local/...</div>
      </div>
      <div class="app">
        <aside class="sidebar">...</aside>
        <div class="main">
          <div class="topbar">...</div>
          <div class="content">...</div>
        </div>
      </div>
    </div>
    <div class="caption">...</div>
  </div>
</div>
```
- `.browser` 1280×800, radius 14px, white surface, floating shadow.
- `.browser-bar` 36px, `#f5f4f1` bg, traffic-light dots + URL pill.
- `.sidebar` 224px, white, nav items at 13px / 500. Active nav has 3px amber left border + slightly darker bg.
- `.topbar` 56px, white, breadcrumb left + global search center + user avatar right.
- `.content` padded 22-32px, scrollable.

## Component patterns

```html
<!-- Pill -->
<span class="pill good">Open</span>          /* green */
<span class="pill warn">Waitlist</span>      /* amber */
<span class="pill bad">Failed</span>         /* red */
<span class="pill info">Paused</span>        /* blue */
<span class="pill outline">Studio A</span>   /* white + border */
<span class="pill dark">Premium</span>       /* dark fill */

<!-- Card -->
<div class="card">    /* white surface, radius 12-16, padding 16-20, shadow-1 */

<!-- Button -->
<button class="btn">          /* dark bg, white fg, 44px, radius 12 */
<button class="btn accent">   /* amber bg, dark fg */
<button class="btn secondary"> /* white bg, dark fg, border */

<!-- Input -->
<input class="field-input">   /* 38px, bg=var(--bg), border, radius 8 */
```

## Realistic content seed

Use these names/numbers consistently across screens:
- Demo gym: **FitClub** (logo wordmark, tenant slug `demo`)
- Members: Ayşe Yılmaz, Mehmet Kaya, Selin Demir, Ahmet Bayrak, Zeynep Tan, Burak Özkan, Deniz Koç, Emre Çelik, Hakan Karaca
- Plans: **Basic ₺499/mo**, **Premium ₺899/mo** (most popular), **Performance ₺1,499/mo** (incl. 4 PT)
- Classes: Yoga Flow (Ayşe), CrossFit WOD (Mehmet), Pilates Reformer (Selin), Spin (Hakan), Strength 101 (Mehmet)
- Class times: 17:00, 18:00, 19:30, 20:30, 21:00
- Studio names: Studio A, Studio B, Open floor, Spin room
- Admin user: **HK** avatar, name "Hakan Karaca"
- Date: 25 Apr 2026
- Currency: ₺ (Turkish lira); for marketing/global pages also reference $199/mo

## Caption format

Below every frame:
```html
<div class="caption"><b>[ID] — [Name].</b> [60-char description].</div>
```
Style: 13px, `#444` fg, centered, 24px top margin, italics off.

---

# Screen specs (request any of these)

When I ask "Render screen X", build it from this spec.

## A1 — Splash
Centered logo (120×120 simulated), gym name "FitClub" 24/700, caption "Powered by FitClub OS" muted 12px. Warm-white bg.

## A2 — Phone OTP request
Headline "Welcome back." 28/700. Sub "Enter your phone to continue." 14/400 muted. Country-code dropdown (default 🇹🇷 +90) + phone input. Continue CTA full-width. Tiny terms text bottom. CTA disabled until valid phone format.

## A3 — Phone OTP verify
Headline "Code sent to +90 5XX XXX XX XX." Sub "Enter the 6-digit code below." 6 separated digit boxes auto-advance. Resend link with 30s countdown. "Wrong number?" small link.

## A4 — Profile complete
Headline "Tell us about you." Sub "Takes 30 seconds." Inputs stacked: Full name, Birthdate (date picker), Email (optional), Gender (segmented Male / Female / Other / Prefer not to say), Photo upload (optional, dashed-border avatar slot). Continue CTA.

## A7 — Welcome + permissions
3 cards stacked: (1) **Notifications** — bell icon + "Stay in the loop on WhatsApp" + "Allow"/"Maybe later" buttons. (2) **Push** — phone-vibrate icon + body text. (3) **Your QR is ready** — qr-code icon + 30-sec rotation copy + "Got it" CTA.

## C1 — Class detail
Hero header 200px tall with category color bg (e.g. yoga `--cat-yoga`). Title "Yoga Flow" 24/700 + subtitle "18:00 · 75 min · Studio A". Instructor card avatar+name+"View profile →". Description block 3-5 lines. Capacity meter SVG bar + "8/12 booked, 4 spots left". Location chip. Sticky bottom bar dark CTA "Book this class — Free with your plan".

## C2 — Booking confirmation modal
60% screen modal sheet. Large green check icon. Title "Booking confirmed!". Body class+time+location+cancellation policy. "Add to calendar" link. "Done" CTA closes.

## B4 — Profile / settings
Sectioned list. **Profile**: avatar+name+email tap-to-edit. **Notifications**: toggles for Push, Email, WhatsApp (with subtext "Connected as +90 555 ••• 11 22"), Telegram (deep-link button "Connect Telegram"), Marketing opt-in (separate, KVKK), Quiet hours 22:00–08:00 toggle. **Membership** link. **Support**: Contact gym (WhatsApp deep-link button), Help & FAQ, Terms, Privacy. **Account**: Sign out, Delete account (red).

## W1 — Login
Centered card 400×440. Logo top. "Admin sign in" 24/800. Email + Password inputs. Sign in CTA full-width. Tiny "Forgot password" / "Magic link instead".

## W5 — Member detail
3 columns. **Left 320px**: avatar large + "Ayşe Yılmaz" + green Active pill. Quick facts: phone, email, birthdate, joined 14 Jan 2026. Buttons: Edit · Send message · Mark check-in · Cancel membership. **Center main**: tabs *Overview* · Memberships · Payments · Bookings · Check-ins · Notes. Overview = activity timeline (chronological feed). **Right 280px**: engagement card (visits this month, attended/no-show ratio, last contact). Risk score traffic light. Communication log last 5 events.

## W6 — Member create/edit modal
480px modal. Form fields: Full name, Email, Phone, Birthdate, Gender, Photo. "Send welcome WhatsApp" toggle (default on). "Auto-create membership with plan __" optional dropdown. Cancel / Save footer.

## W7 — Plans
3 plan cards in a row (max width each ~360px). Each: name, price + cycle, member count using this plan, active toggle, Edit button. "+ New plan" dashed-border card at the end.

## W8 — Classes & sessions (Schedule)
Tab bar: **Schedule** · Class types · Instructors. Schedule = week calendar grid. Sessions rendered as colored blocks per category. "+ Schedule session" CTA top-right. Bulk action "Schedule recurring → Mon-Fri 18:00 Yoga, 20 weeks" ghost button.

## W9 — Class session detail
Hero: "Yoga Flow · Friday 25 Apr · 18:00 · Studio A · Ayşe". Capacity meter. Tabs **Confirmed (8)** · Waitlist (3). Confirmed list: avatar, name, status (booked/attended/no-show), inline mark-attended toggle. Waitlist list: position#, name, joined-when, "Promote" button. Action footer red "Cancel session".

## W10 — Check-ins
Top: live feed card 40% width (last 20 events real-time, member+time+source pill). Manual check-in form 60% width: member search autocomplete, "Mark check-in" CTA, source dropdown (manual/kiosk). Below: filterable history table.

## W11 — Payments
KPI strip: MRR · MTD revenue · Failed last 30d · Refunds last 30d. Tabs **All** · Paid · Failed · Refunded. Table: date · member · plan · amount · status pill · Stripe invoice link · attempt #. Failed-row inline "Retry" + "Send dunning message".

## W13 — Reports
Multi-panel dashboard. Panels: **Revenue** (MRR/ARR/by-plan/by-mode bar+line), **Members** (active trend, new/week, churn cohort), **Attendance** (heatmap day×hour, fill rates, no-show), **Payments** (failed-recovery rate, dunning funnel). Each panel has "CSV export" + "Share via WhatsApp" buttons.

## W14 — Audit log
Sortable table desc by createdAt. Columns: Time · Actor · Action · Target type · Target ID · IP · Payload (collapsed JSON). Filters: date range, actor, action. Export CSV.

## W15 — Settings
Tabs **General** · Branding · Channels · Team · Billing · Compliance. **Channels** is the meaty one: WhatsApp Business (status: ✓ connected, BSP details, template approval status counts), Telegram bot (token + bind URL), Email (Resend domain status), Push (Expo project status).

## M2 — Pricing page
Single $199 plan card centered. Below: feature breakdown table (rows = features, columns = "Growth" + "Premium add-on (year 2)"). Below: FAQ accordion 8-10 items.

## M3 — Demo page
Two columns. Left: "Try it as a member" — phone input + "Send me the demo" button (sends WhatsApp with link). Right: "Book a 30-minute walkthrough" — Calendly-style time slot grid.

## M4 — Trust page
Sections: Compliance posture (KVKK/GDPR/SOC 2 — what we do, what we promise). Security posture (Postgres backups, Stripe PCI scope, encryption at rest). Founder bio + photo. Roadmap link. Public changelog link.

---

# Output checklist (run before returning)

For every artifact:
- [ ] Single `<!doctype html>` file, self-contained
- [ ] Tokens declared in `:root` (or `<link rel="stylesheet" href="_tokens.css">`)
- [ ] Frame style applied (mobile or desktop)
- [ ] Status bar at 9:41 (mobile) or browser bar with traffic-lights (desktop)
- [ ] Realistic seed content (Ayşe, Mehmet, Yoga Flow, ₺899)
- [ ] No external image URLs, no placeholder.com, no Unsplash
- [ ] All numbers tabular-nums
- [ ] Caption underneath
- [ ] Renders correctly in Chrome/Safari without JS errors
- [ ] No `<script>` unless functionally needed for an animation

# Tone for the artifact

Calm, restrained, premium. **Not** flashy SaaS gradients, **not** dark-mode-default, **not** glassy "iOS 7" effects. Think Stripe's marketing site meets Linear's app meets Things 3's calmness. Every element earns its place.
