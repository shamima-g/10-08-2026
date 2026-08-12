# ContactPage — design notes

A single-page contact form. **One screen, one route (`/`).** Build the app to match this design
plus `mockup.html` and `tokens.css` in this folder. Front-end only — no backend, no API calls.

## Screens

### Contact
The only screen, served at the site root (`/`).

- Heading: **Get in touch**
- A form with three fields, **all required**:
  - **Name** (text) — placeholder "Your name"
  - **Email** (email) — placeholder "you@example.com"; must be a **valid email format**
  - **Message** (multi-line text) — placeholder "How can we help?"
- A primary button below the form: **Send message**
- **Client-side validation only:** all three fields required; email must be a valid format. Show an
  inline error under any invalid field.
- On a **valid** submit, replace the form on the **same page** (same `/` route) with a confirmation:
  **Thanks, we'll be in touch.**

## Palette & type
Brand colours are in `tokens.css`. Primary is the blue used for the **Send message** button. Body
font is Inter.

## Deliberately not specified
Where the submitted message goes is **not** decided — there is no backend in this design. Assume it
is not sent anywhere (front-end only) and flag it so we can confirm.
