// Secret configuration - do not commit to repository.
export const AppConfig = {
  // Google OAuth 2.0 Web Client ID
  GOOGLE_CLIENT_ID: "514841972147-ssti9ojv7ieg93s1m08in33loa7052gu.apps.googleusercontent.com", // Fill this in when provided

  // Local development helper:
  // when true, auth is bypassed only on localhost/127.0.0.1.
  LOCAL_DEV_AUTH_BYPASS: true,
  LOCAL_DEV_USER_EMAIL: "local.dev@moas.cashbook",

  // Backend endpoint that verifies Google ID tokens
  AUTH_VERIFY_ENDPOINT: "/api/auth/google/verify",
  
  // Optional local list for reference only.
  // Real access control is enforced by server-side AUTHORIZED_EMAILS.
  AUTHORIZED_EMAILS: ["grangudio@gmail.com"],
  
  // Secret salt for PIN hashing (if desired)
  PIN_SALT: "MOAS_CASHBOOK_2026"
};
