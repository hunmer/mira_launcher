import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

// PrimeVue 主题配置
export const MiraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    surface: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },
  components: {
    button: {
      borderRadius: '0.5rem',
      paddingX: '1rem',
      paddingY: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    inputtext: {
      borderRadius: '0.5rem',
      paddingX: '0.75rem',
      paddingY: '0.5rem',
    },
    card: {
      borderRadius: '0.75rem',
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
    dialog: {
      borderRadius: '0.75rem',
      shadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    },
  },
})

// 暗色模式配置
export const MiraDarkPreset = definePreset(MiraPreset, {
  semantic: {
    primary: {
      50: '#172554',
      100: '#1e3a8a',
      200: '#1e40af',
      300: '#1d4ed8',
      400: '#2563eb',
      500: '#3b82f6',
      600: '#60a5fa',
      700: '#93c5fd',
      800: '#bfdbfe',
      900: '#dbeafe',
      950: '#eff6ff',
    },
  },
})
