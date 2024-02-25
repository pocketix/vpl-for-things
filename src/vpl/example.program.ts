import { ProgramStatement } from '@vpl/program';

export const exampleProgram: ProgramStatement[] = [
  {
    id: 'if',
    args: [{ type: 'bool_expr', value: 'Water Level-1.lvl_measurement_percent_full > 50' }],
    block: [
      {
        id: 'repeat',
        args: [{ type: 'bool_expr', value: "LT22222-1.Relay1 === 'open'" }],
        block: [
          {
            id: 'alert',
            args: [
              { type: 'str', value: '+420555666777' },
              { type: 'str', value: 'example@email.com' },
            ],
          },
        ],
      },
      {
        id: 'if',
      },
    ],
  },
  {
    id: 'else',
  },
  {
    id: 'repeat',
  },
  {
    id: 'alert',
  },
];
