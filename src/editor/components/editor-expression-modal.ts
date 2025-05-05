import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { editorExpressionCustomEvent } from '../editor-custom-events';
import { globalStyles } from '../global-styles';
import { EditorModal, ExpressionOperator } from '@/index';

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
        min-width: 250px;
        min-height: 300px;
        max-height: 590px;
      }

      .expression-list-modal::part(dialog) {
        overflow: auto;
      }
    `,
  ];

  @property() expression: any;
  @property() expressionModalCurrentView: ExpressionModalCurrentView = 'expressions';
  @property() selectedAddExpression: any;
  @property() highlightedExpr: HTMLElement;
  @property() isExample: boolean = false;

  expressionModalRef: Ref<EditorModal> = createRef();
  expressionsWapperRef: Ref<HTMLElement> = createRef();
  addOperandWrapperRef: Ref<HTMLElement> = createRef();

  constructor() {
    super();

    this.addEventListener(editorExpressionCustomEvent.EXPRESSION_HIGHLIGHTED, (e: CustomEvent) => {
      this.handleHighlightExpression(e.detail.exprToHighlight, e.detail.exprGroupRelation);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('Expression modal connected');
  }

  firstUpdated() {
    console.log('Expression modal first updated, modal ref:', this.expressionModalRef?.value);
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    console.log('Expression modal updated, modal ref:', this.expressionModalRef?.value);
  }

  handleHighlightExpression(exprElement: HTMLElement, exprGroupRelation: ExpressionOperator) {
    if (this.highlightedExpr === exprElement) {
      this.highlightedExpr.classList.toggle('expr-selected');
      this.highlightedExpr.classList.toggle(
        exprGroupRelation === '&&'
          ? 'grouped-by-and'
          : exprGroupRelation === '||'
          ? 'grouped-by-or'
          : 'grouped-by-other'
      );
      this.highlightedExpr = undefined;
      return;
    }

    if (this.highlightedExpr) {
      this.highlightedExpr.classList.remove('grouped-by-and', 'grouped-by-or', 'grouped-by-other', 'expr-selected');
    }
    this.highlightedExpr = exprElement;
    this.highlightedExpr.classList.add('expr-selected');
    this.highlightedExpr.classList.add(
      exprGroupRelation === '&&' ? 'grouped-by-and' : exprGroupRelation === '||' ? 'grouped-by-or' : 'grouped-by-other'
    );
  }

  showModal() {
    // Add defensive check to prevent errors when the modal reference is undefined
    if (this.expressionModalRef && this.expressionModalRef.value) {
      this.expressionModalRef.value.showModal();
    } else {
      console.error('Expression modal reference is undefined');
    }
  }

  hideModal() {
    // Add defensive check to prevent errors when the modal reference is undefined
    if (this.expressionModalRef && this.expressionModalRef.value) {
      this.expressionModalRef.value.hideModal();
    } else {
      console.error('Expression modal reference is undefined');
    }
  }

  toggleModal() {
    // Add defensive check to prevent errors when the modal reference is undefined
    if (this.expressionModalRef && this.expressionModalRef.value) {
      this.expressionModalRef.value.toggleModal();
    } else {
      console.error('Expression modal reference is undefined');
    }
  }

  render() {
    return html`
      <editor-modal ${ref(this.expressionModalRef)} .modalTitle="${'Create Expression'}" class="expression-list-modal">
        <div ${ref(this.expressionsWapperRef)} class="expression-list-modal-content-wrapper">
          <editor-expression
            .expression="${this.expression}"
            .highlightedExpr="${this.highlightedExpr}"
            .isExample="${this.isExample}">
          </editor-expression>
        </div>
      </editor-modal>
    `;
  }
}
