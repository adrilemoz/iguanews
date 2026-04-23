import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.iguatama.iguanews',
  appName: 'IguaNews',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Em produção, aponte para sua URL pública para o app carregar ao vivo.
    // Descomente a linha abaixo e coloque o domínio real:
    // url: 'https://iguanews.com.br',
    // cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'iguanews',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#FAFAF7',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
