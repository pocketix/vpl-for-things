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
    args: [{ type: 'bool_expr', label: 'Condition' }],
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
            args: [
              {
                type: 'bool_expr',
                value: {
                  opds: [
                    {
                      opds: [
                        {
                          type: 'var',
                          value: 'TemperatureDevice-1.temperatureLevel',
                        },
                        {
                          type: 'num',
                          value: 19,
                        },
                      ],
                      opr: '<',
                    },
                  ],
                },
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
    args: [{ type: 'bool_expr', label: 'Condition' }],
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
                args: [
                  {
                    type: 'str_opt',
                    value: 'red',
                  },
                ],
              },
            ],
            args: [
              {
                type: 'bool_expr',
                value: {
                  opds: [
                    {
                      opds: [
                        {
                          type: 'var',
                          value: 'DistanceSensor-1.distance',
                        },
                        {
                          type: 'num',
                          value: 5,
                        },
                      ],
                      opr: '<=',
                    },
                  ],
                },
              },
            ],
          },
          {
            id: 'elseif',
            block: [
              {
                id: 'LED-1.setLedColor',
                args: [
                  {
                    type: 'str_opt',
                    value: 'blue',
                  },
                ],
              },
            ],
            args: [
              {
                type: 'bool_expr',
                value: {
                  opds: [
                    {
                      opds: [
                        {
                          opds: [
                            {
                              type: 'var',
                              value: 'DistanceSensor-1.distance',
                            },
                            {
                              type: 'num',
                              value: 5,
                            },
                          ],
                          opr: '>',
                        },
                        {
                          opds: [
                            {
                              type: 'var',
                              value: 'DistanceSensor-1.distance',
                            },
                            {
                              type: 'num',
                              value: 10,
                            },
                          ],
                          opr: '<',
                        },
                      ],
                      opr: '&&',
                    },
                  ],
                },
              },
            ],
          },
          {
            id: 'else',
            block: [
              {
                id: 'LED-1.setLedColor',
                args: [
                  {
                    type: 'str_opt',
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
            args: [
              {
                type: 'bool_expr',
                value: {
                  opds: [
                    {
                      opds: [
                        {
                          type: 'var',
                          value: 'TemperatureDevice-1.temperatureLevel',
                        },
                        {
                          type: 'num',
                          value: 19,
                        },
                      ],
                      opr: '<',
                    },
                  ],
                },
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
    args: [{ type: 'str' }],
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
                    args: [
                      {
                        type: 'str_opt',
                        value: 'red',
                      },
                    ],
                  },
                ],
                args: [
                  {
                    type: 'str',
                    value: 'high',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    args: [
                      {
                        type: 'str_opt',
                        value: 'orange',
                      },
                    ],
                  },
                ],
                args: [
                  {
                    type: 'str',
                    value: 'ideal',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    args: [
                      {
                        type: 'str_opt',
                        value: 'green',
                      },
                    ],
                  },
                ],
                args: [
                  {
                    type: 'str',
                    value: 'low',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    args: [
                      {
                        type: 'str_opt',
                        value: 'blue',
                      },
                    ],
                  },
                ],
                args: [
                  {
                    type: 'str',
                    value: 'critical_low',
                  },
                ],
              },
            ],
            args: [
              {
                type: 'var',
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
    args: [{ type: 'str' }],
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
                    args: [
                      {
                        type: 'str_opt',
                        value: 'red',
                      },
                    ],
                  },
                ],
                args: [
                  {
                    type: 'str',
                    value: 'high',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    args: [
                      {
                        type: 'str_opt',
                        value: 'orange',
                      },
                    ],
                  },
                ],
                args: [
                  {
                    type: 'str',
                    value: 'ideal',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    args: [
                      {
                        type: 'str_opt',
                        value: 'green',
                      },
                    ],
                  },
                ],
                args: [
                  {
                    type: 'str',
                    value: 'low',
                  },
                ],
              },
              {
                id: 'case',
                block: [
                  {
                    id: 'LED-1.setLedColor',
                    args: [
                      {
                        type: 'str_opt',
                        value: 'blue',
                      },
                    ],
                  },
                ],
                args: [
                  {
                    type: 'str',
                    value: 'critical_low',
                  },
                ],
              },
            ],
            args: [
              {
                type: 'var',
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
    args: [{ type: 'num', label: 'Number of Repetitions' }],
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
            args: [
              {
                type: 'num',
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
    args: [{ type: 'bool_expr', label: 'Condition' }],
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
                args: [
                  {
                    type: 'str_opt',
                    value: 'on',
                  },
                ],
              },
            ],
            args: [
              {
                type: 'bool_expr',
                value: {
                  opds: [
                    {
                      type: 'var',
                      value: 'LightSensor.isDark',
                    },
                  ],
                },
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
      { type: 'str', label: 'Notification Message' },
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
                args: [
                  {
                    type: 'str_opt',
                    value: 'phone_number',
                  },
                  {
                    type: 'str',
                    value: '+420123456789',
                  },
                  {
                    type: 'str',
                    value: 'Movement detected!',
                  },
                ],
              },
            ],
            args: [
              {
                type: 'bool_expr',
                value: {
                  opds: [
                    {
                      opds: [
                        {
                          type: 'var',
                          value: 'Doorbell-1.motionSensor',
                        },
                        {
                          type: 'str',
                          value: 'active',
                        },
                      ],
                      opr: '===',
                    },
                  ],
                },
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
    args: [
      { type: 'var', label: 'Variable' },
      { type: 'unknown', label: 'Value' },
    ],
    description: {
      brief: 'Using this statement, you can set values to your variables.',
    },
  },
};
