import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
	baseURL: `${window.location.protocol}//${window.location.hostname}:3000`,
});
