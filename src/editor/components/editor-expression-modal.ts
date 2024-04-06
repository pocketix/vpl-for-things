import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import {
  editorExpressionCustomEvent,
  expressionListCustomEvent,
  graphicalEditorCustomEvent,
} from '../editor-custom-events';
import { globalStyles } from '../global-styles';
import { consume } from '@lit/context';

type ExpressionModalCurrentView = 'expressions' | 'addOperand';

@customElement('editor-expression-modal')
export class EditorExpressionModal extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .expression-list-modal-content-wrapper {
        min-height: 200px;
        min-width: 200px;
      }
    `,
  ];

  @property() exprList: any;
  @property() expressionModalCurrentView: ExpressionModalCurrentView = 'expressions';
  @property() selectedAddExpression: any;
  @property() highlightedExpr: HTMLElement;

  expressionModalRef: Ref<HTMLDialogElement> = createRef();
  expressionsWapperRef: Ref<HTMLElement> = createRef();
  addOperandWrapperRef: Ref<HTMLElement> = createRef();

  constructor() {
    super();

    this.addEventListener(expressionListCustomEvent.ADD_EXPR_ARG, (e: CustomEvent) => {
      this.handleAddExpressionArgument(e);
    });
    this.addEventListener(editorExpressionCustomEvent.EXPRESSION_HIGHLIGHTED, (e: CustomEvent) => {
      this.handleHighlightExpression(
        e.detail.exprToHighlight,
        e.detail.exprHeaderToHighlight,
        e.detail.exprGroupRelation
      );
    });
  }

  handleAddExpressionArgument(e: CustomEvent) {
    this.selectedAddExpression = e.detail.selectedAddExpression;

    this.expressionModalCurrentView = 'addOperand';
    this.switchViews();
  }

  handleHighlightExpression(exprElement: HTMLElement, exprHeaderElement: HTMLElement, exprGroupRelation: '&&' | '||') {
    let exprHeader;

    if (this.highlightedExpr === exprElement) {
      exprHeader = this.highlightedExpr.getElementsByClassName('expr-header-wrapper')[0];
      this.highlightedExpr.classList.toggle(exprGroupRelation === '&&' ? 'grouped-by-and' : 'grouped-by-or');
      exprHeader.classList.toggle(exprGroupRelation === '&&' ? 'grouped-by-and-header' : 'grouped-by-or-header');
      this.highlightedExpr = undefined;
      return;
    }

    if (this.highlightedExpr) {
      exprHeader = this.highlightedExpr.getElementsByClassName('expr-header-wrapper')[0];
      this.highlightedExpr.classList.remove('grouped-by-and', 'grouped-by-or');
      exprHeader.classList.remove('grouped-by-and-header', 'grouped-by-or-header');
    }
    this.highlightedExpr = exprElement;
    this.highlightedExpr.classList.add(exprGroupRelation === '&&' ? 'grouped-by-and' : 'grouped-by-or');

    exprHeader = this.highlightedExpr.getElementsByClassName('expr-header-wrapper')[0];
    exprHeader.classList.add(exprGroupRelation === '&&' ? 'grouped-by-and-header' : 'grouped-by-or-header');
  }

  showModal() {
    this.expressionModalRef.value.showModal();
  }

  switchViews() {
    this.expressionsWapperRef.value.classList.add('hidden');
    this.addOperandWrapperRef.value.classList.add('hidden');

    switch (this.expressionModalCurrentView) {
      case 'expressions':
        this.expressionsWapperRef.value.classList.remove('hidden');
        break;
      case 'addOperand':
        this.addOperandWrapperRef.value.classList.remove('hidden');
        break;
    }
  }

  addOperandTemplate() {
    return html`
      <div ${ref(this.addOperandWrapperRef)} class="hidden">
        <editor-button
          @click="${() => {
            this.expressionModalCurrentView = 'expressions';
            this.switchViews();
          }}">
          zpet
        </editor-button>
        <editor-button
          @click="${() => {
            this.selectedAddExpression.expressionRef[this.selectedAddExpression.opd] = 5;
            this.expressionModalCurrentView = 'expressions';
            this.switchViews();
            const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
              bubbles: true,
              composed: true,
            });
            this.dispatchEvent(event);
          }}">
          5
        </editor-button>
      </div>
    `;
  }

  render() {
    return html`
      <editor-modal ${ref(this.expressionModalRef)} modalTitle="${'Create Expression'}" class="expression-list-modal">
        <div ${ref(this.expressionsWapperRef)} class="expression-list-modal-content-wrapper">
          <editor-expression-list
            .exprList="${this.exprList}"
            .highlightedExpr="${this.highlightedExpr}"
            style="padding: 0;">
          </editor-expression-list>
        </div>
        ${this.addOperandTemplate()}
      </editor-modal>
    `;
  }
}
