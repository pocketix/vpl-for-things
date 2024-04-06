import { Device } from './language';

export const exampleDevices: Device[] = [
  {
    deviceName: 'LT222222-1',
    attributes: ['temperature1', 'relay1'],
    functions: [
      {
        type: 'unit_with_args',
        args: [
          {
            type: 'str_opt',
            options: [
              { id: 'open', label: 'Open' },
              { id: 'close', label: 'Close' },
            ],
          },
        ],
        label: 'setRelay1',
        icon: 'lightningChargeFill',
        group: 'iot',
      },
      {
        type: 'unit_with_args',
        args: [
          {
            type: 'str_opt',
            options: [
              { id: 'open', label: 'Open' },
              { id: 'close', label: 'Close' },
            ],
          },
        ],
        label: 'setRelay2',
        icon: 'lightningChargeFill',
        group: 'iot',
      },
    ],
  },
  {
    deviceName: 'PR333333-1',
    attributes: ['waterLevel1', 'waterPercentage2'],
    functions: [
      {
        type: 'unit',
        label: 'openValve',
        icon: 'lightningChargeFill',
        group: 'iot',
      },
    ],
  },
];
