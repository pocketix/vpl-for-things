import { consume } from '@lit/context';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { programContext } from '../context/editor-context';
import { EditorModal, GroupedExpressions, Program } from '@/index';
import { Ref, createRef, ref } from 'lit/directives/ref.js';

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
      <editor-button @click="${this.handleShowExpressionModal}"
        >${(this.program.header.userVariables[this.varKey].value as GroupedExpressions[])?.length > 0
          ? this.program.parseGroupedExpressions(this.program.header.userVariables[this.varKey].value[0])
          : 'Enter expression'}
      </editor-button>
      <editor-expression-modal
        ${ref(this.expressionModalRef)}
        .exprList="${this.program.header.userVariables[this.varKey].value}">
      </editor-expression-modal>
    `;
  }
}
