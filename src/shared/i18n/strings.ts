export type Locale = 'en' | 'sw'

type Dict = Record<string, string>

/** Keys are added per screen as it is built. Kiswahili is completed in the release pass (session 11). */
export const strings: Record<Locale, Dict> = {
  en: {
    'auth.signIn': 'Sign in',
    'auth.welcomeBack': 'Welcome back',
    'auth.phone': 'Phone number',
    'auth.enterPin': 'Enter your PIN',
    'auth.forgotPin': 'Forgot PIN?',
    'auth.createWallet': 'Create your wallet',
    'auth.noWallet': 'New to WalletPesa?',
    'auth.haveWallet': 'Already have a wallet?',
    'auth.continue': 'Continue',
    'auth.verify': 'Verify',
    'auth.createPin': 'Create PIN',
    'auth.resetPin': 'Reset PIN',
    'common.back': 'Back',
    'common.retry': 'Try again',
    'common.loading': 'Loading…',
    'common.signOut': 'Sign out',
  },
  sw: {
    'auth.signIn': 'Ingia',
    'auth.welcomeBack': 'Karibu tena',
    'auth.phone': 'Namba ya simu',
    'auth.enterPin': 'Weka PIN yako',
    'auth.forgotPin': 'Umesahau PIN?',
    'auth.createWallet': 'Fungua pochi yako',
    'auth.noWallet': 'Mgeni WalletPesa?',
    'auth.haveWallet': 'Tayari una pochi?',
    'auth.continue': 'Endelea',
    'auth.verify': 'Thibitisha',
    'auth.createPin': 'Weka PIN',
    'auth.resetPin': 'Weka PIN mpya',
    'common.back': 'Rudi',
    'common.retry': 'Jaribu tena',
    'common.loading': 'Inapakia…',
    'common.signOut': 'Toka',
  },
}
