/**
 * Tests for i18n (internationalization) functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

describe('i18n Configuration', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage('en');
  });

  it('should initialize with English as default language', () => {
    expect(i18n.language).toBe('en');
  });

  it('should support English and Spanish languages', () => {
    const supportedCodes = SUPPORTED_LANGUAGES.map((lang) => lang.code);
    expect(supportedCodes).toContain('en');
    expect(supportedCodes).toContain('es');
    expect(supportedCodes.length).toBe(2);
  });

  it('should change language to Spanish', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');
  });

  it('should fallback to English for missing translations', () => {
    // i18n is configured to fallback to 'en'
    expect(i18n.options.fallbackLng).toEqual(['en']);
  });

  it('should translate common UI strings', () => {
    // Test English translations
    expect(i18n.t('common.save')).toBe('Save');
    expect(i18n.t('common.cancel')).toBe('Cancel');
    expect(i18n.t('common.loading')).toBe('Loading...');
  });

  it('should translate navigation labels', () => {
    expect(i18n.t('nav.dashboard')).toBe('Dashboard');
    expect(i18n.t('nav.quiz')).toBe('Quiz');
    expect(i18n.t('nav.achievements')).toBe('Achievements');
  });

  it('should translate to Spanish correctly', async () => {
    await i18n.changeLanguage('es');

    expect(i18n.t('common.save')).toBe('Guardar');
    expect(i18n.t('common.cancel')).toBe('Cancelar');
    expect(i18n.t('common.loading')).toBe('Cargando...');
  });

  it('should translate navigation labels to Spanish', async () => {
    await i18n.changeLanguage('es');

    expect(i18n.t('nav.dashboard')).toBe('Panel');
    expect(i18n.t('nav.quiz')).toBe('Cuestionario');
    expect(i18n.t('nav.achievements')).toBe('Logros');
  });

  it('should handle quiz builder translations', () => {
    expect(i18n.t('quizBuilder.title')).toBe('Quiz Builder');
    expect(i18n.t('quizBuilder.createNew')).toBe('Create New Quiz');
    expect(i18n.t('quizBuilder.saveQuiz')).toBe('Save Quiz');
  });

  it('should handle quiz builder translations in Spanish', async () => {
    await i18n.changeLanguage('es');

    expect(i18n.t('quizBuilder.title')).toBe('Constructor de Cuestionarios');
    expect(i18n.t('quizBuilder.createNew')).toBe('Crear Nuevo Cuestionario');
    expect(i18n.t('quizBuilder.saveQuiz')).toBe('Guardar Cuestionario');
  });

  it('should handle validation messages', () => {
    expect(i18n.t('validation.required')).toBe('This field is required');
    expect(i18n.t('validation.email')).toBe('Please enter a valid email address');
  });

  it('should handle validation messages in Spanish', async () => {
    await i18n.changeLanguage('es');

    expect(i18n.t('validation.required')).toBe('Este campo es obligatorio');
    expect(i18n.t('validation.email')).toBe(
      'Por favor, ingresa una dirección de correo electrónico válida'
    );
  });

  it('should handle interpolation', () => {
    const minLength = i18n.t('validation.minLength', { min: 5 });
    expect(minLength).toBe('Must be at least 5 characters');
  });

  it('should handle interpolation in Spanish', async () => {
    await i18n.changeLanguage('es');

    const minLength = i18n.t('validation.minLength', { min: 5 });
    expect(minLength).toBe('Debe tener al menos 5 caracteres');
  });

  it('should return key if translation is missing', () => {
    const missingKey = i18n.t('nonexistent.key');
    expect(missingKey).toBe('nonexistent.key');
  });
});
