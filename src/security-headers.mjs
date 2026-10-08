// One source for the site's security headers. The Worker attaches them to its
// /api/* JSON responses; scripts/build.mjs writes the same values into dist/_headers,
// which Static Assets applies to every page and file without invoking the Worker.
export const SECURITY_HEADERS = Object.freeze({
  'strict-transport-security':'max-age=31536000; includeSubDomains; preload',
  'x-content-type-options':'nosniff',
  'referrer-policy':'strict-origin-when-cross-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy':'same-origin',
  'x-frame-options':'DENY',
  'content-security-policy':"default-src 'self'; img-src 'self' https://digitronics.ma data:; media-src 'self' https://digitronics.ma; connect-src 'self' https://cloudflareinsights.com; style-src 'self'; script-src 'self' https://static.cloudflareinsights.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://wa.me https://digitronics.ma; upgrade-insecure-requests"
});
