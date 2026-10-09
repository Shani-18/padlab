# SEO release checklist

## Included in this change

- Canonicals, sitemap entries, structured-data URLs and local links use final extensionless article URLs.
- Core and device guide generators normalize URLs through scripts/site.mjs.
- Finalization generates the full sitemap and all inline JSON-LD CSP hashes.
- npm run check is read-only and rejects stale hosts, redirected internal HTML links, mismatched canonicals, incomplete sitemap coverage and missing schema hashes.
- The Cloudflare Workers assets configuration serves the nearest 404.html with HTTP 404.
- Content includes distinct guide summaries, early tester links, sources, related reading, illustrative examples and explicitly untested hardware compatibility records.

## Deploy

1. Run npm run build, npm test and npm run check.
2. Commit generated dist files as well as scripts and wrangler.jsonc.
3. Existing Workers deployment should use `npx wrangler deploy` from the repository root, honoring wrangler.jsonc. Confirm the project's existing dashboard command uses this configuration; uploading only dist cannot configure Workers missing-page behavior.
4. Verify `/guides/dualsense-test` returns 200 and its canonical matches. Legacy `.html` URLs should redirect to that address.
5. Verify a nonexistent URL returns 404 with the helpful HTML page, not an empty body or HTTP 200.
6. Verify the live sitemap lists 11 final URLs and no `.html` entries.

## Requires external evidence

- Search Console: inspect the Google Index tab, selected canonical and indexing reasons. Live-test success is not proof of indexing.
- Retry the sitemap after deployment and record its next read/status. The previous fetch error's cause remains unconfirmed.
- Respect the manual indexing daily quota. Repeated requests do not resolve it.
- Collect real controller records before changing any compatibility row to tested. Record model/firmware, OS, browser version, connection, date, mapping, inputs and physical vibration result. Do not use simulated demo readings as hardware evidence.
- Add original screenshots only from documented sessions, with sensitive device information reviewed before publication.
- Confirm a maintainer's preferred public identity/contact before publishing personal information. The About page currently links to the existing project's public issue route.
- Measure deployed performance with PageSpeed Insights and Search Console field data when available; no performance score has been claimed.
- Track impressions/clicks weekly, research actual queries, and earn relevant editorial mentions. Backlink acquisition and rankings are not implementation outcomes.

Keep the verification tag in the homepage. Changing the permanent domain later requires a coordinated update of redirects, metadata, sitemap and Search Console.
