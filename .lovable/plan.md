## Update Google OAuth credentials

You've created a new **Web application** OAuth client in Google Cloud Console with the correct redirect URIs. Now we need to replace the old Desktop credentials in the backend with the new Web app credentials.

### Steps

1. Prompt you to enter the two new secrets:
   - `GOOGLE_CALENDAR_CLIENT_ID` — the new Web application Client ID
   - `GOOGLE_CALENDAR_CLIENT_SECRET` — the new Web application Client Secret

2. Once you save them, the existing Google Calendar OAuth flow (`/api/public/google/oauth/start` and `/api/public/google/oauth/callback`) will automatically pick up the new values — no code changes needed.

3. You can then test the "Connect Google Calendar" flow from the sitter dashboard. The redirect should succeed and store the user's tokens.

### Notes

- If any user previously connected with the old (Desktop) credentials, those stored tokens will no longer work and they'll need to reconnect — which is expected.
- No database migration or code edits are required for this step.