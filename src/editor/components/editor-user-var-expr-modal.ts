import { consume } from '@lit/context';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { programContext } from '../context/editor-context';
import { EditorModal, Program } from '@/index';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { threeDots } from '../icons';

@customElement('editor-user-var-expr-modal')
export class EditorUserVarExprModal extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ];

  @consume({ context: programContext })
  @property()
  program?: Program;

  @property() varKey: string;

  expressionModalRef: Ref<EditorModal> = createRef();

  connectedCallback() {
    super.connectedCallback();
    console.log('User var expression modal connected');
  }

  firstUpdated() {
    console.log('User var expression modal first updated, modal ref:', this.expressionModalRef?.value);
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    console.log('User var expression modal updated, modal ref:', this.expressionModalRef?.value);
  }

  handleShowExpressionModal() {
    // Add defensive check to prevent errors when the modal reference is undefined
    if (this.expressionModalRef && this.expressionModalRef.value) {
      this.expressionModalRef.value.showModal();
    } else {
      console.error('Expression modal reference is undefined in user-var-expr-modal');
    }
  }

  render() {
    return html`
      <editor-button @click="${this.handleShowExpressionModal}">
        <div style="display: flex; gap: 4px; align-items: center;">
          <editor-icon .icon="${threeDots}"></editor-icon>
          Expression
        </div>
      </editor-button>
      <editor-expression-modal
        ${ref(this.expressionModalRef)}
        .expression="${this.program.header.userVariables[this.varKey].value}">
      </editor-expression-modal>
    `;
  }
}
