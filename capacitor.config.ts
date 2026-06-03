import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ke.campuslink.app',
  appName: 'CampusLink KE',
  webDir: 'out',
  server: {
    // Use live server URL during development
    // Comment out for production APK build
    url: 'https://www.campuslink.co.ke',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: 'campuslink.keystore',
      keystoreAlias: 'campuslink',
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f97316',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    Geolocation: {
      permissions: {
        location: 'ACCESS_FINE_LOCATION',
      },
    },
  },
}

export default config
