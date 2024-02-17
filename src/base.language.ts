import { Statements } from './language';

export const baseLanguageStatements: Statements = {
  if: {
    type: 'compound_with_args',
    label: 'If',
    icon: '',
    foregroundColor: '',
    backgroundColor: '',
    allowNesting: true,
    args: [{ type: 'bool_expr' }],
  },
  else: {
    type: 'compound',
    label: 'Else',
    icon: '',
    foregroundColor: '',
    backgroundColor: '',
    allowNesting: true,
    predecessors: ['if'],
  },
  repeat: {
    type: 'compound_with_args',
    label: 'Repeat',
    icon: '',
    foregroundColor: '',
    backgroundColor: '',
    allowNesting: true,
    args: [{ type: 'num' }],
  },
  alert: {
    type: 'abstract_with_args',
    label: 'Send Notification',
    icon: '',
    foregroundColor: '',
    backgroundColor: '',
    allowNesting: false,
    args: [
      {
        type: 'str_opt',
        options: [
          { id: 'phone_number', label: 'Phone Number' },
          { id: 'email', label: 'Email' },
        ],
      },
      { type: 'str' },
    ],
  },
  setvar: {
    type: 'abstract_with_args',
    label: 'Set Variable',
    icon: '',
    foregroundColor: '',
    backgroundColor: '',
    allowNesting: false,
    args: [{ type: 'var' }, { type: 'unknown' }],
  },
};
