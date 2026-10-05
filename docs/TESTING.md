# Verification record

Tested October 5, 2026.

## Completed

- `npm test`: **17/17 passed** using Node built-in tests. Pure-function checks and VM-based integration harness; no testing dependencies.
- `npm run check`: **7 HTML pages passed** unique titles, indexable-page descriptions/canonicals, one H1 per page, unique IDs, internal file links, section anchors and JSON-LD parsing. The check also synchronizes the CSP hash.
- `node --check` passed for both production JavaScript modules.
- Local HTTP preview loaded in the Codex Chromium browser with no reported console warnings/errors.
- Desktop screenshot reviewed: header, hero, connection state and diagnostic workspace render correctly.
- Demo enabled from the actual UI: simulated labels, trigger values, stick coordinates and button presses appear.
- Browser drift action completed: demo left stick showed 60.00% mean and peak, consistent with its circular simulated path. Right stick showed approximately 1–2% offset. Result is explicitly labeled simulated.
- Mobile viewport at 390 px: no elements exceeded the viewport; the tool, guides and FAQ stack vertically. Full-page capture stitching showed repeated strips, so DOM checks confirmed exactly one stick panel and FAQ section rather than treating screenshot stitching as duplicated page content.
- Homepage and drift guide at 320 px: document width stayed within viewport width.
- Guide link navigation opened the correct article heading. Temporary viewport overrides were reset.

## Automated scenario coverage

1. Empty state, sparse index connection, and disconnect cleanup.
2. Multiple-controller switching and session isolation.
3. Unmapped controller raw input fallback.
4. Timed drift sample with known 3/4/5 radial offset and JSON export.
5. Hidden-tab sampling cancellation and animation restart.
6. Session reset while sampling.
7. Demo labels, simulated exports and exit cleanup.
8. Haptic command arguments, success and rejected promise feedback.
9. Browser policy denial without loop failure.
10. Deadzone reference changes without raw data filtering.
11. Invalid, legacy numeric and out-of-range input normalization.
12. Missing axes and diagonal magnitude above 100%.
13. Mean radial calculation that does not cancel opposing directions.
14. Sparse arrays and disconnected device filtering.
15. Missing API and thrown API calls.
16. Demo input ranges over multiple time samples.
17. Report serialization and numeric button ordering.

The initial default Node runner could not spawn sandbox child processes (EPERM). Running with `--test-isolation=none` resolved this environment restriction, and that command is now the documented test script.

## Physical acceptance still required

No physical gamepad was available to verify. Before broad release, check an Xbox pad and a DualSense/DualShock over USB and Bluetooth on the actual supported browser/OS combinations. Verify all buttons, triggers, full stick travel, reconnect and switching, then feel the short vibration pulse. Test an unmapped controller if support for unusual devices matters.

Firefox, Safari, mobile hardware behavior, screen-reader behavior and production Core Web Vitals were not measured. No universal compatibility, accessibility certification or performance score is claimed.
