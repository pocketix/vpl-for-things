import {
  BoolOperator,
  CompareOperator,
  EditorExpressionOperandList,
  EditorModal,
  Expression,
  NumericOperator,
  Program,
  boolOperators,
  compareOperators,
  convertOprToDisplayOpr,
  numericOperators, ExpressionOperator
} from '@/index';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { editorExpressionCustomEvent, graphicalEditorCustomEvent } from '../editor-custom-events';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { globalStyles } from '../global-styles';
import * as icons from '@/editor/icons';
import { consume } from '@lit/context';
import { programContext } from '../context/editor-context';

@customElement('editor-expression')
export class EditorExpression extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        width: 100%;
      }

      .expr-wrapper {
        width: 100%;
        box-sizing: border-box;
      }

      .indented {
        border-left: 1px solid var(--gray-400);
      }

      .expr-selected .opr-button {
        font-weight: 600;
      }

      .grouped-by-and .opr-button {
        color: var(--blue-500);
      }

      .grouped-by-or .opr-button {
        color: var(--orange-500);
      }

      .grouped-by-other {
      }

      .opr-button-wrapper {
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        cursor: pointer;
        user-select: none;
        z-index: 400;
        border: 1px solid var(--gray-300);
        border-radius: 8px;
      }

      .opr-button {
        background: rgb(255, 255, 255);
        padding: 10px 2px;
        font-size: 1.25rem;
        line-height: 1rem;
        font-family: var(--mono-font);
        border-radius: 8px;
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .dots {
        border-left: 1px solid var(--gray-400);
        margin-left: 7px;
        padding-left: 4px;
      }

      .bottom-line {
        padding-bottom: 10px;
        border-bottom: 1px solid var(--gray-400);
        border-bottom-left-radius: 8px;
      }

      .grouped-by-and .expr-opd-list {
        border-color: var(--blue-500);
        background-color: rgba(59, 130, 246, 0.05);
      }

      .grouped-by-or .expr-opd-list {
        border-color: var(--orange-500);
        background-color: rgba(249, 115, 22, 0.05);
      }

      .expr-selected .expr-opd-list {
        border-width: 3px;
      }

      .grouped-by-other .expr-opd-list {
        background-color: rgba(107, 114, 128, 0.05);
      }

      .and-group {
        color: var(--blue-500);
      }

      .or-group {
        color: var(--orange-500);
      }

      .indent-wrapper {
        display: flex;
      }

      .indent {
        height: 100%;
        width: 8px;
      }

      .edit-opr-button {
        margin-left: auto;
        padding: 4px;
        padding-right: 8px;
      }

      .opr-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .opr-list-item {
        justify-content: center;
        font-family: var(--mono-font);
      }

      .select-opr-modal-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    `,
  ];

  @property() expression: Expression;
  @property() nestedExprListIsVisible: boolean = true;
  @property() nestedLevel: number = 0;
  @property() exprIsSelected: boolean;
  @property() highlightedExpr: HTMLElement;
  @property() selectedOprType: string = 'bool';
  @property() isExample: boolean = false;

  @consume({ context: programContext })
  @property()
  program?: Program;

  exprWrapperRef: Ref<HTMLElement> = createRef();
  nestedExprListWrapperRef: Ref<EditorExpressionOperandList> = createRef();
  changeOprModalRef: Ref<EditorModal> = createRef();

  handleOprButtonClicked(e: Event) {
    if (!this.nestedExprListIsVisible) {
      this.handleHighlightList(e);
    }

    if (
      this.nestedExprListIsVisible &&
      this.highlightedExpr &&
      this.exprWrapperRef.value &&
      this.highlightedExpr === this.exprWrapperRef.value
    ) {
      this.handleHighlightList(e);
    }

    if (
      this.nestedExprListIsVisible &&
      this.highlightedExpr &&
      this.exprWrapperRef.value &&
      this.highlightedExpr !== this.exprWrapperRef.value
    ) {
      this.handleHighlightList(e);
      return;
    }

    if (this.highlightedExpr === undefined && this.nestedExprListIsVisible) {
      this.handleHighlightList(e);
      return;
    }

    if (this.nestedExprListIsVisible) {
      this.handleHideNestedExprList();
    } else {
      this.handleShowNestedExprList();
    }
  }

  handleShowNestedExprList() {
    this.nestedExprListWrapperRef.value.classList.add('block');
    this.nestedExprListWrapperRef.value.classList.remove('hidden');
    this.nestedExprListIsVisible = true;
  }

  handleHideNestedExprList() {
    this.nestedExprListWrapperRef.value.classList.add('hidden');
    this.nestedExprListWrapperRef.value.classList.remove('block');
    this.nestedExprListIsVisible = false;
  }

  handleHighlightList(e: Event) {
    const evnt = new CustomEvent(editorExpressionCustomEvent.EXPRESSION_HIGHLIGHTED, {
      bubbles: true,
      composed: true,
      detail: {
        exprToHighlight: this.exprWrapperRef.value,
        exprGroupRelation: this.expression.value,
      },
    });
    this.dispatchEvent(evnt);

    e.stopPropagation();
  }

  handleSelectOprType(e: Event) {
    this.selectedOprType = (e.currentTarget as HTMLSelectElement).value;
  }

  handleChangeOpr(type: NumericOperator | BoolOperator | CompareOperator) {
    this.expression.type = type;

    this.changeOprModalRef.value.hideModal();

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  operatorListTemplate(oprType) {
    let operatorList;

    switch (oprType) {
      case 'bool':
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
          <editor-button @click="${() => this.handleChangeOpr(opr)}" class="opr-list-item"
            >${convertOprToDisplayOpr(opr)}
          </editor-button>
        `
    )}`;
  }

  render() {
    return html`
      <div ${ref(this.exprWrapperRef)} class="expr-wrapper">
        ${this.expression.type
          ? html`
              <div
                @click="${this.handleOprButtonClicked}"
                class="opr-button-wrapper"
                style="${`top: ${(this.nestedLevel - 1) * 37}px; z-index: ${300 - (this.nestedLevel + 4)}`}">
                <div
                  class="opr-button ${this.expression.type === '&&'
                    ? 'and-group'
                    : this.expression.type === '||'
                    ? 'or-group'
                    : ''}">
                  <span> ${convertOprToDisplayOpr(this.expression.type as ExpressionOperator)} </span>
                  ${!this.nestedExprListIsVisible
                    ? html`
                        <span>
                          <editor-icon .icon="${icons.threeDots}" style="color: black;"></editor-icon>
                        </span>
                      `
                    : nothing}
                  ${this.highlightedExpr === this.exprWrapperRef.value && !this.isExample
                    ? html`
                        <editor-icon
                          @click="${(e: Event) => {
                            this.changeOprModalRef.value.showModal();
                            e.stopPropagation();
                          }}"
                          class="edit-opr-button"
                          .icon="${icons.pencilSquare}"></editor-icon>
                      `
                    : nothing}
                </div>
              </div>
            `
          : nothing}
        <editor-modal ${ref(this.changeOprModalRef)} .modalTitle="${'Change operator'}">
          <div class="select-opr-modal-content">
            <div>
              <label for="opr-type-select">Operator Type</label>
              <select
                name="opr-type-select"
                id="opr-type-select"
                .value="${this.selectedOprType}"
                @change="${this.handleSelectOprType}">
                <option value="bool">Logical</option>
                <option value="compare">Compare</option>
                <option value="numeric">Numeric</option>
              </select>
            </div>
            <div class="opr-list">${this.operatorListTemplate(this.selectedOprType)}</div>
          </div>
        </editor-modal>
        <div class="indent-wrapper">
          ${this.nestedLevel > 0 ? html`<div class="indent"></div>` : nothing}
          <editor-expression-operand-list
            ${ref(this.nestedExprListWrapperRef)}
            .parentExpr="${this.expression}"
            .operands="${this.expression.value}"
            .nestedLevel="${this.nestedLevel}"
            .highlightedExpr="${this.highlightedExpr}"
            .isExample="${this.isExample}"
            .exprIsSelected="${this.highlightedExpr &&
            this.exprWrapperRef.value &&
            this.highlightedExpr === this.exprWrapperRef.value}"
            class="expr-opd-list ${this.expression.type ? 'indented' : ''} ${!this.nestedExprListIsVisible &&
            this.nestedLevel > 0
              ? 'hidden'
              : 'block'} ${this.nestedLevel > 0 ? 'bottom-line' : ''}"
            style="${this.nestedLevel === 0 ? 'padding-bottom: 108px;' : ''}">
          </editor-expression-operand-list>
        </div>
      </div>
    `;
  }
}
