import { VariableTypes, ArgumentType, LanguageStatementType, Variable, Argument } from './language';
import { v4 as uuidv4 } from 'uuid';

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
    const assignUUIDRecursive = (stmt: ProgramStatement) => {
      stmt['_uuid'] = uuidv4();
      if ((stmt as AbstractStatementWithArgs | CompoundStatementWithArgs).args) {
        for (let arg of (stmt as AbstractStatementWithArgs | CompoundStatementWithArgs).args) {
          if (arg.type === 'bool_expr') {
            for (let expr of arg.value as Expression[] | GroupedExpressions[]) {
              assignUUIDRecursiveExpression(expr);
            }
          }
        }
      }
      if ('block' in stmt) {
        for (let s of stmt.block) {
          assignUUIDRecursive(s);
        }
      }
    };

    const assignUUIDRecursiveExpression = (expr: Expression | GroupedExpressions) => {
      expr['_uuid'] = uuidv4();
      if ('exprList' in expr) {
        for (let e of expr.exprList) {
          assignUUIDRecursiveExpression(e);
        }
      }
    };

    for (let stmt of block) {
      assignUUIDRecursive(stmt);
    }

    this.block = block;
  }
  exportProgramBody() {}

  addUserVariable() {}
  removeUserVariable() {}

  initDefaultArgumentType(argumentType: ArgumentType) {
    switch (argumentType) {
      case 'bool':
        return true;
      case 'bool_expr':
        return [
          {
            exprList: [{ opd1: { type: 'unknown', value: null }, opr: '>', opd2: { type: 'unknown', value: null } }],
            opr: '??',
          },
        ];
      case 'num':
        return 0;
      case 'num_expr':
        break;
      case 'str':
        return '';
      default:
        return null;
    }
  }

  addStatement(block: Block, statement: stmt) {
    let resultStatement: any = {};

    const initArgs = () => {
      for (let arg of statement.args) {
        resultStatement['args'].push({
          type: arg.type,
        });

        switch (arg.type) {
          case 'bool':
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = true;
            break;
          case 'bool_expr':
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = [
              {
                exprList: [
                  { opd1: { type: 'unknown', value: null }, opr: '>', opd2: { type: 'unknown', value: null } },
                ],
                opr: '??',
              },
            ];
            break;
          case 'num':
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = 0;
            break;
          case 'num_expr':
            break;
          case 'str':
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = '';
            break;
          default:
            resultStatement['args'][resultStatement['args'].length - 1]['value'] = null;
        }
      }
    };

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
  removeStatement() {}
  modifyStatement() {}
  moveStatement() {}

  parseExpression(expression: Expression): string {
    if (expression.opd1) {
      if (expression.opd1.value === null) {
        return 'Enter expression';
      }
    }
    if (expression.opd2.value === null && expression.opr !== '!') {
      return 'Enter expression';
    }
    if ('opd2' in expression) {
      if (expression.opd1) {
        return `(${expression.opd1.value} ${expression.opr} ${expression.opd2.value})`;
      } else {
        return `(${expression.opr}${expression.opd2.value})`;
      }
    } else {
      return expression.opd1.value.toString();
    }
  }

  parseGroupedExpressions(groupedExpressions: GroupedExpressions | Expression, topLevel: boolean = true): string {
    if ((groupedExpressions as GroupedExpressions).exprList) {
      const expressions = (groupedExpressions as GroupedExpressions).exprList.map((expr) => {
        if ('exprList' in expr) {
          return this.parseGroupedExpressions(expr, false);
        } else {
          return this.parseExpression(expr);
        }
      });

      const result = `(${expressions.join(` ${groupedExpressions.opr} `)})`;
      return topLevel ? result.slice(1, -1) : result;
    } else {
      return this.parseExpression(groupedExpressions as Expression);
    }
  }

  operatorIsUnary(opr: CompareOperator | NumericOperator) {
    switch (opr) {
      case '!':
        return true;
      default:
        return false;
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

export type UserVariableValue = string | number | boolean | Expression[] | GroupedExpressions[];

export const userVariableTypes = ['str', 'num', 'bool', 'bool_expr', 'num_expr'] as const;
type UserVariableTypesTuple = typeof userVariableTypes;
export type UserVariableType = UserVariableTypesTuple[number];

export type ProgramStatement =
  | AbstractStatement
  | AbstractStatementWithArgs
  | CompoundStatement
  | CompoundStatementWithArgs;

export type AbstractStatement = {
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
  value: string | number | boolean | Expression[] | GroupedExpressions[];
};

export type Expression = {
  opd1: ExpressionOperand;
  opr: NumericOperator | CompareOperator;
  opd2?: ExpressionOperand;
};

export type ExpressionOperand = {
  type: ExpressionOperandType;
  value: string | number | boolean | Expression;
};

export const expressionOperandTypes = ['str', 'num', 'bool', 'expr', 'var', 'unknown'] as const;
type ExpressionOperandTypesTuple = typeof expressionOperandTypes;
export type ExpressionOperandType = ExpressionOperandTypesTuple[number];

export type GroupedExpressions = {
  exprList: (GroupedExpressions | Expression)[];
  opr: BoolOperator;
};

export const compareOperators = ['<', '>', '<=', '>=', '===', '!==', '!'] as const;
type CompareOperatorsTuple = typeof compareOperators;
export type CompareOperator = CompareOperatorsTuple[number];

export const boolOperators = ['&&', '||'] as const;
type BoolOperatorsTuple = typeof boolOperators;
export type BoolOperator = BoolOperatorsTuple[number];

export const numericOperators = ['+', '-', '*', '/', '%'] as const;
type NumericOperatorsTuple = typeof numericOperators;
export type NumericOperator = NumericOperatorsTuple[number];
