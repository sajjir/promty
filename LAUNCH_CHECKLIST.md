# Launch hardening — codex branch

## Changes implemented

- L01: OTP proof before phone registration; disabled mock; persisted roles on each request; deleted/demoted/reassigned sessions revoked. Email changes are blocked until a verified-email flow exists.
- L02: manager authorization and prompt existence before multipart parsing; 5 MB/file, six files, genuine JPEG/PNG/WebP decoding, dimensions/pixel limits. SVG branding uploads are replaced by validated raster uploads.
- L03: escaped HTML/attributes and safe JSON-LD; removed fabricated ratings; production nonce CSP.
- L04: inactive content hidden from public detail/API/render/search/bookmarks/media/metadata; managers can preview. Premium is still a label, not a paywall.
- L05: fail-closed production credentials/SMS requirements; HTTPS SMS; durable one-use OTP, five attempts, resend/hourly caps; persistent endpoint/request budgets and Origin protection; SameSite=Lax cookies.
- L06/L07: consistent search contract, stale-response protection, Persian normalization; archive filters/sort before pagination; keyword searches can load subsequent pages.
- L08: personalization initialization only on content ID changes; copy validation; factual copy labels.
- L09: both manager roles see drafts; dashboard retrieves all API pages and displays pages of 20; related response reads data.
- L10: browser session history scoped to account/guest; no server-wide personal history.
- L11: default unsupported first/best claims and fake schema votes removed; empty trend section hidden; local refine returns unchanged text with explicit feedback, without image directives or incrementing copy count.

## Verified locally

TypeScript, production build, archive regression with 65 records, persistent OTP regression, isolated HTTP authorization/upload/draft/XSS/revocation tests. API lifecycle: create draft → preview → publish → edit → unpublish. These do not constitute a browser or staging acceptance test.

## Required staging acceptance before launch

- Real SMS delivery and OTP replay across restart; Prisma-backed role mutation and deletion.
- Mobile/desktop search, second page, return from detail, admin contribution queue and complete lifecycle from UI.
- Two consecutive customized copies preserve values; required blanks/unresolved tokens show clear errors; separate accounts cannot read each other's history.
- Production browser CSP/Google login, reverse proxy, HTTPS cookies/Origin, resource limits and legitimate upload dimensions.
- Real AI provider/workflow token and monetary limits. Current application cap counts requests, not money.
- Audit existing persisted privileged accounts and revoke all sessions issued by the old vulnerable authentication implementation before opening the site.
- Review existing persisted branding copy manually; defaults changed, existing authored settings are preserved.

## Deployment configuration

Set NODE_ENV=production; JWT_SECRET at least 32 characters; ADMIN_PASSWORD at least 12 characters and not the old default; ADMIN_EMAIL; HTTPS APP_ORIGIN; MELIPAYAMAK_USERNAME, MELIPAYAMAK_PASSWORD and positive numeric MELIPAYAMAK_OTP_BODY_ID. Never enable LOCAL_PREVIEW on a public deployment. Set HOST explicitly for container routing; default is loopback. Database failure in operational production must not fall back to JSON.

Mount OTP_STORE_PATH and SECURITY_STATE_PATH on persistent private storage, mode 0700 directory/0600 files. Processes must share the same filesystem on one host. Distributed deployments need transactional shared storage; these filesystem locks are not a multi-host solution. A crashed writer can leave a lock: stop/confirm all writers before an operator removes the stale lock; never delete the state files to clear a limit.

Initial password login creates the configured administrator only when no matching account exists. An existing ordinary account is never promoted by email/phone configuration; assign roles through a trusted senior administrator or audited server-side bootstrap.

## Recovery

Keep a private backup of database, media and security state before deployment. Retain the previous application artifact; revert code as a new Git commit if required, preserving persistent revocation/OTP state. Rolling back to the previous insecure authentication implementation is unsuitable for public launch. No production deployment, merge or main push is authorized by this change.

## Known limits

Prisma archive filtering currently loads the permitted dataset then filters in memory; correctness is covered but database-scale optimization remains. Admin initially fetches all API pages; display is paginated. Related suggestions inspect the first public archive page. Email replacement requires a future verified-email feature. No claim of real provider, production browser, or staging validation is made.
