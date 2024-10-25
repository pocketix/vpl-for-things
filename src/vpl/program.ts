import { VariableTypes, ArgumentType, LanguageStatementType, Variable, Argument, Statements } from './language';
import { v4 as uuidv4 } from 'uuid';
import Types from '@vpl/types.ts';

export function parseOperandToString(operand: ExpressionOperand, negated: boolean = false) {
  let valueString =
    operand.type === Types.boolean_expression ? parseExpressionToString(operand.value as Expression) : `${operand.value}`;
  return negated ? `NOT ${valueString}` : valueString;
}

export function parseExpressionToString(expression: Expression) {
  let operandsStrings: string[] = (expression.value as ExpressionOperands).map((operand) => {
    if (Array.isArray((operand as Expression).value)) {
      return parseExpressionToString(operand as Expression);
    } else {
      return parseOperandToString(operand as ExpressionOperand, expression.type === '!');
    }
  });

  if (expression.type) {
    return `(${operandsStrings.join(
      ` ${convertOprToDisplayOpr(expression.type as CompareOperator | BoolOperator | NumericOperator)} `
    )})`;
  } else {
    return operandsStrings.join(' ');
  }
}

export function convertOprToDisplayOpr(opr: ExpressionOperator) {
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

export function initDefaultArgumentType(argumentType: ArgumentType) {
  switch (argumentType) {
    case Types.boolean:
      return true;
    case Types.boolean_expression:
      return [];
    case Types.number:
      return 0;
    case Types.string:
      return '';
    default:
      return null;
  }
}

export function analyzeBlock(block: Block, langStmts: Statements, parentStmt: ProgramStatement) {
  for (let i = 0; i < block.length; i++) {
    let previousPrgStmt: ProgramStatement;
    let nextPrgStmt: ProgramStatement;
    let currentPrgStmt = block[i];
    let currentLangStmt = langStmts[currentPrgStmt.id];

    if (currentLangStmt === undefined) {
      block.splice(i, 1);
      continue;
    }

    if ((currentPrgStmt as CompoundStatement).block) {
      analyzeBlock((currentPrgStmt as CompoundStatement).block, langStmts, currentPrgStmt);
    }

    if (currentPrgStmt.isInvalid) {
      delete currentPrgStmt.isInvalid;
    }

    if (i - 1 >= 0) {
      previousPrgStmt = block[i - 1];
    }
    if (i + 1 < block.length) {
      nextPrgStmt = block[i + 1];
    }

    if (currentLangStmt.predecessors) {
      if (!previousPrgStmt) {
        currentPrgStmt.isInvalid = true;
        continue;
      }
      if (!currentLangStmt.predecessors.includes(previousPrgStmt.id)) {
        currentPrgStmt.isInvalid = true;
        continue;
      }
    }

    if (currentLangStmt.successors) {
      if (!nextPrgStmt) {
        currentPrgStmt.isInvalid = true;
        continue;
      }
      if (!currentLangStmt.successors.includes(nextPrgStmt.id)) {
        currentPrgStmt.isInvalid = true;
        continue;
      }
    }

    if (currentLangStmt.parents) {
      if (parentStmt === null) {
        currentPrgStmt.isInvalid = true;
        continue;
      }
      if (!currentLangStmt.parents.includes(parentStmt.id)) {
        currentPrgStmt.isInvalid = true;
        continue;
      }
    }
  }
}

export function assignUuidToExprOperands(expr: Expression) {
  if (!Array.isArray(expr.value))
    return;

  for (let opd of expr.value) {
    opd._uuid = uuidv4();
    if ((opd as Expression).value) {
      assignUuidToExprOperands(opd as Expression);
    }
  }
}

export function assignUuidToBlock(block: Block) {
  for (let stmt of block) {
    stmt._uuid = uuidv4();
    if ((stmt as AbstractStatementWithArgs | CompoundStatementWithArgs).value) {
      for (let arg of (stmt as AbstractStatementWithArgs | CompoundStatementWithArgs).value) {
        if (arg.type === Types.boolean_expression) {
          assignUuidToExprOperands(arg.value as unknown as Expression);
        }
      }
    }

    if ((stmt as CompoundStatement).block) {
      assignUuidToBlock((stmt as CompoundStatement).block);
    }
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
    assignUuidToBlock(block);
    this.block = block;
  }

  loadProgram(programExport: any) {
    for (let proc of Object.keys(programExport.header.userProcedures)) {
      assignUuidToBlock(programExport.header.userProcedures[proc]);
    }
    assignUuidToBlock(programExport.block);

    this.header.userProcedures = programExport.header.userProcedures;
    this.header.userVariables = programExport.header.userVariables;
    this.block = programExport.block;
  }

  exportProgramBlock(block: Block) {
    let blockCopy = JSON.parse(JSON.stringify(block));

    function removeUuidFromExprOperands(expr: Expression) {
      if (!Array.isArray(expr.value))
        return;

      for (let opd of expr.value) {
        delete opd._uuid;
        if ((opd as Expression).value) {
          removeUuidFromExprOperands(opd as Expression);
        }
      }
    }

    function removeUuidFromBlock(block: Block) {
      for (let stmt of block) {
        delete stmt._uuid;
        if (stmt.isInvalid) {
          delete stmt.isInvalid;
        }
        if ((stmt as AbstractStatementWithArgs).value) {
          for (let arg of (stmt as AbstractStatementWithArgs).value) {
            if (arg.type === Types.boolean_expression) {
              removeUuidFromExprOperands(arg.value as unknown as Expression);
            }
          }
        }

        if ((stmt as CompoundStatement).block) {
          removeUuidFromBlock((stmt as CompoundStatement).block);
        }
      }
    }

    removeUuidFromBlock(blockCopy);
    return blockCopy;
  }

  exportProgram() {
    let programExport = {
      header: {
        userVariables: this.header.userVariables,
        userProcedures: {},
      },
      block: this.exportProgramBlock(this.block),
    };
    let proceduresCopy = JSON.parse(JSON.stringify(this.header.userProcedures));

    for (let proc of Object.keys(proceduresCopy)) {
      proceduresCopy[proc] = this.exportProgramBlock(proceduresCopy[proc]);
    }
    programExport.header.userProcedures = proceduresCopy;

    return programExport;
  }

  addStatement(block: Block, statement: stmt) {
    let resultStatement: any = {};

    function initArgs() {
      for (let arg of statement.value) {
        resultStatement.value.push({
          type: arg.type,
        });

        switch (arg.type) {
          case Types.boolean:
            resultStatement.value[resultStatement.value?.length - 1].value = true;
            break;
          case Types.boolean_expression:
            resultStatement.value[resultStatement.value.length - 1].value = [];
            break;
          case Types.number:
            resultStatement.value[resultStatement.value.length - 1].value = 0;
            break;
          case Types.string:
            resultStatement.value[resultStatement.value.length - 1].value = '';
            break;
          default:
            resultStatement.value[resultStatement.value.length - 1].value = null;
        }
      }
    }

    resultStatement['_uuid'] = uuidv4();
    resultStatement['id'] = statement.key;
    switch (statement.type) {
      case 'unit':
        break;
      case 'unit_with_args':
        resultStatement.value = [];
        initArgs();
        break;
      case 'compound':
        resultStatement['block'] = [];
        break;
      case 'compound_with_args':
        resultStatement['block'] = [];
        resultStatement.value = [];
        initArgs();
        break;
    }

    block.push(resultStatement);
  }
}

type stmt = {
  type: LanguageStatementType;
  key: string;
  value?: Argument[];
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

export const userVariableTypes = [
  Types.string,
  Types.number,
  Types.boolean,
  Types.boolean_expression
] as const;

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
  isInvalid?: boolean;
};

export type AbstractStatementWithArgs = AbstractStatement & {
  value: ProgramStatementArgument[];
};

export type CompoundStatement = AbstractStatement & {
  block: Block;
};

export type CompoundStatementWithArgs = AbstractStatement & CompoundStatement & AbstractStatementWithArgs;

export type ProgramStatementArgument = {
  type: ArgumentType | ExpressionOperator;
  value: string | number | boolean | ExpressionOperands;
};

export type Expression = ProgramStatementArgument & {
  _uuid?: string;
};

export type ExpressionOperands = (ExpressionOperand | Expression)[];

export type ExpressionOperator = CompareOperator | BoolOperator | NumericOperator;

export const isExpressionOperator = (possibleOperator: string) => {
  return possibleOperator in compareOperators || possibleOperator in boolOperators || possibleOperator in numericOperators;
}

export type ExpressionOperand = {
  type: ExpressionOperandType;
  value: string | number | boolean | Expression;
  _uuid?: string;
};

export const expressionOperandTypes = [
  Types.string,
  Types.number,
  Types.boolean,
  Types.boolean_expression,
  Types.variable,
  Types.unknown
] as const;

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
