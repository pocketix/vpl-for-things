import {
  EditorExpressionOperand,
  EditorModal,
  Expression,
  ExpressionOperand,
  ExpressionOperands,
  Program,
  boolOperators,
  compareOperators,
  convertOprToDisplayOpr,
  numericOperators,
} from '@/index';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { editorExpressionOperandCustomEvent, graphicalEditorCustomEvent } from '../editor-custom-events';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { arrowDown, arrowUp, check2square, plusLg, stack, trash, xLg } from '../icons';
import { v4 as uuidv4 } from 'uuid';
import { repeat } from 'lit/directives/repeat.js';
import { consume } from '@lit/context';
import { programContext } from '../context/editor-context';
import { globalStyles } from '../global-styles';
import Types from '@vpl/types.ts';

@customElement('editor-expression-operand-list')
export class EditorExpressionOperandList extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        width: 100%;
      }

      .nested {
        margin-left: 0;
      }

      .indent-line {
        width: 10px;
        min-width: 10px;
        height: 1px;
        background: var(--gray-400);
      }

      .expr-indent-line {
        margin-top: 13px;
      }

      .opd-wrapper {
        display: flex;
        align-items: center;
        align-items: center;
        gap: 4px;
      }

      .nested-expr-wrapper {
        display: flex;
        align-items: flex-start;
        box-sizing: border-box;
        padding-top: 8px;
      }

      .expr-opd-list-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .expr-controls-wrapper {
        position: absolute;
        bottom: 0;
        left: 0;
        background: white;
        z-index: 500;
        width: 100%;
        padding-top: 12px;
        padding-bottom: 12px;
      }

      .expr-controls-inner-wrapper {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-left: 12px;
        margin-right: 12px;
      }

      .expr-control-button::part(btn) {
        justify-content: center;
        gap: 2px;
      }

      .remove-button::part(btn) {
        color: var(--red-600);
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      .group-button::part(btn) {
        color: var(--green-600);
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      .expr-group-controls {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 4px;
      }

      .expr-group-actions {
        display: flex;
        width: 100%;
      }

      .go-back-button::part(btn) {
        justify-content: center;
        gap: 4px;
      }

      .selected-count {
        position: absolute;
        right: 4px;
        top: 0;
        border-radius: 40px;
        border: 1px solid var(--gray-400);
        background: white;
        padding-left: 4px;
        padding-right: 4px;
      }

      .no-opd-message {
        padding-top: 40px;
        color: var(--gray-400);
        width: min-content;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      .opr-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .select-opr-modal-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .opr-list-item::part(btn) {
        justify-content: center;
        font-family: var(--mono-font);
      }

      .move-opd-button {
        padding-top: 4px;
        padding-bottom: 4px;
        padding-left: 2px;
        padding-right: 2px;
        cursor: pointer;
        border: 1px solid var(--gray-300);
        background: white;
        border-radius: 8px;
      }
    `,
  ];

  @property() parentExpr: Expression;
  @property() operands: ExpressionOperands;
  @property() nestedLevel: number;
  @property() exprIsSelected: boolean;
  @property() highlightedExpr: HTMLElement;
  @property() opdModalVisibleOnRender: boolean = false;
  @property() groupModeIsActive: boolean = false;
  @property() selectedExpressions: (Expression | ExpressionOperand)[] = [];
  @property() selectedOprType: string = Types.boolean;
  @property() isExample: boolean = false;

  @consume({ context: programContext })
  @property()
  program?: Program;

  exprOpdRef: Ref<EditorExpressionOperand> = createRef();
  selectOprModalRef: Ref<EditorModal> = createRef();

  constructor() {
    super();

    this.addEventListener(editorExpressionOperandCustomEvent.CANCEL_ADD_OPD, (e: CustomEvent) => {
      this.handleCancelAddOpd();
      e.stopPropagation();
    });
  }

  handleAddNewOpd() {
    if (this.parentExpr.type === '!' && this.operands.length > 0) {
      return;
    }
    this.operands.push({ type: Types.unknown, value: null, _uuid: uuidv4() });
    this.opdModalVisibleOnRender = true;

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleCancelAddOpd() {
    this.operands.pop();

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleEnterGroupMode() {
    this.groupModeIsActive = true;
  }

  handleExitGroupMode() {
    this.groupModeIsActive = false;
    this.selectedExpressions = [];
  }

  handleSelectExpr(e: Event, i: number, selectedExpr: Expression | ExpressionOperand) {
    if (this.selectedExpressions.some((expr) => expr['_uuid'] === selectedExpr['_uuid'])) {
      this.selectedExpressions.splice(
        this.selectedExpressions.findIndex((expr) => expr['_uuid'] === selectedExpr['_uuid']),
        1
      );
    } else {
      this.selectedExpressions.push(selectedExpr);
    }

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleDeleteSelectedExpressions() {
    for (let i = this.operands.length - 1; i >= 0; i--) {
      const opd = this.operands[i];
      if (this.selectedExpressions.some((ex) => ex['_uuid'] === opd['_uuid'])) {
        this.operands.splice(i, 1);
      }
    }

    this.handleExitGroupMode();

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleGroupExpressions(groupOpr) {
    if (this.selectedExpressions.length < 1) {
      return;
    }
    if (this.selectedExpressions.length > 1 && groupOpr === '!') {
      return;
    }

    let newGroup = {
      value: [...this.selectedExpressions],
      type: groupOpr,
      _uuid: uuidv4(),
    } as Expression;

    for (let i = this.operands.length - 1; i >= 0; i--) {
      const opd = this.operands[i];
      if (this.selectedExpressions.some((ex) => ex['_uuid'] === opd['_uuid'])) {
        this.operands.splice(i, 1);
      }
    }

    this.operands.unshift(newGroup);

    this.handleExitGroupMode();

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleShowSelectOprModal() {
    this.selectOprModalRef.value.showModal();
  }

  handleSelectOprType(e: Event) {
    this.selectedOprType = (e.currentTarget as HTMLSelectElement).value;
  }

  handleMoveOpdUp(opdIndex: number) {
    if (opdIndex > 0) {
      let tmpOpd = this.operands[opdIndex];
      this.operands[opdIndex] = this.operands[opdIndex - 1];
      this.operands[opdIndex - 1] = tmpOpd;
      this.requestUpdate();
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { programBodyUpdated: true },
      });
      this.dispatchEvent(event);
    }
  }

  handleMoveOpdDown(opdIndex: number) {
    if (opdIndex < this.operands.length - 1) {
      let tmpOpd = this.operands[opdIndex];
      this.operands[opdIndex] = this.operands[opdIndex + 1];
      this.operands[opdIndex + 1] = tmpOpd;
      this.requestUpdate();
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { programBodyUpdated: true },
      });
      this.dispatchEvent(event);
    }
  }

  operatorListTemplate(oprType) {
    let operatorList;

    switch (oprType) {
      case Types.boolean:
        operatorList = boolOperators;
        break;
      case 'compare':
        operatorList = compareOperators;
        break;
      case 'numeric':
        operatorList = numericOperators;
        break;
    }

    return html`${operatorList.map(
      (opr) =>
        html`
          <editor-button @click="${() => this.handleGroupExpressions(opr)}" class="opr-list-item"
            >${convertOprToDisplayOpr(opr)}
          </editor-button>
        `
    )}`;
  }

  render() {
    return html`
      <div class="expr-opd-list-wrapper">
        ${this.operands.length < 1
          ? html`
              <div class="no-opd-message" style="${this.nestedLevel > 0 ? 'padding-top: 10px;' : ''}">
                <div>Click on "+ Add Operand"</div>
                <div>to add new operand</div>
              </div>
            `
          : html`
              ${repeat(
                this.operands,
                (opd) => opd['_uuid'],
                (operand, i) =>
                  html`
                    <div class="${(operand as Expression).value ? 'nested-expr-wrapper' : 'opd-wrapper'}">
                      ${this.nestedLevel > 0
                        ? html`
                            <div
                              class="${(operand as Expression).value
                                ? 'expr-indent-line indent-line'
                                : 'indent-line'}"></div>
                          `
                        : nothing}
                      ${Array.isArray((operand as Expression).value)
                        ? html`
                            <editor-expression
                              .expression="${operand}"
                              .nestedLevel="${this.nestedLevel + 1}"
                              .highlightedExpr="${this.highlightedExpr}"
                              .exprIsSelected="${this.exprIsSelected}"
                              .groupModeIsActive="${this.groupModeIsActive}"
                              .isExample="${this.isExample}"
                              class="${this.nestedLevel > 0 ? 'nested' : ''}">
                            </editor-expression>
                          `
                        : html`
                            <editor-expression-operand
                              ${ref(this.exprOpdRef)}
                              .operand="${operand}"
                              .isExample="${this.isExample}"
                              .visibleOnRender="${this.opdModalVisibleOnRender}">
                            </editor-expression-operand>
                          `}
                      ${!(operand as Expression).value &&
                      !this.groupModeIsActive &&
                      (this.exprIsSelected || this.nestedLevel === 0) &&
                      !this.isExample
                        ? html`
                            <div class="move-opd-button" @click="${() => this.handleMoveOpdUp(i)}">
                              <editor-icon .icon="${arrowUp}"></editor-icon>
                            </div>
                            <div class="move-opd-button" @click="${() => this.handleMoveOpdDown(i)}">
                              <editor-icon .icon="${arrowDown}"></editor-icon>
                            </div>
                          `
                        : nothing}
                      ${this.groupModeIsActive && (this.exprIsSelected || this.nestedLevel === 0)
                        ? html`
                            <input
                              type="checkbox"
                              name=""
                              id=""
                              style="${`position: sticky; top: ${
                                (operand as Expression).value ? this.nestedLevel * 37 + 9 : this.nestedLevel * 37
                              }px; z-index: ${200 - (this.nestedLevel + 4)};`} ${(operand as Expression).value
                                ? 'margin-top: 9px; margin-left: 6px; margin-right: 6px;'
                                : ''}"
                              @change="${(e) => this.handleSelectExpr(e, i, operand)}" />
                          `
                        : nothing}
                    </div>
                  `
              )}
            `}
        ${this.exprIsSelected || (this.nestedLevel === 0 && !this.highlightedExpr)
          ? html`
              <div class="expr-controls-wrapper">
                <div class="expr-controls-inner-wrapper">
                  ${this.groupModeIsActive
                    ? html`
                        <div class="expr-group-controls">
                          <div class="expr-group-actions">
                            <editor-button
                              style="width: 100%;"
                              class="expr-control-button remove-button"
                              @click="${this.handleDeleteSelectedExpressions}">
                              <editor-icon .icon="${trash}"></editor-icon>
                              <span>Remove</span>
                            </editor-button>
                            <editor-button
                              style="width: 100%;"
                              class="expr-control-button group-button"
                              @click="${this.handleShowSelectOprModal}">
                              <editor-icon .icon="${stack}"></editor-icon>
                              <span>Group</span>
                            </editor-button>
                            <div class="selected-count">${this.selectedExpressions.length}</div>
                            <editor-modal ${ref(this.selectOprModalRef)} .modalTitle="${'Select operator for group'}">
                              <div class="select-opr-modal-content">
                                <div>
                                  <label for="opr-type-select">Operator Type</label>
                                  <select
                                    name="opr-type-select"
                                    id="opr-type-select"
                                    .value="${this.selectedOprType}"
                                    @change="${this.handleSelectOprType}">
                                    <option value="boolean">Logical</option>
                                    <option value="compare">Compare</option>
                                    <option value="numeric">Numeric</option>
                                  </select>
                                </div>
                                <div class="opr-list">${this.operatorListTemplate(this.selectedOprType)}</div>
                              </div>
                            </editor-modal>
                          </div>
                          <editor-button class="go-back-button" @click="${this.handleExitGroupMode}">
                            <editor-icon .icon="${xLg}"></editor-icon>
                            <span>Cancel</span>
                          </editor-button>
                        </div>
                      `
                    : !this.isExample
                    ? html`
                        <editor-button class="expr-control-button" @click="${this.handleAddNewOpd}">
                          <editor-icon .icon="${plusLg}"></editor-icon>
                          <span>Add Operand</span>
                        </editor-button>
                        <editor-button
                          class="expr-control-button"
                          @click="${this.handleEnterGroupMode}"
                          ?disabled="${this.operands.length < 1}">
                          <editor-icon .icon="${check2square}"></editor-icon>
                          <span>Select ...</span>
                        </editor-button>
                      `
                    : nothing}
                </div>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}
