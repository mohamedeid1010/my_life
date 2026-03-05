import { useContext } from 'react';
import { PreferencesContext } from '../contexts/PreferencesContext';

export default function usePreferences() {
  return useContext(PreferencesContext);
}
