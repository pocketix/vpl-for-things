export const statementCustomEvent = {
  REMOVE: 'statement-remove',
  MOVE_UP: 'statement-move-up',
  MOVE_DOWN: 'statement-move-down',
} as const;

export const modalCustomEvent = {
  CLOSE: 'modal-close',
} as const;

export const textEditorCustomEvent = {
  PROGRAM_UPDATED: 'text-editor-program-updated',
} as const;

export const graphicalEditorCustomEvent = {
  PROGRAM_UPDATED: 'ge-program-updated',
} as const;

export const expressionListCustomEvent = {
  ADD_EXPR_ARG: 'el-add-expr-arg',
  SHOW_GROUP_BUTTONS: 'el-show-group-buttons',
  HIDE_GROUP_BUTTONS: 'el-hide-group-buttons',
  SELECTED_EXPRS_UPDATED: 'el-selected-exprs-updated',
} as const;

export const editorControlsCustomEvent = {
  EDITOR_VIEW_CHANGED: 'ec-view-changed',
} as const;

export const editorExpressionCustomEvent = {
  EXPRESSION_SELECTED: 'e-expression-selected',
  EXPRESSION_HIGHLIGHTED: 'e-expression-highlighted',
  EXPRESSION_ADD_TRIGGERED: 'e-expression-add-triggered',
} as const;

export const editorVariablesModalCustomEvent = {
  VARIABLE_SELECTED: 'e-variable-modal-var-selected',
} as const;
