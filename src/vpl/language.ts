import { baseLanguageStatements } from './base.language';

export class Language {
  variables: Variables;
  statements: Statements;
  deviceList: string[];

  constructor(devices?: Device[]) {
    this.variables = {}; // TODO Dynamically add device variables.
    this.statements = baseLanguageStatements; // TODO Add basic language statements and dynamic device statements.
    this.deviceList = [];

    if (devices) {
      for (let device of devices) {
        // Convert device attributes to language variables.
        for (let attr of device.attributes) {
          this.variables[`${device.deviceName}.${attr}`] = { type: 'device', label: `${device.deviceName}.${attr}` };
        }

        // Convert device functions to language statements.
        for (let func of device.functions) {
          this.statements[`${device.deviceName}.${func.label}`] = {
            ...func,
            deviceName: device.deviceName,
            label: `${device.deviceName}.${func.label}`,
          };
        }

        this.deviceList.push(device.deviceName);
      }
    }
  }

  addStatement() {}
  removeStatement() {}

  addVariable() {}
  removeVariable() {}
}

export type Statements = {
  [id: string]: Statement;
};

export type Statement =
  | UnitLanguageStatement
  | UnitLanguageStatementWithArgs
  | CompoundLanguageStatement
  | CompoundLanguageStatementWithArgs
  | DeviceStatement;

export type Variables = {
  [id: string]: Variable;
};

export type Variable = {
  type: VariableTypes;
  label: string;
};

export type VariableTypes = 'str' | 'num' | 'bool' | 'bool_expr' | 'num_expr' | 'device';

export type LanguageStatementType = 'unit' | 'unit_with_args' | 'compound' | 'compound_with_args';

export type LanguageStatementGroup = 'logic' | 'loop' | 'iot' | 'variable' | 'misc';

export type Icon = keyof typeof import('@/editor/icons');

export type UnitLanguageStatement = {
  type: LanguageStatementType;
  group: LanguageStatementGroup;
  label: string;
  icon: Icon;
  foregroundColor?: string;
  backgroundColor?: string;
  predecessors?: string[];
  avoidPredecessors?: string[];
  parents?: string[];
  avoidParents?: string[];
  isUserProcedure?: boolean;
};

export type UnitLanguageStatementWithArgs = UnitLanguageStatement & {
  args: Argument[];
};

export type CompoundLanguageStatement = UnitLanguageStatement & {
  nestedStatements?: string[];
  avoidNestedStatements?: string[];
};

export type CompoundLanguageStatementWithArgs = UnitLanguageStatementWithArgs & CompoundLanguageStatement;

export type Argument = {
  type: ArgumentType;
  label?: string;
  options?: ArgumentOptions[];
};

export type ArgumentType =
  | 'str'
  | 'num'
  | 'bool'
  | 'bool_expr'
  | 'num_expr'
  | 'str_opt'
  | 'num_opt'
  | 'var'
  | 'unknown';

export type ArgumentOptions = {
  id: string | number;
  label: string;
};

export type Device = {
  deviceName: string;
  attributes: string[];
  functions: (UnitLanguageStatement | UnitLanguageStatementWithArgs)[];
};

export type DeviceStatement = (UnitLanguageStatement | UnitLanguageStatementWithArgs) & {
  deviceName: string;
};
