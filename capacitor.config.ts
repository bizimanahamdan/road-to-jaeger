import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the Android build.
 *
 * `webDir` points at the Next.js static export (`out/`), which is produced by
 * `npm run build`. Run `npm run cap:sync` (build + `cap sync android`) before
 * any Gradle build, otherwise the WebView will serve stale/missing assets.
 *
 * `androidScheme: 'https'` gives the app a secure origin inside the WebView so
 * that `window.indexedDB`, `navigator.serviceWorker` and the Notification API
 * behave exactly as they do when the PWA is installed from a browser.
 */
const config: CapacitorConfig = {
  appId: 'com.roadtojaeger.app',
  appName: 'Road to Jaeger',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  android: {
    // Fail loudly instead of silently falling back to a remote host.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    LocalNotifications: {
      // Keep notification styling consistent with the app's engineering look.
      smallIcon: 'ic_stat_jaeger',
      iconColor: '#F2A33C',
    },
  },
};

export default config;
