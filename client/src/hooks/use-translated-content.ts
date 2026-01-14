/**
 * Custom Hook for Translated Content
 *
 * Provides utilities for working with translated content stored in Firestore.
 * Automatically falls back to English if translation is not available.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTranslation } from '@/lib/translation-service';
import type { Translation, SupportedLanguage } from '@shared/schema';
import type { TranslatableEntity } from '@/lib/translation-service';

/**
 * Hook to get translated content for an entity
 * @param entityType Type of entity (quiz, question, lecture, category, subcategory)
 * @param entityId ID of the entity
 * @param baseContent Base content in English
 * @param userId User ID (required for user-specific content)
 * @returns Translated content or fallback to baseContent
 */
export function useTranslatedContent<T extends Record<string, any>>(
  entityType: TranslatableEntity,
  entityId: string | undefined,
  baseContent: T,
  userId?: string
) {
  const { i18n } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState<T>(baseContent);
  const [isLoading, setIsLoading] = useState(false);
  const currentLanguage = i18n.language as SupportedLanguage;

  useEffect(() => {
    // If English or no entity ID, use base content
    if (currentLanguage === 'en' || !entityId) {
      setTranslatedContent(baseContent);
      return;
    }

    // Fetch translation
    const fetchTranslation = async () => {
      setIsLoading(true);
      try {
        const translation = await getTranslation(entityType, entityId, currentLanguage, userId);

        if (translation) {
          // Merge translation with base content
          setTranslatedContent({
            ...baseContent,
            ...translation,
          });
        } else {
          // Fallback to base content if no translation
          setTranslatedContent(baseContent);
        }
      } catch (error) {
        console.error('Error fetching translation:', error);
        setTranslatedContent(baseContent);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslation();
  }, [entityType, entityId, currentLanguage, baseContent, userId]);

  return {
    content: translatedContent,
    isLoading,
    isTranslated: currentLanguage !== 'en' && translatedContent !== baseContent,
    currentLanguage,
  };
}

/**
 * Hook to get a specific field from translated content
 * @param entityType Type of entity
 * @param entityId ID of the entity
 * @param field Field name to translate
 * @param defaultValue Default value if translation not available
 * @param userId User ID (required for user-specific content)
 * @returns Translated field value or default
 */
export function useTranslatedField(
  entityType: TranslatableEntity,
  entityId: string | undefined,
  field: keyof Translation,
  defaultValue: string,
  userId?: string
): string {
  const { i18n } = useTranslation();
  const [value, setValue] = useState<string>(defaultValue);
  const currentLanguage = i18n.language as SupportedLanguage;

  useEffect(() => {
    // If English or no entity ID, use default value
    if (currentLanguage === 'en' || !entityId) {
      setValue(defaultValue);
      return;
    }

    // Fetch translation
    const fetchTranslation = async () => {
      try {
        const translation = await getTranslation(entityType, entityId, currentLanguage, userId);

        if (translation && translation[field]) {
          setValue(translation[field] as string);
        } else {
          setValue(defaultValue);
        }
      } catch (error) {
        console.error('Error fetching translation field:', error);
        setValue(defaultValue);
      }
    };

    fetchTranslation();
  }, [entityType, entityId, field, currentLanguage, defaultValue, userId]);

  return value;
}
