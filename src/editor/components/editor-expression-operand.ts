import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import {
  EditorModal,
  EditorVariablesModal,
  ExpressionOperand,
  ExpressionOperandType,
  Language,
  Program,
  UserVariableType,
} from '@/index';
import { checkLg, plusLg, xLg } from '../icons';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { consume } from '@lit/context';
import { languageContext, programContext } from '../context/editor-context';
import {
  editorExpressionOperandCustomEvent,
  editorVariablesModalCustomEvent,
  graphicalEditorCustomEvent,
} from '../editor-custom-events';
import Types from '@vpl/types.ts';

@customElement('editor-expression-operand')
export class EditorExpressionOperand extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        width: 95%;
      }

      .operand-button {
        flex: 1;
        width: 95%;
      }

      .operand-button::part(btn) {
        font-family: var(--mono-font);
        white-space: normal;
        word-break: break-all;
        overflow-x: auto;
        justify-content: flex-start;
        border: none;
        box-shadow: none;
        background: none;
        padding-left: 0;
        padding-right: 0;
        opacity: 100 !important;
      }

      .add-operand-modal-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .add-operand-modal-item-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .operand-value-wrapper {
        display: flex;
        width: 100%;
      }

      .variables-icon {
        width: 18px;
        height: 18px;
        font-size: 1.5rem;
        line-height: 0;
        padding-top: 6px;
        padding-left: 3px;
      }

      #add-opd-input {
        width: 200px;
      }

      .operand-var-input {
        width: 200px;
      }

      .add-operand-confirm-button::part(btn) {
        justify-content: center;
      }
    `,
  ];

  @consume({ context: languageContext })
  @property({ attribute: false })
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;

  @property() operand: ExpressionOperand;
  @property() operandTypes = [
    { id: Types.string, label: 'String' },
    { id: Types.number, label: 'Number' },
    { id: Types.boolean, label: 'Boolean' },
  ];
  @property() operandValueIsMissing: boolean = false;
  @property() visibleOnRender: boolean = false;
  @property() isExample: boolean = false;

  exprAddOperandModalRef: Ref<EditorModal> = createRef();
  variablesModalRef: Ref<EditorVariablesModal> = createRef();

  constructor() {
    super();
    this.addEventListener(editorVariablesModalCustomEvent.VARIABLE_SELECTED, (e: CustomEvent) => {
      this.handleVariableSelected(e);
      e.stopPropagation();
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.operand.type === Types.unknown) {
      this.operand.type = Types.string;
    }
  }

  handleAddExpressionOperand() {
    this.exprAddOperandModalRef.value.showModal();
  }

  handleSelectOperandTypeChange(e: Event) {
    this.operandValueIsMissing = false;
    this.operand.type = (e.currentTarget as HTMLSelectElement).value as ExpressionOperandType;
    this.operand.value = this.initOperandValue(this.operand.type);

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleVariableSelected(e: CustomEvent) {
    this.operand.type = Types.variable;
    this.operand.value = e.detail.varKey;

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleConfirmOperand() {
    if (this.operand.value === null || this.operand.value === '') {
      this.operandValueIsMissing = true;
      return;
    }
    this.exprAddOperandModalRef.value.hideModal();
  }

  handleCancelOperand() {
    if (this.operand.value === null || this.operand.value === '') {
      const event = new CustomEvent(editorExpressionOperandCustomEvent.CANCEL_ADD_OPD, {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
    this.exprAddOperandModalRef.value.hideModal();
  }

  handleOperandValueChange(e: Event) {
    this.operandValueIsMissing = false;
    this.operand.value = this.convertOperandInputValue(this.operand.type, (e.currentTarget as HTMLSelectElement).value);
    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleDeselectUserVariable() {
    this.operand.type = this.program.header.userVariables[this.operand.value as string]
      ? this.program.header.userVariables[this.operand.value as string].type
      : Types.string;
    this.operand.value = this.initOperandValue(this.operand.type);

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  convertVariableTypeToDisplayVariableType(varType: UserVariableType, short?: boolean) {
    switch (varType) {
      case Types.boolean:
        return short ? 'Bool' : 'Boolean';
      case Types.boolean_expression:
        return short ? 'Expr' : 'Expression';
      case Types.number:
        return short ? 'Num' : 'Number';
      case Types.string:
        return short ? 'Str' : 'String';
      default:
        return 'Device';
    }
  }

  convertOperandInputValue(opdType, opdValue) {
    switch (opdType) {
      case Types.number:
        return Number(opdValue);
      case Types.boolean:
        return opdValue.toLowerCase() === 'true';
      case Types.string:
        return opdValue;
    }
  }

  initOperandValue(opdType) {
    switch (opdType) {
      case Types.number:
        return 0;
      case Types.string:
        return '';
      case Types.boolean:
        return false;
    }
  }

  operandValueTemplate(opdType) {
    switch (opdType) {
      case Types.boolean:
        return html`
          <div class="operand-value-wrapper">
            <select
              id="add-opd-input"
              .value="${this.operand.value}"
              @change="${this.handleOperandValueChange}"
              style="${'width: 100%;'}">
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
            ${this.variableModalTemplate()}
          </div>
        `;
      case Types.number:
        return html`
          <div class="operand-value-wrapper">
            <input
              id="add-opd-input"
              type="number"
              name=""
              id=""
              inputmode="decimal"
              placeholder="123"
              style="width: 100%; ${this.operandValueIsMissing ? 'border: 1px solid var(--red-600);' : ''}"
              @input="${this.handleOperandValueChange}"
              .value="${this.operand.value}" />
            ${this.variableModalTemplate()}
          </div>
        `;
      case Types.string:
        return html`
          <div class="operand-value-wrapper">
            <input
              id="add-opd-input"
              type="text"
              name=""
              id=""
              placeholder="abc"
              style="width: 100%; ${this.operandValueIsMissing ? 'border: 1px solid var(--red-600);' : ''}"
              .value="${this.operand.value}"
              @input="${this.handleOperandValueChange}" />
            ${this.variableModalTemplate()}
          </div>
        `;
      case Types.variable:
        return html`${this.variableModalTemplate()}`;
    }
  }

  variableModalTemplate() {
    return html`
      <div class="${this.operand.type === Types.variable && this.operand.value ? 'operand-value-wrapper' : ''}">
        <editor-button
          class="${this.operand.type === Types.variable && this.operand.value ? 'operand-var-input' : ''}"
          style="height: 100%; width: 100%;"
          @click="${() => this.variablesModalRef.value.showModal()}">
          ${this.operand.type === Types.variable && this.operand.value
            ? this.operand.value
            : html`<div class="variables-icon">𝑥</div>`}
        </editor-button>
        ${this.operand.type === Types.variable && this.operand.value
          ? html`
              <editor-button @click="${this.handleDeselectUserVariable}">
                <div class="variables-icon">𝑥-</div>
              </editor-button>
            `
          : nothing}
      </div>
      <editor-variables-modal
        ${ref(this.variablesModalRef)}
        .permittedVarType="${this.operand.type === Types.variable
          ? this.program.header.userVariables[this.operand.value as string]
            ? this.program.header.userVariables[this.operand.value as string].type
            : this.language.variables[this.operand.value as string].type
          : this.operand.type}">
      </editor-variables-modal>
    `;
  }

  render() {
    return html`
      <editor-button ?disabled="${this.isExample}" @click="${this.handleAddExpressionOperand}" class="operand-button">
        ${this.operand.value !== null
          ? typeof this.operand.value === 'string' && this.operand.type === Types.string
            ? `"${this.operand.value.toString()}"`
            : this.operand.type === Types.variable
            ? `$${this.operand.value.toString()}`
            : this.operand.value.toString()
          : html`
              <div style="display: flex; gap: 4px; color: var(--red-600); align-items: center;">
                <editor-icon .icon="${plusLg}"></editor-icon>
                <span>Add operand value</span>
              </div>
            `}
      </editor-button>
      <editor-modal
        ${ref(this.exprAddOperandModalRef)}
        .modalTitle="${'Add operand'}"
        ?hideCloseButton="${true}"
        .isVisible="${this.operand.value === null ? this.visibleOnRender : false}">
        <div class="add-operand-modal-wrapper">
          <div class="add-operand-modal-item-wrapper">
            <label for="opd-type-select">Type</label>
            ${this.operand.type === Types.variable
              ? html`
                  <editor-button disabled>
                    ${this.program.header.userVariables[this.operand.value as string]
                      ? this.convertVariableTypeToDisplayVariableType(
                          this.program.header.userVariables[this.operand.value as string].type
                        )
                      : this.convertVariableTypeToDisplayVariableType(
                          this.language.variables[this.operand.value as string].type as UserVariableType
                        )}
                  </editor-button>
                `
              : html`
                  <select
                    name="opd-type-select"
                    id="opd-type-select"
                    .value="${this.operand.type}"
                    @change="${this.handleSelectOperandTypeChange}">
                    ${this.operandTypes.map((type) => {
                      return html`
                        <option .value="${type.id}" ?selected="${this.operand.type === type.id}">${type.label}</option>
                      `;
                    })}
                  </select>
                `}
          </div>
          <div class="add-operand-modal-item-wrapper">
            <label for="add-opd-input">Value</label>
            ${this.operandValueTemplate(this.operand.type)}
          </div>
          <div style="display: flex; gap: 4px;">
            <editor-button
              class="add-operand-confirm-button"
              btnStyle="color: var(--green-600);"
              style="width: 100%;"
              @click="${this.handleConfirmOperand}">
              <editor-icon .icon="${checkLg}"></editor-icon>
              <div>OK</div>
            </editor-button>
            <editor-button
              class="add-operand-confirm-button"
              btnStyle="color: var(--red-600);"
              style="width: 100%;"
              @click="${this.handleCancelOperand}">
              <editor-icon .icon="${xLg}"></editor-icon>
              <div>Cancel</div>
            </editor-button>
          </div>
        </div>
      </editor-modal>
    `;
  }
}
