# PadLab

A buildless gamepad diagnostics website, written in HTML, CSS and native JavaScript modules. The production site has no framework, package dependencies, third-party fonts, analytics or remote image requests.

## Run

Use Node 22.8 or newer for development commands:

```sh
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
- `dist/guides/`: three original, crawlable topic pages.
- `scripts/content.mjs`: optional guide authoring helper. Regenerate pages with `node scripts/content.mjs` after editing it.
- `tests/`: unit and simulated DOM integration tests using Node's built-in runner.
- `docs/`: competitor/content strategy and test evidence.

## Behavior

Reads all connected devices exposed by the browser, with selection by index. Refreshes readings at about 30 UI updates per second, suspending work when the tab is hidden. Controller identity changes reset session measurements. Unknown mappings retain raw input data without guessed stick assignments. Standard mapped axes use 0/1 and 2/3. Missing axes show unavailable values.

Drift samples use mean radial distance and peak distance over at least three seconds, not magnitude of the mean vector. This avoids opposing offsets canceling. A hidden tab or controller change cancels the sample. The deadzone slider is purely visual. Export contains the current snapshot, observed pressed buttons and completed sample, with explicit simulation flags for demo data.

Vibration is capability-detected and user-triggered, with success, preemption and rejection feedback. Real actuator behavior still needs physical verification.

## Deploy / search launch

Upload the contents of `dist/` to static hosting with HTTPS. `.openai/hosting.json` configures the registered Sites project. Sites defaults to an owner-private preview; that preview cannot be indexed by Google. Make the intended production site public before search launch.

For a different production origin, replace the current origin in `dist/index.html` and `scripts/content.mjs`, regenerate content, then run checks. Confirm all canonical URLs, Open Graph URLs, structured data and the sitemap point at that one origin. Set real 404 status handling. `_headers` is a static-host header template; verify support on your chosen host and adapt it if necessary. The check command refreshes the inline JSON-LD CSP hash after content edits.

Submit the public sitemap in Google Search Console and inspect representative URLs. Measure Core Web Vitals using real visitors after launch. No ranking, indexing deadline, rich result or Lighthouse score is promised.

## Scaling

Keep measurements separate from rendering. Add controller-specific adapters only after verified mapping tests; preserve raw inputs as the fallback. Add guides to the content helper to keep metadata, navigation and sitemap consistent. Maintain unique intent per page rather than generating repetitive brand-keyword pages. Fingerprint assets and enable long-lived cache headers as release traffic grows. Add any analytics only after updating the privacy policy.

## Validation limits

Automated tests simulate browser devices and DOM behavior; they are not physical controller or full browser-engine tests. See `docs/TESTING.md` for completed checks and hardware acceptance steps.
