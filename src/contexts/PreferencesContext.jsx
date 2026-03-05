import React, { createContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../stores/useAuthStore';
import { DEFAULT_LAYOUTS } from '../config/layoutConfig';

export const PreferencesContext = createContext({});

export function PreferencesProvider({ children }) {
  const user = useAuthStore((s) => s.user);
  
  const [profile, setProfile] = useState({ name: '', photoURL: '' });
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences from Firestore
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    const loadPrefs = async () => {
      try {
        if (!db) {
          console.warn('Firestore (db) not initialized. Skipping preference load.');
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'users', user.uid, 'preferences', 'main');
        
        // Try getting from cache first or handling the offline error gracefully
        let d;
        try {
          d = await getDoc(docRef);
        } catch (fetchErr) {
          if (fetchErr.code === 'unavailable' || fetchErr.message?.includes('offline')) {
            console.warn('Firebase is offline. Using local defaults/cache if available.');
            // Firestore might handle this automatically with persistence, but we catch to prevent crash
            setLoading(false);
            return;
          }
          throw fetchErr;
        }

        if (d && d.exists() && isMounted) {
          const data = d.data();
          if (data.profile) setProfile(data.profile);
          if (data.theme) setTheme(data.theme);
          if (data.language) setLanguage(data.language);
          if (data.layouts) {
            const mergedLayouts = { ...DEFAULT_LAYOUTS };
            Object.keys(DEFAULT_LAYOUTS).forEach(page => {
              if (data.layouts[page] && Array.isArray(data.layouts[page])) {
                const savedIds = data.layouts[page].map(w => w.id);
                const pageLayout = [...data.layouts[page]];
                DEFAULT_LAYOUTS[page].forEach(defW => {
                  if (!savedIds.includes(defW.id)) {
                    pageLayout.push(defW);
                  }
                });
                mergedLayouts[page] = pageLayout;
              }
            });
            setLayouts(mergedLayouts);
          }
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadPrefs();
    
    return () => { isMounted = false; };
  }, [user]);

  // Save to Firestore
  const savePrefsToDB = async (updates) => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'preferences', 'main');
      await setDoc(docRef, updates, { merge: true });
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (newProfile) => {
    setProfile(newProfile);
    savePrefsToDB({ profile: newProfile });
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    savePrefsToDB({ theme: newTheme });
  };

  const updateLanguage = (newLang) => {
    setLanguage(newLang);
    savePrefsToDB({ language: newLang });
  };

  const updateLayout = (page, newLayout) => {
    const newLayouts = { ...layouts, [page]: newLayout };
    setLayouts(newLayouts);
    savePrefsToDB({ layouts: newLayouts });
  };

  const value = {
    profile, updateProfile,
    theme, updateTheme,
    language, updateLanguage,
    layouts, updateLayout,
    loading, saving
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
