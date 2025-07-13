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

  handleShowExpressionModal() {
    this.expressionModalRef.value.showModal();
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
        .expression="${this.program.header.userVariables[this.varKey]}">
      </editor-expression-modal>
    `;
  }
}
