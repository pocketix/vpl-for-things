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
  parseExpressionToString,
  AbstractStatementWithArgs,
} from '@/index';
import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { languageContext, programContext } from '../context/editor-context';
import { globalStyles } from '../global-styles';
import { editorVariablesModalCustomEvent, graphicalEditorCustomEvent } from '../editor-custom-events';
import { v4 as uuidv4 } from 'uuid';
import { plusLg, pencilSquare } from '../icons';
import Types from '@vpl/types.ts';

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
        white-space: nowrap;
        min-width: 0;
        width: 100%;
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
    // Store the old value for comparison
    const oldValue = this.argument.value;

    // Update the argument value
    if (this.argument.type === Types.number || this.argument.type === 'num_opt') {
      this.argument.value = Number((e.currentTarget as HTMLSelectElement).value);
    } else {
      this.argument.value = (e.currentTarget as HTMLSelectElement).value;
    }

    // Only update metadata if the value actually changed
    if (oldValue !== this.argument.value) {
      // Update the device metadata if this is a device statement in an initialized procedure
      this.updateDeviceMetadataValue();

      // Log the value change
      console.log(`Argument value changed from ${oldValue} to ${this.argument.value}`);
    }

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  // Update the device metadata value when an argument value changes
  updateDeviceMetadataValue() {
    // Find the parent statement element to get the UUID
    const parentStatement = this.closest('ge-statement');
    if (!parentStatement) {
      console.warn('Could not find parent statement element');
      return;
    }

    // Get the statement UUID from the parent
    const stmtUuid = parentStatement.getAttribute('uuid');
    if (!stmtUuid) {
      console.warn('Parent statement has no UUID attribute');
      return;
    }

    console.log(`Updating device metadata for statement UUID: ${stmtUuid}, argument position: ${this.argPosition}, value: ${this.argument.value}`);

    // Find the procedure UUID by looking for the initialized procedure that contains this device
    for (const metadataEntry of this.program.header.initializedProcedures) {
      // Find the device metadata entry for this statement
      const deviceEntry = metadataEntry.devices.find(device => device.uuid === stmtUuid);
      if (deviceEntry) {
        console.log(`Found device entry in metadata:`, deviceEntry);

        // Update the value in the device metadata
        deviceEntry.value = String(this.argument.value);

        // Also update the argument value in the statement stored in the metadata
        if (deviceEntry.statement &&
            (deviceEntry.statement as AbstractStatementWithArgs).arguments) {

          // Make sure the argument position exists
          if ((deviceEntry.statement as AbstractStatementWithArgs).arguments[this.argPosition]) {
            // Update the argument value in the statement
            (deviceEntry.statement as AbstractStatementWithArgs).arguments[this.argPosition].value = this.argument.value;
            console.log(`Updated argument value in device statement at position ${this.argPosition}: ${this.argument.value}`);
          } else {
            console.warn(`Argument position ${this.argPosition} does not exist in device statement`);
          }
        } else {
          console.warn('Device statement has no arguments array');
        }

        console.log(`Updated device metadata value for UUID ${stmtUuid} to ${deviceEntry.value}`);

        // Log the entire initializedProcedures array for debugging
        console.log('Updated initializedProcedures:', JSON.stringify(this.program.header.initializedProcedures));

        return; // Exit after updating
      }
    }

    console.warn(`No device entry found for UUID ${stmtUuid} in initializedProcedures`);
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

  connectedCallback() {
    super.connectedCallback();

    // Check if this is a device statement in an initialized procedure
    // and if there's a stored value in the metadata
    this.checkForDeviceMetadataValue();

    // Set default value if needed
    if ((this.argument.type === 'num_opt' || this.argument.type === 'str_opt') && this.argument.value === null) {
      this.argument.value = (
        this.language.statements[this.stmtId] as UnitLanguageStatementWithArgs | CompoundLanguageStatementWithArgs
      ).arguments[this.argPosition].options[0].id;
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
  }

  // Check if there's a stored value in the device metadata and use it
  checkForDeviceMetadataValue() {
    // Find the parent statement element to get the UUID
    const parentStatement = this.closest('ge-statement');
    if (!parentStatement) return;

    // Get the statement UUID from the parent
    const stmtUuid = parentStatement.getAttribute('uuid');
    if (!stmtUuid) return;

    // Find the procedure UUID by looking for the initialized procedure that contains this device
    for (const metadataEntry of this.program.header.initializedProcedures) {
      // Find the device metadata entry for this statement
      const deviceEntry = metadataEntry.devices.find(device => device.uuid === stmtUuid);
      if (deviceEntry) {
        // First check if there's a value in the device metadata
        if (deviceEntry.value) {
          console.log(`Found device metadata value for UUID ${stmtUuid}: ${deviceEntry.value}`);

          // Set the argument value based on the type
          if (this.argument.type === Types.number || this.argument.type === 'num_opt') {
            this.argument.value = Number(deviceEntry.value);
          } else {
            this.argument.value = deviceEntry.value;
          }
          return; // Exit after updating
        }

        // If no value in metadata, check if there's a value in the statement arguments
        if (deviceEntry.statement &&
            (deviceEntry.statement as AbstractStatementWithArgs).arguments &&
            (deviceEntry.statement as AbstractStatementWithArgs).arguments[this.argPosition]) {

          const argValue = (deviceEntry.statement as AbstractStatementWithArgs).arguments[this.argPosition].value;
          if (argValue !== null && argValue !== undefined) {
            console.log(`Found argument value in device statement: ${argValue}`);

            // Set the argument value based on the type
            this.argument.value = argValue;

            // Also update the device metadata value for consistency
            deviceEntry.value = String(argValue);
            console.log(`Updated device metadata value to match argument: ${deviceEntry.value}`);

            return; // Exit after updating
          }
        }
      }
    }
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
          class="${this.argument.type === Types.variable && this.argument.value ? 'expr-arg' : ''} ${this.isExample
            ? 'disabled'
            : ''}"
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

    // Special case for deviceType blocks
    if (this.stmtId === 'deviceType' && this.argument.type === Types.string) {
      return this.deviceTypeTemplate(argumentElementId);
    }

    switch (this.argument.type as ArgumentType | 'device') {
      case Types.boolean:
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <select
                id="${argumentElementId}"
                .value="${this.argument.value}"
                @change="${this.handleValueChange}"
                @click="${(e: Event) => e.stopPropagation()}"
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
                ?disabled="${this.isExample}"
                id="${argumentElementId}"
                type="number"
                placeholder="123"
                .value="${this.argument.value}"
                @input="${this.handleValueChange}"
                @click="${(e: Event) => e.stopPropagation()}" />
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
                id="${argumentElementId}"
                .value="${this.argument.value}"
                @change="${this.handleValueChange}"
                @click="${(e: Event) => {
                  e.stopPropagation(); // Stop event from bubbling up to parent
                  this.handleValueChange(e);
                }}">
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
                ?disabled="${this.isExample}"
                id="${argumentElementId}"
                placeholder="abc"
                type="text"
                .value="${this.argument.value}"
                @input="${this.handleValueChange}"
                @click="${(e: Event) => e.stopPropagation()}" />
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
                ?disabled="${this.isExample}"
                style="width: 100%;"
                id="${argumentElementId}"
                .value="${this.argument.value}"
                @change="${this.handleValueChange}"
                @click="${(e: Event) => {
                  e.stopPropagation(); // Stop event from bubbling up to parent
                  this.handleValueChange(e);
                }}">
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
