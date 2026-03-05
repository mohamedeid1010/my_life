/**
 * ═══════════════════════════════════════════════════
 *  Preferences Types — Firestore: users/{uid}/preferences/main
 * ═══════════════════════════════════════════════════
 */

export type ThemeId = 'dark' | 'light' | 'midnight';
export type LanguageId = 'en' | 'ar';

/** Widget visibility entry in a page layout */
export interface LayoutWidget {
  id: string;
  visible: boolean;
}

/** Layout configuration per page */
export interface PageLayouts {
  overview: LayoutWidget[];
  gym: LayoutWidget[];
  habits: LayoutWidget[];
}

/** Full preferences document shape */
export interface UserPreferences {
  profile: {
    name: string;
    photoURL: string;
  };
  theme: ThemeId;
  language: LanguageId;
  layouts: PageLayouts;
}
