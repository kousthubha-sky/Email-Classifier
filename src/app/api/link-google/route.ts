import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getAuthDatabaseSync } from "@/lib/mongodb";

// Validate required environment variables
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('Missing required environment variable: BETTER_AUTH_SECRET');
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error('Missing required GitHub OAuth environment variables: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing required Google OAuth environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
}

export const auth = betterAuth({
    database: mongodbAdapter(getAuthDatabaseSync()),
    emailAndPassword: {
        enabled: true, 
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Add access_type to get refresh token
            accessType: "offline",
            // Add prompt to force account selection
            prompt: "consent",
            scope: [
                'openid',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/gmail.readonly',
            ],
        },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    // Add base URL for proper redirects
    baseURL: process.env.NODE_ENV === "production" 
        ? process.env.NEXT_PUBLIC_AUTH_URL 
        : "http://localhost:3000",
});