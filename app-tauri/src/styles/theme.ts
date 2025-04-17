import { MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = {
  colorScheme: 'light',
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  components: {
    Button: {
      defaultProps: {
        size: 'md',
        radius: 'md',
      },
    },
  },
}; 