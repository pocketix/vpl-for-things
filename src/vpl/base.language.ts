import { Statements } from './language';

export const baseLanguageStatements: Statements = {
  // Logic
  if: {
    type: 'compound_with_args',
    group: 'logic',
    label: 'If',
    icon: 'diagram2',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    args: [{ type: 'bool_expr', label: 'Condition' }],
  },
  elseif: {
    type: 'compound_with_args',
    group: 'logic',
    label: 'Else If',
    icon: 'diagram2',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    args: [{ type: 'bool_expr', label: 'Condition' }],
    predecessors: ['if'],
  },
  else: {
    type: 'compound',
    group: 'logic',
    label: 'Else',
    icon: 'diagram2',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    predecessors: ['if', 'elseif'],
  },
  switch: {
    type: 'compound_with_args',
    group: 'logic',
    label: 'Switch',
    icon: 'diagram3',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    nestedStatements: ['case'],
    args: [{ type: 'str' }],
  },
  case: {
    type: 'compound_with_args',
    group: 'logic',
    label: 'Case',
    icon: 'diagram3',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    args: [{ type: 'str' }],
  },

  // Loops
  repeat: {
    type: 'compound_with_args',
    group: 'loop',
    label: 'Repeat',
    icon: 'repeat1',
    foregroundColor: '#ffffff',
    backgroundColor: '#10b981',
    args: [{ type: 'num', label: 'Number of Repetitions' }],
  },
  while: {
    type: 'compound_with_args',
    group: 'loop',
    label: 'While',
    icon: 'repeat',
    foregroundColor: '#ffffff',
    backgroundColor: '#10b981',
    args: [{ type: 'bool_expr', label: 'Condition' }],
  },

  // IoT Specific
  alert: {
    type: 'unit_with_args',
    group: 'iot',
    label: 'Send Notification',
    icon: 'bell',
    foregroundColor: '#ffffff',
    backgroundColor: '#8b5cf6',
    args: [
      {
        type: 'str_opt',
        label: 'Notification Method',
        options: [
          { id: 'phone_number', label: 'Phone Number' },
          { id: 'email', label: 'Email' },
        ],
      },
      { type: 'str', label: 'Email or Phone Number' },
    ],
  },

  // Variables
  setvar: {
    type: 'unit_with_args',
    group: 'variable',
    label: 'Set Variable',
    icon: 'bracesAsterisk',
    foregroundColor: '#ffffff',
    backgroundColor: '#d97706',
    args: [
      { type: 'var', label: 'Variable' },
      { type: 'unknown', label: 'Value' },
    ],
  },

  teststmt: {
    type: 'compound_with_args',
    group: 'misc',
    label: 'Testing Statement',
    icon: 'lightningChargeFill',
    foregroundColor: '#ffffff',
    backgroundColor: '#078706',
    args: [
      { type: 'bool', label: 'IsTurnedOn' },
      { type: 'bool_expr', label: 'IdkU' },
      { type: 'bool_expr', label: 'aaaaaaaaa' },
      { type: 'num', label: 'asdsdfsdijbf' },
      { type: 'num_expr', label: 'sdfhsdf' },
      {
        type: 'num_opt',
        label: 'sdhibisd',
        options: [
          { id: 10, label: '10' },
          { id: 20, label: '20' },
        ],
      },
      { type: 'str', label: 'asdfij' },
      {
        type: 'str_opt',
        label: 'ojsijndf',
        options: [
          { id: 'str_opt1', label: 'Str Opt 1' },
          { id: 'str_opt2', label: 'Str Opt 2' },
        ],
      },
      { type: 'unknown' },
    ],
  },
};
