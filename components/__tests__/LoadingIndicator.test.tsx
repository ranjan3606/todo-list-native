import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingIndicator } from '../LoadingIndicator';

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { tint: '#007bff' },
    dark: { tint: '#00ffcc' },
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
}));

describe('LoadingIndicator', () => {
  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(<LoadingIndicator />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders with custom color and size', () => {
    const { toJSON } = render(<LoadingIndicator color="#ff0000" size={16} spacing={8} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders in fullScreen mode', () => {
    const { toJSON } = render(<LoadingIndicator fullScreen backgroundColor="#123456" />);
    expect(toJSON()).toMatchSnapshot();
  });
});
