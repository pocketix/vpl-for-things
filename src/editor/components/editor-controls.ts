import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import {
  boxArrowInDown,
  boxArrowUp,
  braces,
  checkLg,
  floppy,
  pencilSquare,
  plusLg,
  questionCircle,
  trash,
  xLg,
} from '../icons';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { EditorModal } from './editor-modal';
import { repeat } from 'lit/directives/repeat.js';
import { consume } from '@lit/context';
import { languageContext, programContext } from '../context/editor-context';
import { Program, UserVariable, UserVariableType, initDefaultArgumentType, userVariableTypes } from '@/vpl/program';
import {
  editorControlsCustomEvent,
  graphicalEditorCustomEvent,
  textEditorCustomEvent,
} from '../editor-custom-events';
import { EditorUserProceduresModal } from './editor-user-procedures-modal';
import * as icons from '@/editor/icons';
import { Language } from '@/index';
import Types from '@vpl/types.ts';

export type VariableTableMode = 'display' | 'edit';
export type SelectedEditorView = 'ge' | 'te' | 'split';

@customElement('editor-controls')
export class EditorControls extends LitElement {
  static styles = [//{{{
    globalStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
      }

      .editor-switcher {
        width: 100%;
      }

      .controls {
        display: flex;
        flex-wrap: wrap;
        column-gap: 1.5rem;
        row-gap: 0.25rem;
        justify-content: flex-start;
        width: 100%;
        padding-bottom: 0.5rem;
      }

      .controls-group-editor {
        display: flex;
        gap: 0.25rem;
      }

      .controls-group-user {
        display: flex;
        gap: 0.25rem;
        width: 100%;
      }

      .controls-group-user editor-button {
        flex: 1;
      }

      .controls-group-export {
        display: flex;
        gap: 0.25rem;
        width: 100%;
        height: 100%;
      }

      .controls-group-export editor-button {
        flex: 1;
        height: 100%;
      }

      .variables-icon {
        width: 18px;
        height: 18px;
        font-size: 1.5rem;
        line-height: 0;
        padding-top: 6px;
        padding-left: 3px;
      }


      .edit-variable-button {
        white-space: nowrap;
      }

      .user-variables-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: sticky;
        top: 0;
        background-color: white;
        padding-bottom: 0.5rem;
      }

      .user-variables-header-search {
        display: flex;
        gap: 0.25rem;
      }

      .user-variables-wrapper {
        display: flex;
        flex-direction: column;
        min-height: 300px;
      }

      .variable-type-wrapper {
        display: flex;
        gap: 0.25rem;
        align-items: center;
      }

      .variables-buttons-wrapper {
        display: flex;
        gap: 0.25rem;
      }

      .variables-table-header {
        position: sticky;
        top: 47px;
      }

      .add-variable-modal-content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .add-variable-modal-item {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .add-variable-modal-save {
        display: flex;
        gap: 0.25rem;
      }

      .add-variable-modal-save-button {
        width: 100%;
      }

      .add-variable-modal-save-button::part(btn) {
        justify-content: center;
      }

      .add-variable-label-wrapper {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .variable-types-legend {
        display: flex;
        flex-direction: column;
        column-gap: 1rem;
        padding: 0.25rem;
      }

      .variable-types-legend-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: 400;
      }

      .variable-types-legend-help-button {
        display: flex;
        gap: 0.25rem;
        align-items: center;
      }

      #variable-search-field {
        font-family: var(--main-font);
      }

      #add-variable-name-input {
        font-family: var(--main-font);
      }

      .no-variables-phrase {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        align-items: center;
        justify-content: center;
        color: var(--gray-500);
      }

      .control-button::part(btn) {
        font-weight: 400;
      }

      @media (min-width: 500px) {
        :host {
          flex-direction: row;
        }

        .editor-switcher {
          width: initial;
        }

        .controls-group-user {
          width: fit-content;
        }

        .controls-group-user editor-button {
          flex-grow: 0;
        }

        .controls-group-export {
          width: fit-content;
          height: fit-content;
        }

        .controls-group-export editor-button {
          height: fit-content;
        }

        .controls {
          padding-bottom: 0;
        }
      }
    `,
  ];//}}}

  @consume({ context: programContext })
  @property()
  program?: Program;

  @consume({ context: languageContext })
  @property()
  language?: Language;

  @property() selectedEditorView: SelectedEditorView = 'split';
  @property() variablesTableMode: VariableTableMode = 'display';
  @property() selectedAddVariableType: UserVariableType = Types.string;
  @property() selectedAddVariableInitialValueBool: any = true;
  @property() selectedAddVariableInitialValueBoolExpr: any = {value: initDefaultArgumentType(Types.boolean_expression), type: Types.boolean_expression};
  @property() selectedAddVariableInitialValueStr: any = '';
  @property() selectedAddVariableInitialValueNum: any = '0';
  @property() selectedAddVariableInitialValueNumExpr: any = [];
  @property() addVariableNameIsMissing: boolean = false;
  @property() addVariableInitialValueIsMissing: boolean = false;
  @property() addVariableNameExists: boolean = false;
  @property() variableSearchInput: string = '';

  @property() addVariableName: string = '';
  @property() tempNewVariable: UserVariable;

  userVariablesModalRef: Ref<EditorModal> = createRef();
  addVariableExpressionModalRef: Ref<EditorModal> = createRef();
  addVariableModalRef: Ref<EditorModal> = createRef();
  variableTypesLegendModalRef: Ref<EditorModal> = createRef();
  userProceduresModalRef: Ref<EditorUserProceduresModal> = createRef();
  inputProgramFileRef: Ref<HTMLInputElement> = createRef();
  exportProgramLinkRef: Ref<HTMLAnchorElement> = createRef();

  get filteredVariables() {
    return Object.keys(this.program.header.userVariables)
      .filter((varKey) => {
        if (this.variableSearchInput) {
          return varKey.toLowerCase().includes(this.variableSearchInput.toLowerCase());
        }
        return true;
      })
      .sort();
  }

  handleShowUserVariablesModal() {
    this.userVariablesModalRef.value.showModal();
  }

  handleUserVariableTypeChange(e: Event, varKey: string) {
    this.program.header.userVariables[varKey].type = (e.currentTarget as HTMLInputElement).value as UserVariableType;

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
        return 'UNKNOWN';
    }
  }

  convertVariableTypeToDisplayColor(varType: UserVariableType) {
    switch (varType) {
      case Types.boolean:
        return 'var(--blue-500)';
      case Types.boolean_expression:
        return 'var(--violet-500)';
      case Types.number:
        return 'var(--yellow-500)';
      case Types.string:
        return 'var(--emerald-500)';
      default:
        return '#000000';
    }
  }

  convertVariableTypeToIcon(varType: UserVariableType) {
    switch (varType) {
      case Types.boolean:
        return 'toggles';
      case Types.boolean_expression:
        return 'codeSlash';
      case Types.number:
        return 'numbers';
      case Types.string:
        return 'text';
    }
  }

  handleSelectEditorView(e: Event) {
    this.selectedEditorView = (e.currentTarget as HTMLInputElement).value as SelectedEditorView;
    const event = new CustomEvent(editorControlsCustomEvent.EDITOR_VIEW_CHANGED, {
      bubbles: true,
      composed: true,
      detail: { newView: this.selectedEditorView },
    });
    this.dispatchEvent(event);
  }

  handleShowAddVariableExpressionModal() {
    this.addVariableInitialValueIsMissing = false;
    this.addVariableExpressionModalRef.value.showModal();
  }

  handleVariablesTableChangeMode() {
    if (this.variablesTableMode === 'display') {
      this.variablesTableMode = 'edit';
    } else if (this.variablesTableMode === 'edit') {
      this.variablesTableMode = 'display';
    }
  }

  handleShowAddVariableModal() {
    this.addVariableModalRef.value.showModal();
  }

  handleSelectVariableType(e: Event) {
    this.addVariableInitialValueIsMissing = false;
    this.selectedAddVariableType = (e.currentTarget as HTMLSelectElement).value as UserVariableType;
  }

  handleAddVariableNameInputChange(e: Event) {
    this.addVariableName = (e.currentTarget as HTMLInputElement).value;
    this.addVariableNameIsMissing = false;
    this.addVariableNameExists = false;
  }

  handleAddVariableInitialInputChange(e: Event) {
    this.addVariableInitialValueIsMissing = false;

    switch (this.selectedAddVariableType) {
      case Types.boolean:
        this.selectedAddVariableInitialValueBool = (e.currentTarget as HTMLInputElement).value;
        break;
      case Types.boolean_expression:
        this.selectedAddVariableInitialValueBoolExpr = (e.currentTarget as HTMLInputElement).value;
        break;
      case Types.number:
        this.selectedAddVariableInitialValueNum = (e.currentTarget as HTMLInputElement).value;
        break;
      case Types.string:
        this.selectedAddVariableInitialValueStr = (e.currentTarget as HTMLInputElement).value;
        break;
    }
  }

  handleAddNewVariable() {
    let fromIsValid = true;

    if (!this.addVariableName) {
      this.addVariableNameIsMissing = true;
      fromIsValid = false;
    }
    if (this.addVariableName) {
      if (this.program.header.userVariables[this.addVariableName]) {
        this.addVariableNameExists = true;
        fromIsValid = false;
      }
    }

    switch (this.selectedAddVariableType) {
      case Types.string:
        if (!this.selectedAddVariableInitialValueStr) {
          this.addVariableInitialValueIsMissing = true;
          return;
        }
        break;
      case Types.number:
        if (!this.selectedAddVariableInitialValueNum) {
          this.addVariableInitialValueIsMissing = true;
          return;
        }
        break;
      case Types.boolean_expression:
        if (this.selectedAddVariableInitialValueBoolExpr.length === 0) {
          this.addVariableInitialValueIsMissing = true;
          return;
        }
        break;
    }

    if (fromIsValid) {
      this.program.header.userVariables[this.addVariableName] = {
        type: Types.boolean,
        value: true,
      };
      this.program.header.userVariables[this.addVariableName].type = this.selectedAddVariableType;
      switch (this.selectedAddVariableType) {
        case Types.string:
          this.program.header.userVariables[this.addVariableName].value = this.selectedAddVariableInitialValueStr;
          this.selectedAddVariableInitialValueStr = initDefaultArgumentType(this.selectedAddVariableType);
          break;
        case Types.boolean:
          this.program.header.userVariables[this.addVariableName].value = this.selectedAddVariableInitialValueBool;
          this.selectedAddVariableInitialValueBool = initDefaultArgumentType(this.selectedAddVariableType);
          break;
        case Types.boolean_expression:
          this.program.header.userVariables[this.addVariableName] = this.selectedAddVariableInitialValueBoolExpr;
          this.selectedAddVariableInitialValueBoolExpr = {value: initDefaultArgumentType(this.selectedAddVariableType), type: Types.boolean_expression};
          break;
        case Types.number:
          this.program.header.userVariables[this.addVariableName].value = this.selectedAddVariableInitialValueNum;
          this.selectedAddVariableInitialValueNum = initDefaultArgumentType(this.selectedAddVariableType);
          break;
      }
      this.addVariableName = '';
      this.requestUpdate();
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
      this.addVariableModalRef.value.hideModal();
    }
  }

  handleCloseAddVariableModal() {
    this.addVariableModalRef.value.hideModal();
  }

  handleVariablesSearch(e: Event) {
    this.variableSearchInput = (e.currentTarget as HTMLInputElement).value;
  }

  handleDeleteVariable(varKey: string) {
    if (confirm(`Variable "${varKey}" will be pernamently deleted. Are you sure?`)) {
      delete this.program.header.userVariables[varKey];
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { newView: this.selectedEditorView },
      });
      this.dispatchEvent(event);
    }
  }

  handleModifyVariableName(e: Event, oldVarKey: string) {
    let newVarKey = (e.currentTarget as HTMLInputElement).value;
    if (newVarKey) {
      if (this.program.header.userVariables[newVarKey]) {
        return;
      } else {
        this.program.header.userVariables[newVarKey] = this.program.header.userVariables[oldVarKey];
        delete this.program.header.userVariables[oldVarKey];
      }
    }
  }

  handleModifyVariableInitialValue(e: Event, varKey: string) {
    if ((e.currentTarget as HTMLInputElement).value) {
      this.program.header.userVariables[varKey].value = (e.currentTarget as HTMLInputElement).value;
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { newView: this.selectedEditorView },
      });
      this.dispatchEvent(event);
    }
  }

  handleImportProgram() {
    if (this.inputProgramFileRef.value.files[0]) {
      if (this.inputProgramFileRef.value.files[0].type === 'application/json') {
        let fr = new FileReader();
        fr.onload = (e) => {
          this.program.loadProgram(JSON.parse(e.target.result as string));

          for (let proc of Object.keys(this.program.header.userProcedures)) {
            this.language.statements[proc] = {
              type: 'unit',
              group: 'misc',
              label: proc,
              icon: 'lightningChargeFill',
              foregroundColor: '#ffffff',
              backgroundColor: '#d946ef',
              isUserProcedure: true,
            };
          }

          const event = new CustomEvent(textEditorCustomEvent.PROGRAM_UPDATED, {
            bubbles: true,
            composed: true,
          });
          this.dispatchEvent(event);
          const event2 = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
            bubbles: true,
            composed: true,
          });
          this.dispatchEvent(event2);
        };
        fr.readAsText(this.inputProgramFileRef.value.files[0]);
      }
    }
  }

  handleExportProgram() {
    const fileName = prompt("Enter the name for the exported program:", "program");
    if (fileName) {
      const programExport = {
        header: {
          userVariables: this.program?.header.userVariables,
          userProcedures: this.program?.header.userProcedures,
        },
        block: this.program?.block,
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(programExport, null, 2));
      const downloadAnchorNode = this.exportProgramLinkRef.value;
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', `${fileName}.json`);
      downloadAnchorNode.click();
    }
  }



  handleImportHeader() {
    const headerFileInput = this.shadowRoot.getElementById('header-file-input') as HTMLInputElement;
    if (headerFileInput.files[0]) {
      if (headerFileInput.files[0].type === 'application/json') {
        let fr = new FileReader();
        fr.onload = (e) => {
          const importedData = JSON.parse(e.target.result as string);

          // Check if the imported file contains userProcedures
          if (!importedData.userProcedures) {
            alert("The imported file does not contain valid user procedures.");
            return;
          }

          // Check for duplicate procedure names
          for (let procName of Object.keys(importedData.userProcedures)) {
            if (this.program.header.userProcedures[procName]) {
              alert(`Duplicate procedure name found: ${procName}`);
              return;
            }
          }

          // Merge userProcedures
          this.program.header.userProcedures = {
            ...this.program.header.userProcedures,
            ...importedData.userProcedures,
          };

          // Integrate custom procedures into the language context
          for (let proc of Object.keys(importedData.userProcedures)) {
            this.language.statements[proc] = {
              type: 'unit',
              group: 'misc',
              label: proc,
              icon: 'lightningChargeFill',
              foregroundColor: importedData.userProcedures[proc].foregroundColor || '#ffffff',
              backgroundColor: importedData.userProcedures[proc].backgroundColor || '#d946ef',
              isUserProcedure: true,
            };
          }

          // Dispatch events to update the program and UI
          const programUpdatedEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
            bubbles: true,
            composed: true,
          });
          this.dispatchEvent(programUpdatedEvent);

          const textEditorUpdatedEvent = new CustomEvent(textEditorCustomEvent.PROGRAM_UPDATED, {
            bubbles: true,
            composed: true,
          });
          this.dispatchEvent(textEditorUpdatedEvent);
        };
        fr.readAsText(headerFileInput.files[0]);
      }
    }
  }

  handleExportHeader() {
    const fileName = prompt("Enter the name for the exported UDFs:", "udfs");
    if (fileName) {
      const udfExport = {
        userProcedures: Object.keys(this.program?.header.userProcedures || {}).reduce((acc, proc) => {
          acc[proc] = {
            ...this.program.header.userProcedures[proc],
            foregroundColor: this.language.statements[proc].foregroundColor,
            backgroundColor: this.language.statements[proc].backgroundColor,
          };
          return acc;
        }, {}),
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(udfExport, null, 2));
      const downloadAnchorNode = this.exportProgramLinkRef.value;
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', `${fileName}.json`);
      downloadAnchorNode.click();
    }
  }





  userVariablesModalTemplate() {
    return html`
      <editor-modal class="user-variables-modal" ${ref(this.userVariablesModalRef)} .modalTitle="${'Variables'}">
        <div class="user-variables-wrapper">
          <div class="user-variables-header">
            <div class="user-variables-header-search">
              <input
                autofocus
                type="text"
                placeholder="Search"
                id="variable-search-field"
                .value="${this.variableSearchInput}"
                @input="${this.handleVariablesSearch}" />
              <div class="variables-buttons-wrapper">
                <editor-button btnStyle="white-space: nowrap;" @click="${this.handleVariablesTableChangeMode}">
                  ${this.variablesTableMode === 'display'
                    ? html`
                        <editor-icon .icon="${pencilSquare}"></editor-icon>
                        <div>Edit</div>
                      `
                    : html`
                        <editor-icon .icon="${floppy}"></editor-icon>
                        <div>Save</div>
                      `}
                </editor-button>
                <editor-button btnStyle="white-space: nowrap;" @click="${this.handleShowAddVariableModal}">
                  <editor-icon .icon="${plusLg}"></editor-icon>
                  <div>New</div>
                </editor-button>
                <editor-modal ${ref(this.addVariableModalRef)} .modalTitle="${'Add New Variable'}">
                  <div class="add-variable-modal-content-wrapper">
                    <div class="add-variable-modal-item">
                      <label for="add-variable-type-select">Type</label>
                      <select
                        autofocus
                        name=""
                        id="add-variable-type-select"
                        .value="${this.selectedAddVariableType}"
                        @change="${this.handleSelectVariableType}">
                        ${userVariableTypes.map(
                          (varType) =>
                            html`
                              <option value="${varType}">
                                ${this.convertVariableTypeToDisplayVariableType(varType)}
                              </option>
                            `
                        )}
                      </select>
                    </div>
                    <div class="add-variable-modal-item">
                      <div class="add-variable-label-wrapper">
                        <label for="add-variable-name-input">Name</label>
                        ${this.addVariableNameIsMissing
                          ? html`<span style="color: var(--red-600);">Name is required.</span>`
                          : nothing}
                        ${this.addVariableNameExists
                          ? html`<span style="color: var(--red-600);">Name already exists.</span>`
                          : nothing}
                      </div>
                      <input
                        id="add-variable-name-input"
                        type="text"
                        placeholder="foo"
                        style="${this.addVariableNameIsMissing || this.addVariableNameExists
                          ? 'border: 1px solid var(--red-600);'
                          : ''}"
                        .value="${this.addVariableName}"
                        @input="${this.handleAddVariableNameInputChange}" />
                    </div>
                    <div class="add-variable-modal-item">
                      <div class="add-variable-label-wrapper">
                        <label for="add-variable-init-value-input">Initial Value</label>
                        ${this.addVariableInitialValueIsMissing
                          ? html`<span style="color: var(--red-600);">Value is required.</span>`
                          : nothing}
                      </div>
                      ${this.addUserVariableInitialValueTemplate(this.selectedAddVariableType)}
                    </div>
                    <div class="add-variable-modal-save">
                      <editor-button
                        class="add-variable-modal-save-button"
                        btnStyle="color: var(--green-600);"
                        @click="${this.handleAddNewVariable}">
                          <editor-icon .icon="${checkLg}"></editor-icon>
                          <div>Add</div>
                      </editor-button>
                      <editor-button
                        @click="${this.handleCloseAddVariableModal}"
                        class="add-variable-modal-save-button"
                        btnStyle="color: var(--red-600);">
                        <editor-icon .icon="${xLg}"></editor-icon>
                        <div>Cancel</div>
                      </editor-button>
                    </div>
                  </div>
                </editor-modal>
              </div>
            </div>
          </div>
          ${this.userVariablesTableTemplate()}
          ${this.filteredVariables.length > 0
            ? nothing
            : html` <div class="no-variables-phrase">Click on "New" to create new variable.</div> `}
        </div>
      </editor-modal>
    `;
  }

  addUserVariableInitialValueTemplate(varType: UserVariableType) {
    switch (varType) {
      case Types.boolean:
        return html`
          <select
            id="add-variable-init-value-input"
            .value="${this.selectedAddVariableInitialValueBool}"
            @change="${this.handleAddVariableInitialInputChange}">
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        `;
      case Types.boolean_expression:
        return html`
          <editor-button
            @click="${this.handleShowAddVariableExpressionModal}"
            btnStyle="${this.addVariableInitialValueIsMissing ? 'border: 1px solid var(--red-600);' : ''}">
            <div style="display: flex; gap: 4px; align-items: center;">
              <editor-icon .icon="${icons.threeDots}"></editor-icon>
              Expression
            </div>
          </editor-button>
          <editor-expression-modal
            ${ref(this.addVariableExpressionModalRef)}
            .expression="${this.selectedAddVariableInitialValueBoolExpr}">
          </editor-expression-modal>
        `;
      case Types.number:
        return html`
          <input
            id="add-variable-init-value-input"
            type="number"
            name=""
            id=""
            inputmode="decimal"
            placeholder="123"
            style="${this.addVariableInitialValueIsMissing ? 'border: 1px solid var(--red-600);' : ''}"
            @input="${this.handleAddVariableInitialInputChange}"
            .value="${this.selectedAddVariableInitialValueNum}" />
        `;
      case Types.string:
        return html`
          <input
            id="add-variable-init-value-input"
            type="text"
            name=""
            id=""
            placeholder="abc"
            style="${this.addVariableInitialValueIsMissing ? 'border: 1px solid var(--red-600);' : ''}"
            .value="${this.selectedAddVariableInitialValueStr}"
            @input="${this.handleAddVariableInitialInputChange}" />
        `;
    }
  }

  userVariablesTableTemplate() {
    return html`
      <table class="user-variables-table">
        <tr class="variables-table-header">
          <th
            @mouseover="${() => this.variableTypesLegendModalRef.value.showModal()}"
            @mouseout="${() => this.variableTypesLegendModalRef.value.hideModal()}">
            <div class="variable-types-legend-help-button">
              <span>Type</span>
              <editor-icon .icon="${questionCircle}"></editor-icon>
            </div>
            <editor-modal
              ${ref(this.variableTypesLegendModalRef)}
              .displayType="${'dialog'}"
              .titleIsVisible="${false}"
              ?hideCloseButton="${true}">
              <div class="variable-types-legend">
                ${userVariableTypes.map((varType: UserVariableType) => {
                  return html`
                    <div class="variable-types-legend-item" style="white-space: nowrap;">
                      <editor-icon
                        .icon="${icons[this.convertVariableTypeToIcon(varType)]}"
                        .width="${18}"
                        .height="${18}"
                        .color="${this.convertVariableTypeToDisplayColor(varType)}">
                      </editor-icon>
                      <span>${this.convertVariableTypeToDisplayVariableType(varType)}</span>
                    </div>
                  `;
                })}
              </div>
            </editor-modal>
          </th>
          <th>Name</th>
          <th>Initial Value</th>
          ${this.variablesTableMode === 'edit' ? html`<th></th>` : nothing}
        </tr>

        ${repeat(
          this.filteredVariables,
          (key) => key,
          (key) => {
            return html`
              <tr>
                <td>
                  <div class="variable-type-wrapper">
                    <editor-icon
                      .icon="${icons[this.convertVariableTypeToIcon(this.program.header.userVariables[key].type)]}"
                      .width="${18}"
                      .height="${18}"
                      .color="${this.convertVariableTypeToDisplayColor(this.program.header.userVariables[key].type)}">
                    </editor-icon>
                    <div>
                      ${this.convertVariableTypeToDisplayVariableType(
                        this.program.header.userVariables[key].type,
                        true
                      )}
                    </div>
                  </div>
                </td>
                <td class="bold-font">
                  ${this.variablesTableMode === 'display'
                    ? html`<span style="word-break: break-all;">${key}</span>`
                    : html`<input
                        type="text"
                        name=""
                        id=""
                        .value="${key}"
                        @change="${(e: Event) => this.handleModifyVariableName(e, key)}" />`}
                </td>
                <td>
                  ${this.variablesTableMode === 'display'
                    ? this.userVaribleInitialValueTemplate(key)
                    : this.userVaribleModifyInitialValueTemplate(key)}
                </td>
                ${this.variablesTableMode === 'edit'
                  ? html`
                      <td>
                        <editor-button @click="${() => this.handleDeleteVariable(key)}">
                          <editor-icon .icon="${trash}" .color="${'var(--red-600)'}"></editor-icon>
                        </editor-button>
                      </td>
                    `
                  : nothing}
              </tr>
            `;
          }
        )}
      </table>
    `;
  }

  userVaribleInitialValueTemplate(varKey: string) {
    switch (this.program.header.userVariables[varKey].type) {
      case Types.boolean:
        return html`<span style="text-transform: capitalize;"
          >${this.program.header.userVariables[varKey].value}</span
        >`;
      case Types.boolean_expression:
        return html`
          <div style="word-break: break-all;">
            <div style="display: flex; gap: 4px; align-items: center;">
              <editor-icon .icon="${icons.threeDots}"></editor-icon>
              Expression
            </div>
          </div>
        `;
      case Types.number:
        return html` <div style="word-break: break-all;">${this.program.header.userVariables[varKey].value}</div> `;
      case Types.string:
        return html` <div style="word-break: break-all;">${this.program.header.userVariables[varKey].value}</div> `;
    }
  }

  userVaribleModifyInitialValueTemplate(varKey: string) {
    console.assert(typeof this.program.header.userVariables[varKey].value === "string", "user variable value is of type string");
    const value = this.program.header.userVariables[varKey].value as string; // TODO(filip): rework types

    switch (this.program.header.userVariables[varKey].type) {
      case Types.boolean:
        return html`
          <select
            class="mono-font"
            .value="${value}"
            @change="${(e: Event) => this.handleModifyVariableInitialValue(e, varKey)}">
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        `;
      case Types.boolean_expression:
        return html`<editor-user-var-expr-modal .varKey="${varKey}"></editor-user-var-expr-modal> `;
      case Types.number:
        return html`
          <input
            type="number"
            name=""
            id=""
            inputmode="decimal"
            placeholder="123"
            .value="${value}"
            @change="${(e: Event) => this.handleModifyVariableInitialValue(e, varKey)}" />
        `;
      case Types.string:
        return html`
          <input
            type="text"
            name=""
            id=""
            placeholder="abc"
            .value="${value}"
            @change="${(e: Event) => this.handleModifyVariableInitialValue(e, varKey)}" />
        `;
    }
  }

  render() {
    return html`
      <div class="controls">
        <div class="controls-group-export">
          <label for="program-file-input">
            <input
              ${ref(this.inputProgramFileRef)}
              type="file"
              name="program-file-input"
              id="program-file-input"
              style="display: none;"
              accept="application/json"
              @input="${this.handleImportProgram}" />
            <editor-button @click="${this.handleImportProgram}" class="control-button">
              <editor-icon .icon="${boxArrowInDown}" .width="${18}" .height="${18}" title="Import Program">
              </editor-icon>
              <span>Import Program</span>
            </editor-button>
          </label>
          <editor-button @click="${this.handleExportProgram}" class="control-button">
            <editor-icon .icon="${boxArrowUp}" .width="${18}" .height="${18}" title="Export Program"></editor-icon>
            <span>Export Program</span>
          </editor-button>
          <a ${ref(this.exportProgramLinkRef)} href="" style="display: none;"></a>
        </div>
        <div class="controls-group-user">
          <editor-button title="Variables" @click="${this.handleShowUserVariablesModal}" class="control-button">
            <div class="variables-icon">𝑥</div>
            <div>Variables</div>
          </editor-button>
          <editor-button @click="${() => this.userProceduresModalRef.value.showModal()}" class="control-button">
            <editor-icon .icon="${braces}" .width="${18}" .height="${18}" title="Procedures"></editor-icon>
            <span>Procedures</span>
          </editor-button>
        </div>
      </div>
      <select class="editor-switcher" .value="${this.selectedEditorView}" @change="${this.handleSelectEditorView}">
        <option value="split">Split View</option>
        <option value="ge">Graphical View</option>
        <option value="te">Text View</option>
      </select>
      ${this.userVariablesModalTemplate()}
      <editor-user-procedures-modal ${ref(this.userProceduresModalRef)}></editor-user-procedures-modal>
    `;
  }
}
