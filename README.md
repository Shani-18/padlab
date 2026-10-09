# PadLab

A buildless gamepad diagnostics website, written in HTML, CSS and native JavaScript modules. The production site has no framework, package dependencies, third-party fonts, analytics or remote image requests.

## Run

Use Node 22.8 or newer for development commands:

```sh
npm run build
npm start
npm test
npm run check
```

Preview: http://127.0.0.1:4173. Serve `dist/` over HTTPS in production; do not open index.html through file:// because native modules and controller access require a proper origin. Node is for development only, not a hosting requirement.

## Structure

- `dist/index.html`: semantic homepage and diagnostic workspace.
- `dist/assets/styles.css`: layered CSS, responsive breakpoints and design tokens.
- `dist/assets/js/gamepad.js`: pure normalization, sampling and reporting helpers.
- `dist/assets/js/app.js`: device lifecycle, UI and browser interaction.
- `dist/guides/`: seven crawlable diagnostic and device guides.
- `scripts/content.mjs` and `scripts/expand-guides.mjs`: content generators; run `npm run build` after edits.
- `scripts/guide-improvements.mjs`: reference sections and compatibility evidence.
- `scripts/site.mjs`: production origin and public URL convention.
- `scripts/finalize.mjs`: normalizes metadata/links and generates sitemap and CSP hashes.
- `tests/`: unit and simulated DOM integration tests using Node's built-in runner.
- `docs/`: competitor/content strategy and test evidence.

## Behavior

Reads all connected devices exposed by the browser, with selection by index. Refreshes readings at about 30 UI updates per second, suspending work when the tab is hidden. Controller identity changes reset session measurements. Unknown mappings retain raw input data without guessed stick assignments. Standard mapped axes use 0/1 and 2/3. Missing axes show unavailable values.

Drift samples use mean radial distance and peak distance over at least three seconds, not magnitude of the mean vector. This avoids opposing offsets canceling. A hidden tab or controller change cancels the sample. The deadzone slider is purely visual. Export contains the current snapshot, observed pressed buttons and completed sample, with explicit simulation flags for demo data.

Vibration is capability-detected and user-triggered, with success, preemption and rejection feedback. Real actuator behavior still needs physical verification.

## Deploy / search launch

The current production host is Cloudflare Workers static assets. Use the repository-root wrangler.jsonc with assets.directory set to dist, automatic clean HTML URLs, and 404-page missing-page handling. The existing deployment command should honor this configuration (normally npx wrangler deploy). No framework or runtime server is needed in production. The old .openai hosting metadata is historical and is not the deployment target.

Public article URLs omit .html; underlying files remain HTML. The local server follows the same URL convention. Run npm run build to regenerate guides, normalize URLs, refresh all JSON-LD CSP hashes and generate the full sitemap. npm run check performs validation without modifying files. The Google verification tag remains in dist/index.html.

For an origin change, update scripts/site.mjs and homepage metadata together, regenerate, and verify the complete migration. See [SEO release checklist](docs/SEO-RELEASE.md) for deployment and Search Console checks.

## Scaling

Keep measurements separate from rendering. Add controller-specific adapters only after verified mapping tests; preserve raw inputs as the fallback. Add guides to the content helper to keep metadata, navigation and sitemap consistent. Maintain unique intent per page rather than generating repetitive brand-keyword pages. Fingerprint assets and enable long-lived cache headers as release traffic grows. Add any analytics only after updating the privacy policy.

## Validation limits

Automated tests simulate browser devices and DOM behavior; they are not physical controller or full browser-engine tests. See `docs/TESTING.md` for completed checks and hardware acceptance steps.
