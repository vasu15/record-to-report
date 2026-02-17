// API Configuration
// In production (Netlify), this should point to your backend URL
// In development, it will proxy through Vite dev server
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper to construct full API URLs
export function getApiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
