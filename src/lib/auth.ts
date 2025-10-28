import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getAuthDatabaseSync } from "@/lib/mongodb";

// Types for OAuth callback
type GoogleProfile = {
    id: string;
    email: string;
    name?: string;
    picture?: string;
};

type GoogleTokens = {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    provider: string;
};

// Validate required environment variables
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('Missing required environment variable: BETTER_AUTH_SECRET');
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
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/gmail.readonly',
            ],
        },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    // Add session callback to include access token
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 24 hours
    },
    callbacks: {
        // This callback runs after social sign in
        socialProfile: async (profile: GoogleProfile, tokens: GoogleTokens) => {
            if (tokens.provider === "google") {
                return {
                    ...profile,
                    accessToken: tokens.access_token, // Store the access token
                };
            }
            return profile;
        },
    },
});