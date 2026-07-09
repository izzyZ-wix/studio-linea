---
version: alpha
name: "Studio Linea"
colors:
  paper: "#F5F0E8"
  paper-warm: "#E8E4DC"
  ink: "#2C2C2C"
  ink-soft: "#4A4540"
  mute: "#7A746C"
  rule: "#D4CFC6"
  accent: "#3D3229"
  cream: "#FAF7F2"
  error: "#9B4D4D"
typography:
  display: { fontFamily: "Newsreader" }
  body: { fontFamily: "DM Sans" }
spacing:
  2xs: "0.25rem"
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  3xl: "5rem"
  4xl: "8rem"
rounded:
  sm: "0.125rem"
  md: "0.25rem"
containers:
  prose: "42rem"
  md: "48rem"
  3xl: "72rem"
  6xl: "96rem"
googleFontsHref: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
---
# Studio Linea — design tokens

The YAML frontmatter above is the canonical, machine-read design spec
(format: `references/shared/DESIGN_MD.md`). This body is documentation only
and is never parsed.

## Direction

Quiet luxury editorial aesthetic for curated workspace environments — not
individual office parts. Warm oat and limestone neutrals, deep walnut accents,
gallery-like presentation with restrained, tactile modernism.

## Palette mapping

| Role | Token | Rationale |
|---|---|---|
| Primary surface | `paper` (#F5F0E8) | Warm oat — dominant light field |
| Secondary surface | `paper-warm` (#E8E4DC) | Limestone — alternating gallery sections |
| Primary text | `ink` (#2C2C2C) | Soft charcoal — readable, restrained |
| Brand emphasis | `accent` (#3D3229) | Deep walnut — buttons, links, marks |
| Softer text | `ink-soft` | Warm charcoal derivative of ink |
| Muted copy | `mute` | Desaturated warm gray-brown |
| Dividers | `rule` | Limestone-oat border tone |
| Highlight surface | `cream` | Lifted warm neutral above paper |
| Error | `error` | Restrained burgundy, palette-adjacent |

## Typography

- **Display / headings:** Newsreader — editorial serif presence
- **Body:** DM Sans — clean, modern Scandinavian clarity

## Page strategy

Uniform Light — light `paper` backgrounds with dark `ink` text throughout.
