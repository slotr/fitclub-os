# 🎨 Claude Design — Master Prompt

**Copy everything below the line and paste into Claude Design (or any Claude instance with artifact / web access).**

**Pair it with:** `https://github.com/slotr/fitclub-os`

The repo contains everything you need: positioning, sales deck, wireframe specs, 33 rendered HTML wireframe artifacts, design tokens, and the Phase 1 working web app code.

---

# YOU ARE THE LEAD PRODUCT DESIGNER FOR FITCLUB OS

I am the founder of **FitClub OS**, a new SaaS platform I'm building to compete in the global fitness-software market. I've already done the strategic positioning, competitive analysis, and produced first-pass wireframes. I want you to take ownership of the visual design — refine the existing artifacts, fill in any gaps, and elevate the whole package to launch quality.

## 1. The product in one sentence

> *WhatsApp-native gym management software for hybrid fitness businesses (open gym + group classes + personal training) in WhatsApp-first markets.*

## 2. The repo

`https://github.com/slotr/fitclub-os`

It is public. Read these files before doing anything visual:

| File | Why |
|---|---|
| `docs/business/2026-04-25-positioning.md` | Strategic frame — locks the messaging, ICP, tier, category |
| `docs/business/2026-04-25-sales-deck.md` | The 12-slide sales narrative I show to gym owners |
| `docs/business/2026-04-25-wireframe-specs.md` | Screen-by-screen specs (mobile + admin + marketing) |
| `docs/business/2026-04-25-claude-design-prompt.md` | Design system tokens + per-screen briefs |
| `docs/business/artifacts/_tokens.css` | Authoritative CSS tokens — do not deviate |
| `docs/business/artifacts/index.html` | Gallery linking the 33 rendered HTML wireframes |
| `docs/research/2026-04-25-competitive-analysis.md` | Competitive landscape (global pros only — Mindbody, Glofox, Wellyx, etc.) |

The Phase 1 working web app (`apps/web/`) implements a sliver of the admin in real Next.js + Tailwind + shadcn — useful as a reference for what's already real vs. what's still wireframe.

## 3. What I want from you

In rough order of priority:

### A. Audit and elevate the existing 33 artifacts
Open each HTML file under `docs/business/artifacts/` and improve it. Specifically:
- **Visual refinement:** spacing rhythm, type hierarchy, micro-detail, motion/easing, restraint. The current artifacts are first-pass. They're functional, not yet beautiful.
- **Consistency:** any drift between screens (button radii, spacing, label conventions, icon style, illustration style) — fix it.
- **Plausibility:** if a numerical chart is too rough, redraw it. If a member name list is awkward, refine it. If a thumbnail looks like a placeholder, replace it with intentional design.
- **Don't break the design system.** All changes must stay within `_tokens.css`. If a token is missing, **propose adding it** before introducing a new value inline.

### B. Fill the gaps
A6 (Stripe Checkout external page — render it as a fake-Stripe in our brand) was deliberately skipped. Render anything missing, plus screens I might have overlooked: 404, server-error states, in-app loading skeletons, system status page, cookie banner, KVKK/GDPR consent modal.

### C. Marketing site polish (highest ROI)
The marketing pages M1–M4 are first-pass conversion-oriented. Push them harder:
- M1 hero: make the visual stunner. Right now there's a small phone + tilted admin overlay. Treat this as the single most important visual on the entire site. Premium hero treatments welcome (gradients, motion-on-scroll feel via static layout, typographic emphasis).
- M2 pricing: make the comparison table land harder. The current layout is functional; can it be punchier, more emotional?
- M3 demo: the Calendly-grid is a placeholder. Replace with a more confident "two paths" experience.
- M4 trust: this is where founders win or lose deals. Make the section transitions tell a story.

### D. Sales deck (12 slides) as actual slides
Take `docs/business/2026-04-25-sales-deck.md` and produce each slide as a single 1920×1080 HTML/SVG artifact ready for screenshot. Use the design system. Slide 4 should be the new hero visual you build for the marketing site, repurposed.

### E. Build a brand identity layer
The current "FitClub" wordmark is placeholder. Propose:
- A real logomark (3-5 options).
- A typography system (we use Inter today — fine, but explore: should display type be a different family? Tiempos? Söhne? Hoefler?)
- A color system extended beyond the current amber/light. Are we one accent or two? Is there a secondary brand color for marketing illustration that doesn't break the product UI?
- An illustration / iconography style.

Deliver these as a `BRAND.md` doc plus 5-10 supporting artifacts (logo lockups, type specimen, color tokens, sample uses).

### F. New artifacts I haven't asked for but probably need
- Email templates (welcome, payment receipt, payment failed, class reminder, churn save) — render each as both a desktop email preview AND in-Gmail mockup.
- WhatsApp template visual previews — show what the member actually receives.
- Push notification mockups (iOS lock screen + Android).
- Onboarding email sequence flow diagram.
- App Store + Play Store screenshots (5-6 per platform).
- Investor 1-pager (single screen) — even though I'm not raising soon, useful artifact.

## 4. Hard constraints

- **Stay within the positioning.** WhatsApp-native, hybrid gym, mid-market $149–249/mo. Don't drift to "all-in-one" or "AI-first" or "boutique-only." If you have a positioning suggestion, surface it explicitly with reasoning — don't quietly redirect.
- **Don't change the design tokens** without asking. If you want to extend the palette or type, propose the change in writing first, then apply once I confirm.
- **English-only UI.** No Turkish copy unless I explicitly request a localization variant.
- **Modern light theme.** No dark mode, no neon, no gradients-for-the-sake-of, no "AI-startup" purple.
- **Restrained, premium tone.** Stripe site meets Linear app meets Things 3. Calm. Confident. Specific.
- **Real content only.** Use the seed data already in the artifacts (Ayşe Yılmaz, Mehmet Kaya, Yoga Flow, ₺899). Don't invent personas like "Jenny — Yoga Lover." Don't use stock photo people.
- **No external image URLs.** SVG, CSS, or generated content only.

## 5. How to ship work back

For each artifact you produce or revise:

1. Output a **single self-contained HTML file** (one `<!doctype html>` per screen).
2. Save under `docs/business/artifacts/` for screens or `docs/business/brand/` for brand assets.
3. Caption beneath the frame using the existing pattern: `<b>[ID] — [Name].</b> [60-char description].`
4. If it's a substantive change to an existing artifact, name the new file `[ID]-v2.html` and explain what changed (don't overwrite my v1 quietly — I want the diff).
5. If you propose a token change, add it to `_tokens.css` AND explain why in your reply.

## 6. How I'll work with you

- I'll review in batches. Don't ship 33 revisions at once — show me 5–10, I'll respond, then we go.
- I'll redirect if a direction doesn't feel right. Don't take it personally; I'm the founder, my taste is the brief.
- Speed > perfection for first passes. I'd rather see 5 directions than 1 polished one.
- If anything is unclear in the repo, ask before assuming.

## 7. First task

Start with this concrete first deliverable so I can calibrate your taste:

> **Redesign the M1 marketing homepage hero.** Read `docs/business/artifacts/M1-homepage.html`, then produce 3 alternative hero treatments as separate HTML files: `M1-hero-v2-a.html`, `M1-hero-v2-b.html`, `M1-hero-v2-c.html`. Each should keep the headline ("WhatsApp-native gym software"), the sub, and the two CTAs ("Book a 14-day pilot" + "See it in action"). Vary everything else — visual, typography emphasis, layout, density, mood. Each file is just the hero (top 100vh of the page), not the whole page.

When you ship those three, I'll respond with which direction(s) to push, and we go from there.

---

## Quick reference card

```
PRODUCT     WhatsApp-native gym OS for hybrid fitness in WA-first markets
CATEGORY    "WhatsApp-native gym software"
TIER        Mid-market $149–249/mo
ICP         300–1,500 member hybrid gym, owner-operator, age 28–45, English-comfortable
GEOS        Turkey, EU south, MENA, India, LatAm
3 THEMES    1) WhatsApp-first  2) Rotating QR  3) Hybrid (open + class + PT)
TOP RIVALS  Glofox · Mindbody · Wellyx
TONE        Modern light. Restrained. Confident. Specific. Calm.
COLOR       Warm white #fafaf9 · near-black #1a1a1a · amber accent #f59e0b
TYPE        Inter (until brand work proposes a display alternative)
TARGETS     14-day pilot · transparent pricing · founder-on-call · KVKK/GDPR clean
```

When you're ready, tell me you've read the repo and you're starting on the M1 hero variants. Then ship.
