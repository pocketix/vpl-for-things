import { VariableTypes, ArgumentType, LanguageStatementType, Variable, Argument, Statements } from './language';
import { v4 as uuidv4 } from 'uuid';

export function parseOperandToString(operand: ExpressionOperand, negated: boolean = false) {
  let valueString =
    operand.type === 'bool_expr' ? parseExpressionToString(operand.value as Expression) : `${operand.value}`;
  return negated ? `NOT ${valueString}` : valueString;
}

export function parseExpressionToString(expression: Expression) {
  let operandsStrings: string[] = expression.opds.map((operand) => {
    if ((operand as Expression).opds) {
      return parseExpressionToString(operand as Expression);
    } else {
      return parseOperandToString(operand as ExpressionOperand, expression.opr === '!');
    }
  });

  if (expression.opr) {
    return `(${operandsStrings.join(
      ` ${convertOprToDisplayOpr(expression.opr as CompareOperator | BoolOperator | NumericOperator)} `
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
  for (let opd of expr.opds) {
    opd._uuid = uuidv4();
    if ((opd as Expression).opds) {
      assignUuidToExprOperands(opd as Expression);
    }
  }
}

export function assignUuidToBlock(block: Block) {
  for (let stmt of block) {
    stmt._uuid = uuidv4();
    if ((stmt as AbstractStatementWithArgs | CompoundStatementWithArgs).args) {
      for (let arg of (stmt as AbstractStatementWithArgs | CompoundStatementWithArgs).args) {
        if (arg.type === 'bool_expr') {
          assignUuidToExprOperands(arg.value as Expression);
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
      for (let opd of expr.opds) {
        delete opd._uuid;
        if ((opd as Expression).opds) {
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
        if ((stmt as AbstractStatementWithArgs).args) {
          for (let arg of (stmt as AbstractStatementWithArgs).args) {
            if (arg.type === 'bool_expr') {
              removeUuidFromExprOperands(arg.value as Expression);
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
  isInvalid?: boolean;
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
