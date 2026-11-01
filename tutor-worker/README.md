# Secure Gemini tutor setup

The frontend never receives the Gemini key. This Worker forwards short learning questions to Gemini and limits each IP to five requests per minute. Provider quotas still apply; free access is subject to Google's current eligibility and limits. Origin checks are not authentication; configure a daily provider quota before public launch.

1. Create your Gemini key in https://aistudio.google.com/apikey . Keep it private.
2. In this directory, run `npx wrangler login` and `npx wrangler secret put GEMINI_API_KEY`. Enter the key only at the secret prompt.
3. Run `npx wrangler deploy` using your Cloudflare account. Confirm the selected model is available in your region/free tier; adjust GEMINI_MODEL if needed.
4. Put the resulting HTTPS Worker URL in `../tutor-config.js` as ACADEMY_TUTOR_URL. This URL is public and contains no secret.
5. Publish frontend files together. Test an English and Somali question, an unavailable provider, and rate limiting before announcing the tutor.

Only lesson context and the question are sent, not learner names or progress. Answers render as plain text. Somali accuracy needs review by a fluent speaker. The tutor is optional and does not block lessons.
