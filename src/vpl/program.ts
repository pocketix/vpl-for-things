import { VariableTypes, ArgumentType, LanguageStatementType, Variable } from './language';

export class Program {
  header: Header;
  block: Block;

  constructor() {
    this.header = { userVariables: {} };
    this.block = [];
  }

  addUserVariable() {}
  removeUserVariable() {}

  addStatement(block: Block, statement: stmt) {
    let resultStatement = {};

    const initArgs = () => {
      for (let arg of statement.args) {
        resultStatement['args'].push({
          type: arg.type,
          value: null,
        });
      }
    };

    switch (statement.type) {
      case 'unit':
        resultStatement['id'] = statement.key;
        break;
      case 'unit_with_args':
        resultStatement['id'] = statement.key;
        resultStatement['args'] = [];
        initArgs();
        break;
      case 'compound':
        resultStatement['id'] = statement.key;
        resultStatement['block'] = [];
        break;
      case 'compound_with_args':
        resultStatement['id'] = statement.key;
        resultStatement['block'] = [];
        resultStatement['args'] = [];
        initArgs();
        break;
    }

    block.push(resultStatement);
  }
  removeStatement() {}
  modifyStatement() {}
  moveStatement() {}
}

type stmt = {
  type: LanguageStatementType;
  key: string;
  args?: ProgramStatementArgs[];
};

export type Block = ProgramStatement[];

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

export type CompoundStatement = AbstractStatement & {
  block: Block;
};

export type CompoundStatementWithArgs = AbstractStatement & CompoundStatement & AbstractStatementWithArgs;

export type ProgramStatementArgs = {
  type: ArgumentType;
  value: string | number | boolean | Expression | GroupedExpressions;
};

export type Expression = {
  opd1: string | number | boolean | Expression | Variable;
  opr: NumericOperators | CompareOperators;
  opd2?: string | number | boolean | Expression | Variable;
};

export type GroupedExpressions = {
  exprList: (GroupedExpressions | Expression)[];
  opr: BoolOperators;
};

export type CompareOperators = '<' | '>' | '<=' | '>=' | '===' | '!==' | '!';
export type BoolOperators = '&&' | '||';
export type NumericOperators = '+' | '-' | '*' | '/' | '%';
