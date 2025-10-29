import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getAuthDatabaseSync } from '@/lib/mongodb';

// Dev-only diagnostic endpoint to inspect stored Google account for the current user.
// This is intentionally safe: it does NOT return raw tokens. It only returns presence/length and expiry info.
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getAuthDatabaseSync();
    const userId = session.user.id;

    // Try both possible id formats
  const query = { $or: [{ userId }, { userId: { $eq: userId } }] , providerId: 'google' };

    const account = await db.collection('accounts').findOne(query);

    if (!account) {
      return NextResponse.json({ found: false, message: 'No google account linked for this user' });
    }

    // Masked diagnostics
    const hasAccessToken = Boolean(account.access_token || account.accessToken);
    const hasRefreshToken = Boolean(account.refresh_token || account.refreshToken);
    const accessTokenLen = (account.access_token || account.accessToken || '').length;
    const refreshTokenLen = (account.refresh_token || account.refreshToken || '').length;
    const expiresAt = account.expires_at || account.expiresAt || null;

    // Log only in development console
    console.debug('Debug google-account for user:', userId, {
      hasAccessToken,
      hasRefreshToken,
      accessTokenLen,
      refreshTokenLen,
      expiresAt,
    });

    return NextResponse.json({
      found: true,
      provider: account.provider || account.providerId || 'google',
      hasAccessToken,
      hasRefreshToken,
      accessTokenLen,
      refreshTokenLen,
      expiresAt,
    });
  } catch (error) {
    console.error('Debug google-account error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
