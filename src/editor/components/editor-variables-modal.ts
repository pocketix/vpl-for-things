import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { EditorModal } from './editor-modal';
import { consume } from '@lit/context';
import { languageContext, programContext } from '../context/editor-context';
import { Language, Program, VariableTypes } from '@/index';
import { editorVariablesModalCustomEvent } from '../editor-custom-events';

@customElement('editor-variables-modal')
export class EditorVariablesModal extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .user-variables-modal-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 500px;
        min-height: 300px;
      }

      .var-search-input {
        font-family: var(--main-font) !important;
        position: sticky;
        top: 0;
        background: white;
      }

      .tabs {
        display: flex;
      }

      .variable-type-button {
        background-color: white;
        border: none;
        box-shadow: none;
        padding: 0.25rem;
        border-radius: 0;
      }

      .variables-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .vars-not-available {
        text-align: center;
        color: var(--gray-500);
      }
    `,
  ];

  @consume({ context: programContext })
  @property()
  program?: Program;

  @consume({ context: languageContext, subscribe: true })
  @property({ attribute: false })
  language?: Language;

  @property() variableSearchInput = '';
  @property() permittedVarType: VariableTypes | 'all';
  @property() renderUserVariables: boolean = true;

  get filteredUserVariables() {
    return Object.keys(this.program.header.userVariables)
      .map((varKey) => {
        return varKey;
      })
      .filter((varKey) => {
        let variableIsSameType;
        if (this.permittedVarType === 'all') {
          return varKey.toLowerCase().includes(this.variableSearchInput.toLowerCase());
        }

        variableIsSameType = this.program.header.userVariables[varKey].type === this.permittedVarType;

        if (this.variableSearchInput) {
          return variableIsSameType && varKey.toLowerCase().includes(this.variableSearchInput.toLowerCase());
        } else {
          return variableIsSameType;
        }
      });
  }

  get filteredDeviceVariables() {
    return Object.keys(this.language.variables)
      .map((varKey) => varKey)
      .filter((varKey) => {
        if (this.variableSearchInput) {
          return varKey.toLowerCase().includes(this.variableSearchInput.toLowerCase());
        }
        return true;
      });
  }

  variablesModalRef: Ref<EditorModal> = createRef();

  showModal() {
    this.variablesModalRef.value.showModal();
  }

  hideModal() {
    this.variablesModalRef.value.hideModal();
  }

  toggleModal() {
    this.variablesModalRef.value.toggleModal();
  }

  handleVariableSearchInputChange(e: Event) {
    this.variableSearchInput = (e.currentTarget as HTMLInputElement).value;
  }

  handleSelectUserVariable(varKey: string) {
    this.variablesModalRef.value.hideModal();

    const event = new CustomEvent(editorVariablesModalCustomEvent.VARIABLE_SELECTED, {
      bubbles: true,
      composed: true,
      detail: { varKey: varKey },
    });
    this.dispatchEvent(event);
  }

  handleRenderUserVariables() {
    if (!this.renderUserVariables) {
      this.renderUserVariables = true;
      this.variableSearchInput = '';
    }
  }

  handleRenderDeviceVariables() {
    if (this.renderUserVariables) {
      this.renderUserVariables = false;
      this.variableSearchInput = '';
    }
  }

  userVariablesTemplate() {
    return html`
      <div class="variables-wrapper">
        ${this.filteredUserVariables.length < 1
          ? html`<div class="vars-not-available">No available variables.</div>`
          : nothing}
        ${this.filteredUserVariables.map((varKey) => {
          return html`
            <editor-button @click="${() => this.handleSelectUserVariable(varKey)}">${varKey}</editor-button>
          `;
        })}
      </div>
    `;
  }

  deviceVariablesTemplate() {
    return html`
      <div class="variables-wrapper">
        ${this.filteredDeviceVariables.length < 1
          ? html`<div class="vars-not-available">No available variables.</div>`
          : nothing}
        ${this.filteredDeviceVariables.map((varKey) => {
          return html`
            <editor-button @click="${() => this.handleSelectUserVariable(varKey)}"> ${varKey} </editor-button>
          `;
        })}
      </div>
    `;
  }

  render() {
    return html`
      <editor-modal ${ref(this.variablesModalRef)} .modalTitle="${'Select Variable'}" class="user-variables-modal">
        <div class="user-variables-modal-wrapper">
          <input
            autofocus
            type="text"
            placeholder="Search"
            class="var-search-input"
            .value="${this.variableSearchInput}"
            @input="${this.handleVariableSearchInputChange}" />
          <div class="tabs">
            <editor-button
              class="variable-type-button user-variables-button"
              @click="${this.handleRenderUserVariables}"
              style="${this.renderUserVariables
                ? 'border-bottom: 2px solid var(--blue-500)'
                : 'border-bottom: 2px solid white'}">
              User Variables
            </editor-button>
            <editor-button
              class="variable-type-button"
              @click="${this.handleRenderDeviceVariables}"
              style="${!this.renderUserVariables
                ? 'border-bottom: 2px solid var(--blue-500)'
                : 'border-bottom: 2px solid white'}">
              Device Variables
            </editor-button>
          </div>

          ${this.renderUserVariables ? this.userVariablesTemplate() : this.deviceVariablesTemplate()}
        </div>
      </editor-modal>
    `;
  }
}
