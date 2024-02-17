import { baseLanguageStatements } from './base.language';

export class Language {
  variables: Variables;
  statements: Statements;

  constructor() {
    this.variables = {}; // TODO Dynamically add device variables.
    this.statements = baseLanguageStatements; // TODO Add basic language statements and dynamic device statements.
  }

  addStatement() {}
  removeStatement() {}

  addVariable() {}
  removeVariable() {}
}

export type Statements = {
  [id: string]: LanguageStatement | DeviceStatement;
};

export type Variables = {
  [id: string]: Variable;
};

export interface Variable {
  type: VariableTypes;
  label: string;
}

export type VariableTypes = 'str' | 'num' | 'bool' | 'bool_expr' | 'num_expr';

export type LanguageStatement = {
  type: 'abstract' | 'abstract_with_args' | 'compound' | 'compound_with_args';
  label: string;
  icon: string;
  allowNesting: boolean; // Allow nesting of other statements inside this statement.
  backgroundColor?: string;
  foregroundColor?: string;
  predecessors?: string[];
  avoidPredecessors?: string[];
  successors?: string[];
  avoidSuccessors?: string[];
  parents?: string[];
  avoidParents?: string[];
  nestedStatements?: string[]; // Statements that can be nested inside this statement.
  avoidNestedStatements?: string[]; // Statements that can not be nested inside this statement.
  args?: Argument[];
};

export type DeviceStatement = LanguageStatement & {
  deviceId: string;
  deviceLabel: string;
};

export type Argument = {
  type: ArgumentTypes;
  options?: ArgumentOptions[];
};

export type ArgumentTypes =
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
