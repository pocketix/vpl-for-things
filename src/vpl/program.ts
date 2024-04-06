import { VariableTypes, ArgumentType, LanguageStatementType, Variable } from './language';
import { v4 as uuidv4 } from 'uuid';

export class Program {
  header: Header;
  block: Block;

  constructor() {
    this.header = {
      userVariables: {
        myvar1: {
          type: 'bool',
          value: false,
        },
        myvar2: {
          type: 'bool_expr',
          value: [
            {
              // 1 < 2 && 3 < 4 && 5 < 6
              exprList: [
                { opd1: 1, opr: '<', opd2: 2 },
                { opd1: 2, opr: '<', opd2: 3 },
                { opd1: 3, opr: '<', opd2: 4 },
              ],
              opr: '&&',
            },
          ],
        },
        myvar3: {
          type: 'num',
          value: 342,
        },
        myvar4: {
          type: 'num_expr',
          value: '(1 + 2 + 3 * 5) / 6',
        },
        myvar5: {
          type: 'str',
          value: 'hello this is my string andaveryveryverylongoneword.',
        },
        myvar6: {
          type: 'str',
          value: 'hello this is my string andaveryveryverylongoneword.',
        },
        myvar7: {
          type: 'str',
          value: 'hello this is my string andaveryveryverylongoneword.',
        },
        myvar8: {
          type: 'str',
          value: 'hello this is my string andaveryveryverylongoneword.',
        },
        myvar9: {
          type: 'bool_expr',
          value: [
            {
              // 1 < 2 && 3 < 4 && 5 < 6
              exprList: [
                { opd1: 1, opr: '<', opd2: 2 },
                { opd1: 2, opr: '<', opd2: 3 },
                { opd1: 3, opr: '<', opd2: 4 },
              ],
              opr: '&&',
            },
          ],
        },
        myvar10: {
          type: 'bool_expr',
          value: [
            {
              // 1 < 2 && 3 < 4 && 5 < 6
              exprList: [
                { opd1: 1, opr: '<', opd2: 2 },
                { opd1: 2, opr: '<', opd2: 3 },
                { opd1: 3, opr: '<', opd2: 4 },
              ],
              opr: '&&',
            },
          ],
        },
        myvar11: {
          type: 'bool_expr',
          value: [
            {
              // 1 < 2 && 3 < 4 && 5 < 6
              exprList: [
                { opd1: 1, opr: '<', opd2: 2 },
                { opd1: 2, opr: '<', opd2: 3 },
                { opd1: 3, opr: '<', opd2: 4 },
              ],
              opr: '&&',
            },
          ],
        },
        myvar12: {
          type: 'bool_expr',
          value: [
            {
              // 1 < 2 && 3 < 4 && 5 < 6
              exprList: [
                { opd1: 1, opr: '<', opd2: 2 },
                { opd1: 2, opr: '<', opd2: 3 },
                { opd1: 3, opr: '<', opd2: 4 },
              ],
              opr: '&&',
            },
          ],
        },
      },
    };
    this.block = [];
  }

  loadProgramBody(block: Block) {
    const assignUUIDRecursive = (stmt: ProgramStatement) => {
      stmt['_uuid'] = uuidv4();
      if (stmt.args) {
        for (let arg of stmt.args) {
          if (arg.type === 'bool_expr') {
            for (let expr of arg.value) {
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

    console.log(JSON.stringify(block), block);
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
        return [{ exprList: [{ opd1: null, opr: '>', opd2: null }], opr: '??' }];
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
    let resultStatement = {};

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
              { exprList: [{ opd1: null, opr: '>', opd2: null }], opr: '??' },
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
    if (!expression.opd1) {
      return 'Enter expression';
    }
    if (!expression.opd2 && expression.opr !== '!') {
      return 'Enter expression';
    }
    if ('opd2' in expression) {
      return `(${expression.opd1} ${expression.opr} ${expression.opd2})`;
    } else {
      return expression.opd1.toString();
    }
  }

  parseGroupedExpressions(groupedExpressions: GroupedExpressions | Expression, topLevel: boolean = true): string {
    if (groupedExpressions.exprList) {
      const expressions = groupedExpressions.exprList.map((expr) => {
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
  args?: ProgramStatementArgument[];
};

export type Block = ProgramStatement[];

export type Header = {
  userVariables: {
    [id: string]: UserVariable;
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
  opd1: string | number | boolean | Expression | UserVariable;
  opr: NumericOperator | CompareOperator;
  opd2?: string | number | boolean | Expression | UserVariable;
};

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
