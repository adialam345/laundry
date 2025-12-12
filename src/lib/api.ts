export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getApiUrl = (path: string) => {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // Remove trailing slash from base if present
    const cleanBase = API_BASE_URL.replace(/\/$/, '');
    return `${cleanBase}${cleanPath}`;
};
