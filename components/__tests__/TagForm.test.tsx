import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { TagForm } from '../TagForm';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve(null)),
}));

// Mock storage services
jest.mock('@/services/storage', () => ({
  getTags: jest.fn(() => Promise.resolve({})),
  saveTags: jest.fn(() => Promise.resolve())
}));

// Mock event emitter
jest.mock('@/services/eventEmitter', () => ({
  todoEvents: {
    emit: jest.fn()
  },
  TODO_EVENTS: {
    TAG_ADDED: 'tag_added',
    TAG_UPDATED: 'tag_updated'
  }
}));

jest.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => params ? `${key}:${JSON.stringify(params)}` : key
  })
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { background: '#fff', text: '#000', border: '#ccc', lightText: '#888', modalBackground: '#eee' },
    dark: { background: '#000', text: '#fff', border: '#888', lightText: '#ccc', modalBackground: '#222' },
    primary: '#007bff',
  }
}));

describe('TagForm', () => {
  const baseProps = {
    visible: true,
    colorScheme: 'light' as const,
    mode: 'add' as const,
    tagName: '',
    tagKeywords: '',
    onChangeTagName: jest.fn(),
    onChangeKeywords: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  it('renders correctly (snapshot)', () => {
    const { toJSON } = render(<TagForm {...baseProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('calls onCancel when cancel button is pressed', async () => {
    const onCancel = jest.fn();
    const { getByText } = render(<TagForm {...baseProps} onCancel={onCancel} />);
    
    await act(async () => {
      fireEvent.press(getByText('cancel'));
    });
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSave when save button is pressed', async () => {
    const onSave = jest.fn();
    const { getByText } = render(<TagForm {...baseProps} tagName="tag1" tagKeywords="kw1,kw2" onSave={onSave} />);
    
    await act(async () => {
      fireEvent.press(getByText('save'));
    });
    
    // The act() already waits for state updates, so we can simply check
    expect(onSave).toHaveBeenCalled();
  });

  it('renders in edit mode', () => {
    const { getByDisplayValue } = render(<TagForm {...baseProps} mode="edit" tagName="tag1" tagKeywords="kw1,kw2" />);
    expect(getByDisplayValue('tag1')).toBeTruthy();
    expect(getByDisplayValue('kw1,kw2')).toBeTruthy();
  });
});
