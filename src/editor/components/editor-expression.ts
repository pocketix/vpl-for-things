import { EditorExpressionOperandList, Expression, Program } from '@/index';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { editorExpressionCustomEvent } from '../editor-custom-events';
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
      }

      .opr-button {
        background: rgb(255, 255, 255);
        padding: 4px 2px;
        font-size: 1.25rem;
        line-height: 1rem;
        font-family: var(--mono-font);
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
    `,
  ];

  @property() expression: Expression;
  @property() nestedExprListIsVisible: boolean = true;
  @property() nestedLevel: number = 0;
  @property() exprIsSelected: boolean;
  @property() highlightedExpr: HTMLElement;

  @consume({ context: programContext })
  @property()
  program?: Program;

  exprWrapperRef: Ref<HTMLElement> = createRef();
  nestedExprListWrapperRef: Ref<EditorExpressionOperandList> = createRef();

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
        exprGroupRelation: this.expression.opr,
      },
    });
    this.dispatchEvent(evnt);

    e.stopPropagation();
  }

  render() {
    return html`
      <div ${ref(this.exprWrapperRef)} class="expr-wrapper">
        ${this.expression.opr
          ? html`
              <div
                @click="${this.handleOprButtonClicked}"
                class="opr-button-wrapper"
                style="${`top: ${(this.nestedLevel - 1) * 23}px; z-index: ${300 - (this.nestedLevel + 4)}`}">
                <div
                  class="opr-button ${this.expression.opr === '&&'
                    ? 'and-group'
                    : this.expression.opr === '||'
                    ? 'or-group'
                    : ''}">
                  ${this.program.convertOprToDisplayOpr(this.expression.opr)}
                </div>
                <div class="dots ${this.nestedExprListIsVisible ? 'hidden' : ''}">
                  <editor-icon .icon="${icons.threeDots}"></editor-icon>
                </div>
              </div>
            `
          : nothing}
        <div class="indent-wrapper">
          ${this.nestedLevel > 0 ? html`<div class="indent"></div>` : nothing}
          <editor-expression-operand-list
            ${ref(this.nestedExprListWrapperRef)}
            .parentExpr="${this.expression}"
            .operands="${this.expression.opds}"
            .nestedLevel="${this.nestedLevel}"
            .highlightedExpr="${this.highlightedExpr}"
            .exprIsSelected="${this.highlightedExpr &&
            this.exprWrapperRef.value &&
            this.highlightedExpr === this.exprWrapperRef.value}"
            class="expr-opd-list ${this.expression.opr ? 'indented' : ''} ${!this.nestedExprListIsVisible &&
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
