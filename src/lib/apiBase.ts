// The one place the dashboard gets the API address. Set VITE_API_URL to override it
// (for example .env.production during an outage); otherwise the brand domain is used.
export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace('/graphql', '') || 'https://api.uishealth.com';
