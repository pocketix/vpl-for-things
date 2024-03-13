import { Block } from '@vpl/program';

export const exampleProgram: Block = [
  {
    id: 'if',
    args: [
      {
        type: 'bool_expr',
        value: {
          opd1: {
            type: 'device',
            label: 'Water Level-1.lvl_measurement_precent_full',
          },
          opr: '>',
          opd2: 50,
        },
      },
    ],
    block: [
      {
        id: 'if',
        args: [
          {
            type: 'bool_expr',
            value: {
              opd1: {
                type: 'device',
                label: 'LT22222.Relay1',
              },
              opr: '===',
              opd2: 'open',
            },
          },
        ],
        block: [
          {
            id: 'LT222221.setRelay1',
            args: [{ type: 'str', value: 'close' }],
          },
        ],
      },
    ],
  },
  {
    id: 'else',
    block: [
      {
        id: 'if',
        args: [
          {
            type: 'bool_expr',
            value: {
              opd1: {
                type: 'device',
                label: 'LT22222.Relay1',
              },
              opr: '===',
              opd2: 'close',
            },
          },
        ],
        block: [
          {
            id: 'LT222221.setRelay1',
            args: [{ type: 'str', value: 'open' }],
          },
        ],
      },
    ],
  },
];

export const exampleExprProgram: Block = [
  {
    id: 'if',
    block: [],
    args: [
      {
        type: 'bool_expr',
        value: {
          // 1 < 2 && 3 < 4 && 5 < 6
          exprList: [
            { opd1: 1, opr: '<', opd2: 2 },
            { opd1: 2, opr: '<', opd2: 3 },
            { opd1: 3, opr: '<', opd2: 4 },
          ],
          opr: '&&',
        },
      },
    ],
  },
  {
    id: 'if',
    block: [],
    args: [
      {
        type: 'bool_expr',
        value: {
          // (1 < 2 && 3 < 4) || 5 < 6
          exprList: [
            {
              exprList: [
                { opd1: 1, opr: '<', opd2: 2 },
                { opd1: 2, opr: '<', opd2: 3 },
              ],
              opr: '&&',
            },
            {
              opd1: 5,
              opr: '<',
              opd2: 6,
            },
          ],
          opr: '||',
        },
      },
    ],
  },
];

export const exampleNumExprProgram: Block = [
  {
    id: 'if',
    block: [],
    args: [
      {
        type: 'num_expr',
        value: {
          // (abc < 32) >= (5 > 3)
          opd1: {
            opd1: 'abc',
            opr: '<',
            opd2: 32,
          },
          opr: '>=',
          opd2: {
            opd1: 5,
            opr: '>',
            opd2: 3,
          },
        },
      },
    ],
  },
];
