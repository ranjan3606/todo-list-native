import React from 'react';
import { render } from '@testing-library/react-native';
import { PageLayout } from '../PageLayout';

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { background: '#fff', text: '#000' },
    dark: { background: '#000', text: '#fff' },
  }
}));

jest.mock('@/services/theme', () => ({
  useActualColorScheme: () => 'light',
}));

describe('PageLayout', () => {
  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(
      <PageLayout title="Test Title">
        <React.Fragment></React.Fragment>
      </PageLayout>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders without header', () => {
    const { toJSON } = render(
      <PageLayout showHeader={false}>
        <React.Fragment></React.Fragment>
      </PageLayout>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies custom style and titleStyle', () => {
    const { getByText } = render(
      <PageLayout title="Styled Title" style={{ backgroundColor: 'red' }} titleStyle={{ color: 'blue' }}>
        <></>
      </PageLayout>
    );
    expect(getByText('Styled Title')).toBeTruthy();
  });
});
