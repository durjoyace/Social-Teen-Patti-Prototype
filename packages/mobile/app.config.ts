import type { ConfigContext, ExpoConfig } from 'expo/config';

const LOCAL_API_URL = 'http://localhost:3001/api';
const LOCAL_SOCKET_URL = 'http://localhost:3001';

function releaseUrl(name: string, value: string | undefined, fallback: string, isRelease: boolean) {
  if (isRelease && !value) throw new Error(`${name} must be configured for preview and production builds`);
  const resolved = value || fallback;
  if (isRelease) {
    const parsed = new URL(resolved);
    if (parsed.protocol !== 'https:') throw new Error(`${name} must use HTTPS for preview and production builds`);
  }
  return resolved.replace(/\/$/, '');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE || process.env.APP_ENV || 'development';
  const isRelease = profile === 'preview' || profile === 'production';
  const apiUrl = releaseUrl('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL, LOCAL_API_URL, isRelease);
  const socketUrl = releaseUrl('EXPO_PUBLIC_SOCKET_URL', process.env.EXPO_PUBLIC_SOCKET_URL, LOCAL_SOCKET_URL, isRelease);

  if (isRelease && !new URL(apiUrl).pathname.endsWith('/api')) {
    throw new Error('EXPO_PUBLIC_API_URL must include the /api path');
  }

  return {
    ...config,
    name: config.name || 'Social Teen Patti',
    slug: config.slug || 'social-teen-patti',
    extra: {
      ...config.extra,
      appEnv: profile,
      apiUrl,
      socketUrl,
      appUrl: process.env.EXPO_PUBLIC_APP_URL || 'https://social-teen-patti.vercel.app',
    },
  };
};
