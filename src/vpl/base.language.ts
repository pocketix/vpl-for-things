import { Statements } from './language';

export const baseLanguageStatements: Statements = {
  // Internal
  _err: {
    type: 'unit',
    group: 'internal',
    label: 'Error!',
    icon: 'exclamationDiamond',
    foregroundColor: '#ffffff',
    backgroundColor: '#ef4444',
  },
  _heaterOn: {
    type: 'unit',
    group: 'internal',
    label: 'Heater.PowerOn',
    icon: 'power',
    foregroundColor: '#ffffff',
    backgroundColor: '#22c55e',
  },
  _heaterOff: {
    type: 'unit',
    group: 'internal',
    label: 'Heater.PowerOff',
    icon: 'power',
    foregroundColor: '#ffffff',
    backgroundColor: '#ef4444',
  },

  // Logic
  if: {
    type: 'compound_with_args',
    group: 'logic',
    label: 'If',
    icon: 'diagram2',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    arguments: [{ type: 'boolean_expression', label: 'Condition' }],
    description: {
      brief:
        'This statement allows the program to make decisions based on certain conditions. If a condition is true, the program executes statements inside it.',
      example: {
        description: 'If temperature is less than 19°C, turn on the heater.',
        block: [
          {
            id: 'if',
            block: [
              {
                id: '_heaterOn',
              },
            ],
            value: [
              {
                type: 'boolean_expression',
                value: [
                  {
                    value: [
                      {
                        type: 'variable',
                        value: 'TemperatureDevice-1.temperatureLevel',
                      },
                      {
                        type: 'number',
                        value: 19,
                      },
                    ],
                    type: '<',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  elseif: {
    type: 'compound_with_args',
    group: 'logic',
    label: 'Else If',
    icon: 'diagram2',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    arguments: [{ type: 'boolean_expression', label: 'Condition' }],
    predecessors: ['if'],
    description: {
      brief:
        'Sometimes, you might have multiple conditions to check. The "Else If" statement allows you to check for additional conditions if the first condition is not met.',
      example: {
        description:
          'If measured distance is less than or equal to 5cm, set LED to red color. If distance is between 5cm and 10cm, set LED to blue color. And finally if distance is more than 10cm set LED to green color.',
        block: [
          {
            id: 'if',
            block: [
              {
                id: 'LED-1.setLedColor',
                value: [
                  {
                    type: 'string',
                    value: 'red',
                  },
                ],
              },
            ],
            value: [
              {
                type: 'boolean_expression',
                value: [
                  {
                    value: [
                      {
                        type: 'variable',
                        value: 'DistanceSensor-1.distance',
                      },
                      {
                        type: 'number',
                        value: 5,
                      },
                    ],
                    type: '<=',
                  },
                ],
              },
            ],
          },
          {
            id: 'elseif',
            block: [
              {
                id: 'LED-1.setLedColor',
                value: [
                  {
                    type: 'string_options',
                    value: 'blue',
                  },
                ],
              },
            ],
            value: [
              {
                type: 'boolean_expression',
                value: [
                  {
                    value: [
                      {
                        value: [
                          {
                            type: 'variable',
                            value: 'DistanceSensor-1.distance',
                          },
                          {
                            type: 'number',
                            value: 5,
                          },
                        ],
                        type: '>',
                      },
                      {
                        value: [
                          {
                            type: 'variable',
                            value: 'DistanceSensor-1.distance',
                          },
                          {
                            type: 'number',
                            value: 10,
                          },
                        ],
                        type: '<',
                      },
                    ],
                    type: '&&',
                  },
                ],
              },
            ],
          },
          {
            id: 'else',
            block: [
              {
                id: 'LED-1.setLedColor',
                value: [
                  {
                    type: 'string_options',
                    value: 'green',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  else: {
    type: 'compound',
    group: 'logic',
    label: 'Else',
    icon: 'diagram2',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    predecessors: ['if', 'elseif'],
    description: {
      brief:
        'If the condition provided with the if statement is not true, the program executes statements inside the else block.',
      example: {
        description: 'If temperature is less than 19°C, turn the heater on. Otherwise turn the heater off.',
        block: [
          {
            id: 'if',
            block: [
              {
                id: '_heaterOn',
              },
            ],
            value: [
              {
                type: 'boolean_expression',
                value:  [
                  {
                    value: [
                      {
                        type: 'variable',
                        value: 'TemperatureDevice-1.temperatureLevel',
                      },
                      {
                        type: 'number',
                        value: 19,
                      },
                    ],
                    type: '<',
                  },
                ],
              },
            ],
          },
          {
            id: 'else',
            block: [
              {
                id: '_heaterOff',
              },
            ],
          },
        ],
      },
    },
  },
  switch: {
    type: 'compound_with_args',
    group: 'logic',
    label: 'Switch',
    icon: 'diagram3',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    nestedStatements: ['case'],
    arguments: [{ type: 'string' }],
    description: {
      brief:
        'This statement is useful when you have multiple states to check against a single variable. It provides a cleaner way to write multiple "Else If" statements.',
      example: {
        description: 'Change LED color based on the predefined levels of temperature.',
        block: [
          {
            id: 'switch',
            block: [
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    value: [
                      {
                        type: 'string_options',
                        value: 'red',
                      },
                    ],
                  },
                ],
                value: [
                  {
                    type: 'string',
                    value: 'high',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    value: [
                      {
                        type: 'string_options',
                        value: 'orange',
                      },
                    ],
                  },
                ],
                value: [
                  {
                    type: 'string',
                    value: 'ideal',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    value: [
                      {
                        type: 'string_options',
                        value: 'green',
                      },
                    ],
                  },
                ],
                value: [
                  {
                    type: 'string',
                    value: 'low',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    value: [
                      {
                        type: 'string_options',
                        value: 'blue',
                      },
                    ],
                  },
                ],
                value: [
                  {
                    type: 'string',
                    value: 'critical_low',
                  },
                ],
              },
            ],
            value: [
              {
                type: 'variable',
                value: 'TemperatureDevice-1.temperatureLevel',
              },
            ],
          },
        ],
      },
    },
  },
  case: {
    type: 'compound_with_args',
    group: 'logic',
    label: 'Case',
    icon: 'diagram3',
    foregroundColor: '#ffffff',
    backgroundColor: '#3b82f6',
    parents: ['switch'],
    arguments: [{ type: 'string' }],
    description: {
      brief:
        'Within a switch statement, each state is called a case. The program checks each case and executes the block of statements associated with the first matching case.',
      example: {
        description: '',
        block: [
          {
            id: 'switch',
            block: [
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    value: [
                      {
                        type: 'string_options',
                        value: 'red',
                      },
                    ],
                  },
                ],
                value: [
                  {
                    type: 'string',
                    value: 'high',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    value: [
                      {
                        type: 'string_options',
                        value: 'orange',
                      },
                    ],
                  },
                ],
                value: [
                  {
                    type: 'string',
                    value: 'ideal',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    value: [
                      {
                        type: 'string_options',
                        value: 'green',
                      },
                    ],
                  },
                ],
                value: [
                  {
                    type: 'string',
                    value: 'low',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    value: [
                      {
                        type: 'string_options',
                        value: 'blue',
                      },
                    ],
                  },
                ],
                value: [
                  {
                    type: 'string',
                    value: 'critical_low',
                  },
                ],
              },
            ],
            value: [
              {
                type: 'variable',
                value: 'TemperatureDevice-1.temperatureLevel',
              },
            ],
          },
        ],
      },
    },
  },

  // Loops
  repeat: {
    type: 'compound_with_args',
    group: 'loop',
    label: 'Repeat',
    icon: 'repeat1',
    foregroundColor: '#ffffff',
    backgroundColor: '#10b981',
    arguments: [{ type: 'number', label: 'Number of Repetitions' }],
    description: {
      brief: 'Repeat is used, when you want to execute statements multiple times.',
      example: {
        description: 'Make a buzzer emit sound three times.',
        block: [
          {
            id: 'repeat',
            block: [
              {
                id: 'Buzzer-1.beep',
              },
            ],
            value: [
              {
                type: 'number',
                value: 3,
              },
            ],
          },
        ],
      },
    },
  },
  while: {
    type: 'compound_with_args',
    group: 'loop',
    label: 'While',
    icon: 'repeatIcon',
    foregroundColor: '#ffffff',
    backgroundColor: '#10b981',
    arguments: [{ type: 'boolean_expression', label: 'Condition' }],
    description: {
      brief: 'A while loop repeatedly executes a block of code as long as a specified condition is true.',
      example: {
        description: 'While the light sensor detects darkness, keep the outdoor lights turned on.',
        block: [
          {
            id: 'while',
            block: [
              {
                id: 'OutDoorLight.state',
                value: [
                  {
                    type: 'string_options',
                    value: 'on',
                  },
                ],
              },
            ],
            value: [
              {
                type: 'boolean_expression',
                value: [
                  {
                    type: 'variable',
                    value: 'LightSensor.isDark',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // IoT Specific
  alert: {
    type: 'unit_with_args',
    group: 'iot',
    label: 'Send Notification',
    icon: 'bell',
    foregroundColor: '#ffffff',
    backgroundColor: '#8b5cf6',
    arguments: [
      {
        type: 'string_options',
        label: 'Notification Method',
        options: [
          { id: 'phone_number', label: 'Phone Number' },
          { id: 'email', label: 'Email' },
        ],
      },
      { type: 'string', label: 'Email or Phone Number' },
      { type: 'string', label: 'Notification Message' },
    ],
    description: {
      brief: 'Alert can be used for sending notifications to a specified email address or phone number.',
      example: {
        description: 'Send SMS notification on "+420123456789" when someone is in front of the door.',
        block: [
          {
            id: 'if',
            block: [
              {
                id: 'alert',
                value: [
                  {
                    type: 'string_options',
                    value: 'phone_number',
                  },
                  {
                    type: 'string',
                    value: '+420123456789',
                  },
                  {
                    type: 'string',
                    value: 'Movement detected!',
                  },
                ],
              },
            ],
            value: [
              {
                type: 'boolean_expression',
                value: [
                  {
                    value: [
                      {
                        type: 'variable',
                        value: 'Doorbell-1.motionSensor',
                      },
                      {
                        type: 'string',
                        value: 'active',
                      },
                    ],
                    type: '===',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // Variables
  setvar: {
    type: 'unit_with_args',
    group: 'variable',
    label: 'Set Variable',
    icon: 'bracesAsterisk',
    foregroundColor: '#ffffff',
    backgroundColor: '#d97706',
    arguments: [
      { type: 'variable', label: 'Variable' },
      { type: 'unknown', label: 'Value' },
    ],
    description: {
      brief: 'Using this statement, you can set values to your variables.',
    },
  },
};
