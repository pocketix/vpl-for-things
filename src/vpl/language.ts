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
  [id: string]:
    | UnitLanguageStatement
    | UnitLanguageStatementWithArgs
    | CompoundLanguageStatement
    | CompoundLanguageStatementWithArgs;
};

export type Variables = {
  [id: string]: Variable;
};

export type Variable = {
  type: VariableTypes;
  label: string;
};

export type VariableTypes = 'str' | 'num' | 'bool' | 'bool_expr' | 'num_expr';

export type UnitLanguageStatement = {
  type: 'unit' | 'unit_with_args' | 'compound' | 'compound_with_args';
  label: string;
  icon: string;
  foregroundColor?: string;
  backgroundColor?: string;
  deviceId?: string;
  deviceLabel?: string;
  predecessors?: string[];
  avoidPredecessors?: string[];
  successors?: string[];
  avoidSuccessors?: string[];
  parents?: string[];
  avoidParents?: string[];
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
