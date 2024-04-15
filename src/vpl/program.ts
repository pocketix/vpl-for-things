import { VariableTypes, ArgumentType, LanguageStatementType, Variable, Argument } from './language';
import { v4 as uuidv4 } from 'uuid';

export function initDefaultArgumentType(argumentType: ArgumentType) {
  switch (argumentType) {
    case 'bool':
      return true;
    case 'bool_expr':
      return {
        opds: [],
      };
    case 'num':
      return 0;
    case 'str':
      return '';
    default:
      return null;
  }
}

export class Program {
  header: Header;
  block: Block;

  constructor() {
    this.header = {
      userVariables: {},
      userProcedures: {},
    };
    this.block = [];
  }

  loadProgramBody(block: Block) {
    function assignUuidToExprOperands(expr: Expression) {
      for (let opd of expr.opds) {
        opd._uuid = uuidv4();
        if ((opd as Expression).opds) {
          assignUuidToExprOperands(opd as Expression);
        }
      }
    }

    function assignUuidToBlock(block) {
      for (let stmt of block) {
        stmt._uuid = uuidv4();
        if (stmt.args) {
          for (let arg of stmt.args) {
            if (arg.type === 'bool_expr') {
              assignUuidToExprOperands(arg.value);
            }
          }
        }

        if (stmt.block) {
          assignUuidToBlock(stmt.block);
        }
      }
    }

    assignUuidToBlock(block);
    this.block = block;
  }

  exportProgramBody() {
    let blockCopy = JSON.parse(JSON.stringify(this.block));

    function removeUuidFromExprOperands(expr: Expression) {
      for (let opd of expr.opds) {
        delete opd._uuid;
        if ((opd as Expression).opds) {
          removeUuidFromExprOperands(opd as Expression);
        }
      }
    }

    function removeUuidFromBlock(block) {
      for (let stmt of block) {
        delete stmt._uuid;
        if (stmt.args) {
          for (let arg of stmt.args) {
            if (arg.type === 'bool_expr') {
              removeUuidFromExprOperands(arg.value);
            }
          }
        }

        if (stmt.block) {
          removeUuidFromBlock(stmt.block);
        }
      }
    }

    removeUuidFromBlock(blockCopy);
    return blockCopy;
  }

  addStatement(block: Block, statement: stmt) {
    let resultStatement: any = {};

    function initArgs() {
      for (let arg of statement.args) {
        resultStatement['args'].push({
          type: arg.type,
        });

        switch (arg.type) {
          case 'bool':
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = true;
            break;
          case 'bool_expr':
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = {
              opds: [],
            };
            break;
          case 'num':
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = 0;
            break;
          case 'str':
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = '';
            break;
          default:
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = null;
        }
      }
    }

    resultStatement['_uuid'] = uuidv4();
    resultStatement['id'] = statement.key;
    switch (statement.type) {
      case 'unit':
        break;
      case 'unit_with_args':
        resultStatement['args'] = [];
        initArgs();
        break;
      case 'compound':
        resultStatement['block'] = [];
        break;
      case 'compound_with_args':
        resultStatement['block'] = [];
        resultStatement['args'] = [];
        initArgs();
        break;
    }

    block.push(resultStatement);
  }

  operatorIsUnary(opr: CompareOperator | NumericOperator | BoolOperator) {
    switch (opr) {
      case '!':
        return true;
      default:
        return false;
    }
  }

  convertOprToDisplayOpr(opr: ExpressionOperator) {
    switch (opr) {
      case '&&':
        return 'AND';
      case '||':
        return 'OR';
      case '!':
        return 'NOT';
      default:
        return opr;
    }
  }
}

type stmt = {
  type: LanguageStatementType;
  key: string;
  args?: Argument[];
};

export type Block = ProgramStatement[];

export type Header = {
  userVariables: {
    [id: string]: UserVariable;
  };
  userProcedures: {
    [id: string]: Block;
  };
};

export type UserVariable = {
  type: UserVariableType;
  value: UserVariableValue;
};

export type UserVariableValue = string | number | boolean | Expression;

export const userVariableTypes = ['str', 'num', 'bool', 'bool_expr'] as const;
type UserVariableTypesTuple = typeof userVariableTypes;
export type UserVariableType = UserVariableTypesTuple[number];

export type ProgramStatement =
  | AbstractStatement
  | AbstractStatementWithArgs
  | CompoundStatement
  | CompoundStatementWithArgs;

export type AbstractStatement = {
  _uuid?: string;
  id: string;
};

export type AbstractStatementWithArgs = AbstractStatement & {
  args: ProgramStatementArgument[];
};

export type CompoundStatement = AbstractStatement & {
  block: Block;
};

export type CompoundStatementWithArgs = AbstractStatement & CompoundStatement & AbstractStatementWithArgs;

export type ProgramStatementArgument = {
  type: ArgumentType;
  value: string | number | boolean | Expression;
};

export type Expression = {
  opds: ExpressionOperands;
  opr?: ExpressionOperator;
  _uuid?: string;
};

export type ExpressionOperands = (ExpressionOperand | Expression)[];

export type ExpressionOperator = CompareOperator | BoolOperator | NumericOperator;

export type ExpressionOperand = {
  type: ExpressionOperandType;
  value: string | number | boolean | Expression;
  _uuid?: string;
};

export const expressionOperandTypes = ['str', 'num', 'bool', 'bool_expr', 'var', 'unknown'] as const;
type ExpressionOperandTypesTuple = typeof expressionOperandTypes;
export type ExpressionOperandType = ExpressionOperandTypesTuple[number];

export const compareOperators = ['<', '>', '<=', '>=', '===', '!=='] as const;
type CompareOperatorsTuple = typeof compareOperators;
export type CompareOperator = CompareOperatorsTuple[number];

export const boolOperators = ['&&', '||', '!'] as const;
type BoolOperatorsTuple = typeof boolOperators;
export type BoolOperator = BoolOperatorsTuple[number];

export const numericOperators = ['+', '-', '*', '/', '%'] as const;
type NumericOperatorsTuple = typeof numericOperators;
export type NumericOperator = NumericOperatorsTuple[number];
