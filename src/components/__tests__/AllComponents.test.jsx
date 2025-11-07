// src/components/__tests__/AllComponents.test.jsx
import React from 'react';
import { renderWithRouter } from '@/test-utils';
import CategoryTreeItem from '../admin/CategoryTreeItem';
import RACDelayPage from '../RACDelayPage';
import QuestionFormLayout from '../admin/QuestionFormLayout';
import BillingStrip from '../dashboard/BillingStrip';

describe('smoke tests for components', () => {
  test('renders CategoryTreeItem without crashing', () => {
    const node = { _isFirst: false, _isLast: false, label: 'Root' };
    renderWithRouter(<CategoryTreeItem node={node} onEdit={() => {}} />);
  });

  test('renders RACDelayPage without crashing', () => {
    // useRAC is globally mocked in vitest.setup.js
    renderWithRouter(<RACDelayPage />);
  });

  test('renders QuestionFormLayout without crashing', () => {
    // if QuestionFormLayout expects props, add minimal ones here.
    renderWithRouter(<QuestionFormLayout />);
  });

  test('renders BillingStrip without crashing', () => {
    renderWithRouter(<BillingStrip />);
  });
});
