import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserPreferences {
  calendarView?: 'year' | 'month' | 'week';
  [key: string]: any;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // If not logged in, use localStorage as fallback
        const localPrefs = localStorage.getItem('userPreferences');
        if (localPrefs) {
          setPreferences(JSON.parse(localPrefs));
        }
        setLoading(false);
        return;
      }

      // Fetch preferences from database
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading preferences:', error);
        // Fall back to localStorage
        const localPrefs = localStorage.getItem('userPreferences');
        if (localPrefs) {
          setPreferences(JSON.parse(localPrefs));
        }
      } else if (data?.preferences) {
        setPreferences(data.preferences);
        // Sync to localStorage for offline access
        localStorage.setItem('userPreferences', JSON.stringify(data.preferences));
      } else {
        // If no preferences in DB, check localStorage and migrate
        const localPrefs = localStorage.getItem('userPreferences');
        if (localPrefs) {
          const parsed = JSON.parse(localPrefs);
          setPreferences(parsed);
          // Migrate to database
          await updatePreferences(parsed);
        }
      }
    } catch (err) {
      console.error('Error in loadPreferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    // Always save to localStorage for immediate access
    localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in, localStorage only
        return;
      }

      // Update database
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
      }
    } catch (err) {
      console.error('Error in updatePreferences:', err);
    }
  };

  const getPreference = <T,>(key: string, defaultValue: T): T => {
    return (preferences[key] as T) ?? defaultValue;
  };

  return {
    preferences,
    loading,
    updatePreferences,
    getPreference,
  };
}
