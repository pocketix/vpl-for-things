import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import { consume } from '@lit/context';
import { languageContext, programContext } from '../context/editor-context';
import { EditorModal, Language, Program } from '@/index';
import * as icons from '@/editor/icons';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { graphicalEditorCustomEvent, statementCustomEvent } from '../editor-custom-events';

@customElement('editor-user-procedure-modal')
export class EditorUserProcedureModal extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .procedure-button {
        gap: 0.25rem;
      }

      .procedure-body-modal::part(dialog-title) {
        margin-left: 34px;
      }

      .delete-proc-button {
        position: absolute;
        top: 3px;
        left: 6px;
      }
    `,
  ];

  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;

  @property() stmtKey: string;

  userProcedureBodyModalRef: Ref<EditorModal> = createRef();

  handleChangeProcedureBody() {
    this.userProcedureBodyModalRef.value.showModal();
  }

  handleDeleteProcedure() {
    if (
      confirm(`Procedure ${this.language.statements[this.stmtKey].label} will be permanently deleted. Are you sure?`)
    ) {
      delete this.language.statements[this.stmtKey];
      delete this.program.header.userProcedures[this.stmtKey];

      this.userProcedureBodyModalRef.value.hideModal();

      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
  }

  render() {
    return html`
      <editor-button
        class="procedure-button"
        @click="${() => this.handleChangeProcedureBody()}"
        style="${`color: ${this.language.statements[this.stmtKey].foregroundColor}; background-color: ${
          this.language.statements[this.stmtKey].backgroundColor
        }`}">
        <editor-icon .icon="${icons[this.language.statements[this.stmtKey].icon]}"></editor-icon>
        <span>${this.language.statements[this.stmtKey].label}</span>
      </editor-button>
      <editor-modal
        class="procedure-body-modal"
        ${ref(this.userProcedureBodyModalRef)}
        .modalTitle="${this.language.statements[this.stmtKey].label}"
        .modalIcon="${icons[this.language.statements[this.stmtKey].icon]}"
        .backgroundColor="${this.language.statements[this.stmtKey].backgroundColor}"
        .foregroundColor="${this.language.statements[this.stmtKey].foregroundColor}"
        .isFullWidth="${true}"
        .isFullHeight="${true}">
        <editor-button class="delete-proc-button" @click="${this.handleDeleteProcedure}">
          <editor-icon .icon="${icons['trash']}" .color="${'var(--red-600)'}"></editor-icon>
        </editor-button>
        <ge-block .isProcBody="${true}" .block="${this.program.header.userProcedures[this.stmtKey]}"></ge-block>
      </editor-modal>
    `;
  }
}
