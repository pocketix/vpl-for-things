import {
  ArgumentType,
  CompoundLanguageStatementWithArgs,
  EditorModal,
  Expression,
  Language,
  Program,
  ProgramStatementArgument,
  UnitLanguageStatementWithArgs,
  initDefaultArgumentType,
  parseExpressionToString, BoolOperator, isExpressionOperator
} from '@/index';
import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { languageContext, programContext } from '../context/editor-context';
import { globalStyles } from '../global-styles';
import { editorVariablesModalCustomEvent, graphicalEditorCustomEvent, deviceStatementCustomEvent } from '../editor-custom-events';
import { v4 as uuidv4 } from 'uuid';
import { plusLg, pencilSquare } from '../icons';
import Types from '@vpl/types.ts';
import { classMap } from 'lit/directives/class-map.js';

@customElement('ge-statement-argument')
export class GeStatementArgument extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        white-space: nowrap;
        overflow-x: auto;
        width: 100%;
      }

      .expr-arg {
        min-width: 0;
        width: 100%;
      }

      .expr-arg::part(btn) {
        white-space: nowrap;
        font-family: var(--mono-font);
      }

      .variables-icon {
        width: 18px;
        height: 18px;
        font-size: 1.5rem;
        line-height: 0;
        padding-top: 6px;
        padding-left: 3px;
      }

      .user-variables-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .ava-label {
        font-weight: 600;
      }

      .argument-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
      }

      .argument-var-wrapper {
        display: flex;
        width: 100%;
        gap: 2px;
      }

      *:disabled {
        opacity: 100% !important;
        color: black;
      }

      .disabled {
        opacity: 100% !important;
        color: black;
        pointer-events: none;
      }
    `,
  ];

  @property() argument: ProgramStatementArgument;
  @property() argPosition: number;
  @property() stmtId: string;
  @property() selectedBoolValue: boolean = true;
  @property() showLabel: boolean = false;
  @property() originalArgumentType: ArgumentType;
  @property() variableKey: string;
  @property() isExample: boolean = false;

  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;

  expressionModalRef: Ref<EditorModal> = createRef();
  selectArgumentVariableModalRef: Ref<EditorModal> = createRef();

  handleShowExpressionModal() {
    this.expressionModalRef.value.showModal();
  }

  handleShowSelectArgumentVariableModal() {
    this.selectArgumentVariableModalRef.value.showModal();
  }

  handleHideSelectArgumentVariableModal() {
    this.selectArgumentVariableModalRef.value.hideModal();
  }

  handleValueChange(e: Event) {
    const oldValue = this.argument.value;

    if (this.argument.type === Types.number || this.argument.type === 'num_opt') {
      this.argument.value = Number(newValue);
    } else {
      this.argument.value = newValue;
    }

    if (oldValue !== this.argument.value) {
      console.log(`Argument value changed from ${oldValue} to ${this.argument.value}`);
    }

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
    
  }



  handleDeselectUserVariable() {
    if (this.program.header.userVariables[this.argument.value as string] !== undefined) {
      this.argument.type = this.program.header.userVariables[this.argument.value as string].type;
    } else {
      this.argument.type = (
        this.language.statements[this.stmtId] as UnitLanguageStatementWithArgs | CompoundLanguageStatementWithArgs
      ).arguments[this.argPosition].type;
    }
    this.argument.value = initDefaultArgumentType(this.argument.type);

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleVariableSelected(e: CustomEvent) {
    this.argument.type = Types.variable;
    this.argument.value = e.detail.varKey;

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  constructor() {
    super();
    this.addEventListener(editorVariablesModalCustomEvent.VARIABLE_SELECTED, (e: CustomEvent) => {
      this.handleVariableSelected(e);
    });
  }


  updated() {
    if (this.variableKey) {
      if (this.program.header.userVariables[this.variableKey]) {
        this.argument.type = this.program.header.userVariables[this.variableKey].type;
      } else {
        if (this.language.variables[this.variableKey]) {
          this.argument.type = Types.unknown;
        }
      }
    }
  }

  argumentLabelTemplate(labelId: string) {
    return (this.language.statements[this.stmtId] as UnitLanguageStatementWithArgs | CompoundLanguageStatementWithArgs)
      .arguments[this.argPosition].label && this.showLabel
      ? html`
          <label for="${labelId}"
            >${(
              this.language.statements[this.stmtId] as UnitLanguageStatementWithArgs | CompoundLanguageStatementWithArgs
            ).arguments[this.argPosition].label}</label
          >
        `
      : nothing;
  }

  useVariableTemplate() {
    let permittedVarType: string | ArgumentType;
    if (this.argument.type === Types.variable && this.argument.value !== null) {
      if (this.program.header.userVariables[this.argument.value as string] === undefined) {
        permittedVarType = (
          this.language.statements[this.stmtId] as UnitLanguageStatementWithArgs | CompoundLanguageStatementWithArgs
        ).arguments[this.argPosition].type;
      } else {
        permittedVarType = this.program.header.userVariables[this.argument.value as string].type;
      }
    } else {
      permittedVarType = this.argument.type;
    }

    if (this.stmtId === 'setvar' && this.argument.type === Types.variable) {
      permittedVarType = 'all';
    }

    return html`
      <div class="${this.argument.type === Types.variable && this.argument.value ? 'argument-var-wrapper' : ''}">
        <editor-button
          class="${classMap({'expr-arg': this.argument.type === Types.variable && !!this.argument.value, 'disabled': this.isExample})}"
          style="height: 100%;"
          @click="${this.handleShowSelectArgumentVariableModal}">
          ${this.argument.type === Types.variable && this.argument.value
            ? html`
                <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
                  <div style="text-overflow: ellipsis; overflow: hidden;">${`$${this.argument.value}`}</div>
                </div>
              `
            : html`<div class="variables-icon">𝑥</div>`}
        </editor-button>
        ${this.argument.type === Types.variable && this.argument.value && this.stmtId !== 'setvar' && !this.isExample
          ? html`
              <editor-button class="${this.isExample ? 'disabled' : ''}" @click="${this.handleDeselectUserVariable}">
                <div class="variables-icon">𝑥-</div>
              </editor-button>
            `
          : nothing}
        <editor-variables-modal ${ref(this.selectArgumentVariableModalRef)} .permittedVarType="${permittedVarType}">
        </editor-variables-modal>
      </div>
    `;
  }

  // Handle editing the deviceType value
  handleEditDeviceType() {
    // Prompt the user for a new device type value
    const currentValue = String(this.argument.value || '');
    const newValue = prompt('Enter device type:', currentValue);

    // If the user provided a value, update it
    if (newValue !== null) {
      this.argument.value = newValue;

      // Dispatch an event to update the program
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
  }

  // Special template for deviceType blocks
  deviceTypeTemplate(argumentElementId: string) {
    // Get the background color from the deviceType statement
    const bgColor = this.language.statements['deviceType'].backgroundColor;

    return html`
      <div class="argument-wrapper">
        ${this.argumentLabelTemplate(argumentElementId)}
        <div class="argument-var-wrapper">
          <div
            style="padding: 0.5rem; border: 1px solid transparent; border-radius: 0.25rem; background-color: ${bgColor}; color: black; width: 100%; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
            <span>${this.argument.value}</span>
            <span
              @click="${this.handleEditDeviceType}"
              style="cursor: pointer; display: inline-flex; align-items: center;"
              title="Edit device type">
              <editor-icon .icon="${pencilSquare}" .width="${14}" .height="${14}"></editor-icon>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    let argumentElementId = uuidv4();
    let argumentType = this.argument.type;

    if (isExpressionOperator(this.argument.type)) {
      argumentType = Types.boolean_expression;
    }

    switch (argumentType as ArgumentType | 'device' | BoolOperator) {
      case Types.boolean:
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <select
                autofocus
                id="${argumentElementId}"
                .value="${this.argument.value}"
                @change="${this.handleValueChange}"
                class="expr-arg">
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
              ${this.stmtId !== 'setvar' ? this.useVariableTemplate() : nothing}
            </div>
          </div>
        `;
      case Types.boolean_expression:
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate('')}
            <div class="argument-var-wrapper">
              <editor-button @click="${this.handleShowExpressionModal}" class="expr-arg expr-arg-bool-expr">
                ${(this.argument as Expression).value.length === 0
                  ? html`
                      <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
                        <editor-icon .icon="${plusLg}"></editor-icon>
                        <div style="text-overflow: ellipsis; overflow: hidden;">Enter Expression</div>
                      </div>
                    `
                  : html`
                      <div style="display: flex; gap: 4px; align-items: center; width: 100%;">
                        <div style="text-overflow: ellipsis; overflow: hidden;">
                          ${parseExpressionToString(this.argument as Expression)}
                        </div>
                      </div>
                    `}
              </editor-button>
              <editor-expression-modal
                ${ref(this.expressionModalRef)}
                .expression="${this.argument}"
                .isExample="${this.isExample}">
              </editor-expression-modal>
              ${this.stmtId !== 'setvar' ? this.useVariableTemplate() : nothing}
            </div>
          </div>
        `;
      case Types.number:
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <input
                autofocus
                ?disabled="${this.isExample}"
                id="${argumentElementId}"
                type="number"
                placeholder="123"
                .value="${this.argument.value}"
                @input="${this.handleValueChange}" />
              ${this.stmtId !== 'setvar' ? this.useVariableTemplate() : nothing}
            </div>
          </div>
        `;
      case 'num_opt':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <select
                autofocus
                id="${argumentElementId}"
                .value="${this.argument.value}"
                @change="${this.handleValueChange}"
                @click="${this.handleValueChange}">
                ${(
                  this.language.statements[this.stmtId] as
                    | UnitLanguageStatementWithArgs
                    | CompoundLanguageStatementWithArgs
                ).arguments[this.argPosition].options.map(
                  (option) => html`<option value="${option.id}">${option.label}</option>`
                )}
              </select>
            </div>
          </div>
        `;
      case Types.string:
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <input
                autofocus
                ?disabled="${this.isExample}"
                id="${argumentElementId}"
                placeholder="abc"
                type="text"
                .value="${this.argument.value}"
                @input="${this.handleValueChange}" />
              ${this.stmtId !== 'setvar' ? this.useVariableTemplate() : nothing}
            </div>
          </div>
        `;
      case 'str_opt':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <select
                autofocus
                ?disabled="${this.isExample}"
                style="width: 100%;"
                id="${argumentElementId}"
                .value="${this.argument.value}"
                @change="${this.handleValueChange}"
                @click="${this.handleValueChange}">
                ${(
                  this.language.statements[this.stmtId] as
                    | UnitLanguageStatementWithArgs
                    | CompoundLanguageStatementWithArgs
                ).arguments[this.argPosition].options.map(
                  (option) =>
                    html`
                      <option .value="${option.id}" ?selected="${this.argument.value === option.id}">
                        ${option.label}
                      </option>
                    `
                )}
              </select>
            </div>
          </div>
        `;
      case Types.variable:
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)} ${this.useVariableTemplate()}
          </div>
        `;
      case Types.unknown:
        return html` <div class="argument-wrapper">
          ${this.argumentLabelTemplate(argumentElementId)}
          <editor-button disabled>Select variable to set</editor-button>
        </div>`;
      case 'device':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <editor-button disabled>Device variable can't be set</editor-button>
          </div>
        `;
      default:
        return nothing;
    }
  }
}
