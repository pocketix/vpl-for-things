import { VariableTypes, ArgumentType, LanguageStatementType, Variable, Argument, Statements } from './language';
import { v4 as uuidv4 } from 'uuid';
import Types from '@vpl/types.ts';
import { TemplateResult, html } from 'lit';
import { playCircle, remoteControlLine, variableIcon } from '@/editor/icons';

export function parseOperandToString(operand: ExpressionOperand, negated: boolean = false, level: number = 0) {
  let valueString =
    operand.type === Types.boolean_expression ? parseExpressionToString(operand.value as Expression, level) : `${operand.value}`;
  return negated ? `NOT ${valueString}` : valueString;
}

export function parseExpressionToString(expression: Expression, level: number = -1) {
  const exp = Array.isArray(expression.value) ? expression.value : [expression.value];
  let operandsStrings: string[] = exp.map((operand) => {
    if (Array.isArray((operand as Expression).value)) {
      return parseExpressionToString(operand as Expression, level+1);
    } else {
      return parseOperandToString(operand as ExpressionOperand, expression.type === '!', level);
    }
  });

  if (expression.type) {
    const delimiter = (expression.type === Types.boolean_expression || level <= 0) ? ["", ""]: ["(", ")"];
    return `${delimiter[0]}${operandsStrings.join(
      ` ${convertOprToDisplayOpr(expression.type as CompareOperator | BoolOperator | NumericOperator)} `
    )}${delimiter[1]}`;
  } else {
    return operandsStrings.join(' ');
  }
}

const valueIconsMap = {
  "device": remoteControlLine,
  "variable": variableIcon,
}

export function parseOperandToHtml(operand: ExpressionOperand, negated: boolean = false, level: number = 0) {
  const isDevice = operand.value?.toString().startsWith("$") && operand.type === "variable";
  const icon = valueIconsMap[isDevice ? "device" : operand.type];
  let valueString =
    operand.type === Types.boolean_expression ? parseExpressionToHtml(operand.value as Expression, level) : `${operand.value}`;
  valueString = (isDevice && !!(valueString as any).slice) ? (valueString as any).slice(1) : valueString;
  return negated
    ? html`<span class="operator not">NOT</span> ${valueString}`
    : html`
      <span class="value ${valueString} ${operand.type} ${isDevice ? 'device':''}">
        <span class="icon">${icon}</span>
        ${isDevice 
          ? (valueString as any)
            .split(".")
            .map(s => html`<span>${s}</span>`)
            .reduce((a, c) => [...a, c, "."], [])
            .slice(0, -1)
          : valueString
        }
      </span>
    `;
}

export function parseExpressionToHtml(expression: Expression, level: number = -1) {
  const exp = Array.isArray(expression.value) ? expression.value : [expression.value];
  let operandsStrings: TemplateResult<1>[] = exp.flatMap((operand) => {
    if (Array.isArray((operand as Expression).value)) {
      return parseExpressionToHtml(operand as Expression, level+1);
    } else {
      return [parseOperandToHtml(operand as ExpressionOperand, expression.type === '!', level)];
    }
  });

  if (expression.type) {
    const delimiter = (expression.type === Types.boolean_expression || level <= 0) ? ["", ""]: ["(", ")"];
    return html`<span class="delimiter ${delimiter[0]}">${delimiter[0]}</span>${
      operandsStrings.reduce((acc, curr) =>
        [...acc, html`${curr}`, html`<span class="operator ${expression.type}">${convertOprToDisplayOpr(expression.type as CompareOperator | BoolOperator | NumericOperator)}</span>`], []
      ).slice(0, -1)}<span class="delimiter ${delimiter[1]}">${delimiter[1]}</span>`;
  } else {
    return operandsStrings;
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
    case "===":
      return "==";
    case "!==":
      return "!=";
    case Types.boolean_expression:
      // return "Expression";
      return null;
    default:
      return opr;
  }
}

export function initDefaultArgumentType(argumentType: ArgumentType) {
  switch (argumentType) {
    case Types.boolean:
      return true;
    case Types.boolean_expression:
      return [] as Expression[];
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
  if (!Array.isArray(expr.value)) {
    return;
  }
  for (let opd of expr.value) {
    opd._uuid = uuidv4();
    if (Array.isArray((opd as Expression).value)) {
      assignUuidToExprOperands(opd as Expression);
    }
  }
}

export function assignUuidToBlock(block: Block) {
  for (let stmt of block) {
    stmt._uuid = uuidv4();
    if ((stmt as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments) {
      for (let arg of (stmt as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments) {
        if (isExpressionArray(arg)) {
          (arg.value as Expression[]).forEach(item => assignUuidToExprOperands(item));
        }
      }
    }

    if ((stmt as CompoundStatement).block) {
      assignUuidToBlock((stmt as CompoundStatement).block);
    }
  }
}

type ProgramExport = {
  header: Header;
  block: Block;
}

export class Program {
  header: Header;
  block: Block;

  constructor(program: ProgramExport|null = null) {
    this.header = {
      userVariables: {},
      userProcedures: {},
    };
    this.block = [];

    if (program !== null) {
      this.loadProgram(program);
    }
  }

  loadProgramBody(block: Block) {
    assignUuidToBlock(block);
    this.block = block;
  }

  loadProgram(programExport: ProgramExport) {
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
      delete expr._uuid;

      if (!expr.value || !Array.isArray(expr.value)) {
        return;
      }

      for (let opd of expr.value) {
        delete opd._uuid;
        if (Array.isArray((opd as Expression).value)) {
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
        if ((stmt as AbstractStatementWithArgs).arguments) {
          for (let arg of (stmt as AbstractStatementWithArgs).arguments) {
            if (arg.type === Types.boolean_expression) {
              if (isExpressionArray(arg)) {
                (arg.value as Expression[]).forEach(item => removeUuidFromExprOperands(item));
              }
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
      for (let arg of statement.arguments) {
        resultStatement['arguments'].push({
          type: arg.type,
          value: initDefaultArgumentType(arg.type)
        });
      }
    }

    resultStatement['_uuid'] = uuidv4();
    resultStatement['id'] = statement.key;
    switch (statement.type) {
      case 'unit':
        break;
      case 'unit_with_args':
        resultStatement['arguments'] = [];
        initArgs();
        break;
      case 'compound':
        resultStatement['block'] = [];
        break;
      case 'compound_with_args':
        resultStatement['block'] = [];
        resultStatement['arguments'] = [];
        initArgs();
        break;
    }

    block.push(resultStatement);
  }
}

type stmt = {
  type: LanguageStatementType;
  key: string;
  arguments?: Argument[];
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

export const userVariableTypes = [Types.string, Types.number, Types.boolean, Types.boolean_expression] as const;
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
  arguments: ProgramStatementArgument[];
};

export type CompoundStatement = AbstractStatement & {
  block: Block;
};

export type CompoundStatementWithArgs = AbstractStatement & CompoundStatement & AbstractStatementWithArgs;

export type ProgramStatementArgument = {
  type: ArgumentType;
  value: string | number | boolean | Expression[];
};

export type Expression = {
  value: Expression[] | Literal;
  type?: ExpressionOperator;
  _uuid?: string;
};

export type Literal = string | number | boolean;

export type ExpressionOperands = (ExpressionOperand | Expression)[];

export type ExpressionOperator = CompareOperator | BoolOperator | NumericOperator | ExpressionOperandType;

export type ExpressionOperand = {
  type: ExpressionOperandType;
  value: string | number | boolean | Expression;
  _uuid?: string;
};

export const expressionOperandTypes = [Types.string, Types.number, Types.boolean, Types.boolean_expression, Types.variable, Types.unknown] as const;
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

export const isExpressionOperator = (operator: string) => {
  return compareOperators.includes(operator as CompareOperator) || boolOperators.includes(operator as BoolOperator) || numericOperators.includes(operator as NumericOperator);
}

export const isExpressionArray = (argument: ProgramStatementArgument) => Array.isArray(argument.value);
