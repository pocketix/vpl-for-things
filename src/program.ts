import { VariableTypes, ArgumentTypes } from './language';

export class Program {
  header: Header;
  block: ProgramStatement[];

  addUserVariable() {}
  removeUserVariable() {}

  addStatement() {}
  removeStatement() {}
  modifyStatement() {}
  moveStatement() {}
}

export type Header = {
  userVariables: {
    [id: string]: UserVariable;
  };
};

export type UserVariable = {
  type: VariableTypes;
};

export type ProgramStatement =
  | AbstractStatement
  | AbstractStatementWithArgs
  | CompoundStatement
  | CompoundStatementWithArgs;

export type AbstractStatement = {
  id: string;
};

export type AbstractStatementWithArgs = AbstractStatement & {
  args: ProgramStatementArgs[];
};

export type ProgramStatementArgs = {
  type: ArgumentTypes;
  value: string | number | boolean;
};

export type CompoundStatement = AbstractStatement & {
  block: ProgramStatement[];
};

export type CompoundStatementWithArgs = AbstractStatement & CompoundStatement & AbstractStatementWithArgs;
