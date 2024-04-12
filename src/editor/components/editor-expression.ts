import { Expression, Language, Program, compareOperators } from '@/index';
import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { languageContext, programContext } from '../context/editor-context';
import {
  editorExpressionCustomEvent,
  expressionListCustomEvent,
  graphicalEditorCustomEvent,
} from '../editor-custom-events';
import { globalStyles } from '../global-styles';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { v4 as uuidv4 } from 'uuid';
import { plusLg, xLg } from '../icons';

@customElement('editor-expression')
export class EditorExpression extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        border-radius: 0.5rem;
      }

      .expressions-wrapper {
        display: flex;
        align-items: center;
      }

      .expr-header-wrapper {
        display: flex;
        position: sticky;
        justify-content: end;
        align-items: center;
        background: white;
        padding: 0.5rem;
        padding-top: 0.75rem;
        padding-bottom: 0.75rem;
        /* border-radius: 0.5rem; */
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        cursor: pointer;
      }

      .expr-wrapper {
        position: relative;
        background: white;
        /* border-radius: 0.5rem; */
      }

      .group-relation {
        font-weight: 500;
        font-family: var(--mono-font);
        width: 100%;
        text-align: end;
      }

      .grouped-by-or {
        background-color: #f9731633;
      }

      .grouped-by-and {
        background-color: #3b82f633;
      }

      .grouped-by-and-header {
        background-color: #60a5fa;
      }

      .grouped-by-or-header {
        background-color: #fb923c;
      }

      .expr-view {
        font-family: var(--mono-font);
        text-align: center;
        overflow-x: auto;
      }

      .expr-select-checkbox {
        margin-left: 0.5rem !important;
      }

      .operator-select {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        font-family: var(--mono-font);
      }
    `,
  ];

  @property() expr: Expression;
  @property() index: number;
  @property() exprIsSelected: boolean = false;
  @property() nestedLevel: number;
  @property() highlightedExpr: HTMLElement;
  @property() exprListIsSelected: boolean;

  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;

  expressionGroupWrapperRef: Ref<HTMLElement> = createRef();
  exprHeaderWrapperRef: Ref<HTMLElement> = createRef();
  exprWrapperRef: Ref<HTMLElement> = createRef();

  handleOprChange(event: Event, expr: Expression) {
    if (this.program.operatorIsUnary(event.currentTarget.value) && !this.program.operatorIsUnary(expr.opr)) {
      delete expr.opd1;
    }
    if (this.program.operatorIsUnary(expr.opr) && !this.program.operatorIsUnary(event.currentTarget.value)) {
      expr.opd1 = { type: 'unknown', value: null };
    }
    expr.opr = event.currentTarget.value;

    const evnt = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(evnt);
  }

  handleSelectExpression(index: number) {
    this.exprIsSelected = !this.exprIsSelected;

    const evnt = new CustomEvent(editorExpressionCustomEvent.EXPRESSION_SELECTED, {
      bubbles: true,
      composed: true,
      detail: { index: index, selectedExpr: this.expr },
    });
    this.dispatchEvent(evnt);
  }

  handleHighlightList(e: Event) {
    const evnt = new CustomEvent(editorExpressionCustomEvent.EXPRESSION_HIGHLIGHTED, {
      bubbles: true,
      composed: true,
      detail: {
        exprToHighlight: this.exprWrapperRef.value,
        exprHeaderToHighlight: this.exprHeaderWrapperRef.value,
        exprGroupRelation: this.expr.opr,
      },
    });
    this.dispatchEvent(evnt);

    e.stopPropagation();
  }

  expressionModifyTemplate() {
    return html`
      <div class="expressions-wrapper" style="width: 100%;">
        ${!this.program.operatorIsUnary(this.expr.opr)
          ? html` <editor-expression-operand .operand="${this.expr.opd1}"></editor-expression-operand> `
          : nothing}
        <select
          .value="${this.expr.opr}"
          @change="${(e) => this.handleOprChange(e, this.expr)}"
          class="operator-select"
          name="">
          ${compareOperators.map((exprOpt) => {
            return html`<option value="${exprOpt}" ?selected=${this.expr.opr === exprOpt}>${exprOpt}</option>`;
          })}
        </select>
        <editor-expression-operand .operand="${this.expr.opd2}"></editor-expression-operand>
        ${this.exprListIsSelected || this.nestedLevel === 1
          ? html`
              <input
                type="checkbox"
                class="expr-select-checkbox"
                .value="${this.exprIsSelected}"
                @change="${() => this.handleSelectExpression(this.index)}" />
            `
          : nothing}
      </div>
    `;
  }

  expressionViewTemplate() {
    return html` <div class="expr-view">${this.program.parseGroupedExpressions(this.expr)}</div> `;
  }

  render() {
    return html`
      ${this.expr.exprList
        ? html`
            <div
              ${ref(this.exprWrapperRef)}
              class="expr-wrapper"
              style="${this.expr.opr === '&&'
                ? 'border: 2px solid #3b82f6; border-top: none;'
                : this.expr.opr === '||'
                ? 'border: 2px solid #f97316; border-top: none;'
                : 'border: 2px solid var(--gray-300); border-top: none;'}">
              <div
                ${ref(this.exprHeaderWrapperRef)}
                class="expr-header-wrapper"
                style="top: ${this.nestedLevel * 47}px; z-index: ${2000 - this.nestedLevel * 4 + 6}; ${this.expr.opr ===
                '&&'
                  ? 'border-top: 2px solid #3b82f6;'
                  : this.expr.opr === '||'
                  ? 'border-top: 2px solid #f97316;'
                  : 'border-top: 2px solid var(--gray-300); justify-content: center;'}">
                ${this.expr.opr !== '??'
                  ? html`<div class="group-relation" @click="${this.handleHighlightList}">${this.expr.opr}</div>`
                  : html`<div class="group-relation" style="opacity: 0;">a</div>`}
                ${this.exprListIsSelected || this.nestedLevel === 1
                  ? html`
                      <input
                        type="checkbox"
                        class="expr-select-checkbox"
                        .value="${this.exprIsSelected}"
                        @change="${() => this.handleSelectExpression(this.index)}" />
                    `
                  : nothing}
              </div>

              <editor-expression-list
                .exprList="${this.expr.exprList}"
                .nestedLevel="${this.nestedLevel + 1}"
                .highlightedExpr="${this.highlightedExpr}"
                .exprIsSelected="${this.highlightedExpr &&
                this.exprWrapperRef.value &&
                this.highlightedExpr === this.exprWrapperRef.value}">
              </editor-expression-list>
            </div>
          `
        : html`${this.exprListIsSelected || this.nestedLevel === 1
            ? this.expressionModifyTemplate()
            : this.expressionViewTemplate()}`}
    `;
  }
}
