import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import {
  arrowClockwise,
  arrowCounterClockwise,
  boxArrowDown,
  boxArrowInDown,
  boxArrowUp,
  braces,
  checkLg,
  circleFill,
  cloudUpload,
  fileEarmarkArrowDown,
  fileEarmarkArrowUp,
  floppy,
  pencilSquare,
  playCircle,
  plusLg,
  questionCircle,
  trash,
  xLg,
} from '../icons';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { EditorModal } from './editor-modal';
import { repeat } from 'lit/directives/repeat.js';
import { consume } from '@lit/context';
import { programContext } from '../context/editor-context';
import {
  Expression,
  GroupedExpressions,
  Program,
  UserVariable,
  UserVariableType,
  UserVariableValue,
  userVariableTypes,
} from '@/vpl/program';
import { editorControlsCustomEvent, graphicalEditorCustomEvent } from '../editor-custom-events';

export type VariableTableMode = 'display' | 'edit';

@customElement('editor-controls')
export class EditorControls extends LitElement {
  static styles = [
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
        gap: 1.5rem;
        justify-content: center;
        width: 100%;
      }

      .controls-group-editor {
        display: flex;
        gap: 0.25rem;
      }

      .controls-group-user {
        display: flex;
        gap: 0.25rem;
      }

      .controls-group-export {
        display: flex;
        gap: 0.25rem;
      }

      .variables-icon {
        width: 18px;
        height: 18px;
        font-size: 1.5rem;
        line-height: 0;
        padding-top: 6px;
        padding-left: 3px;
      }

      .add-variable-button {
        display: flex;
        gap: 0.25rem;
        white-space: nowrap;
      }

      .edit-variable-button {
        display: flex;
        gap: 0.25rem;
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
        display: flex;
        gap: 0.25rem;
        width: 100%;
        justify-content: center;
      }

      .add-variable-label-wrapper {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
      }

      #add-variable-type-select {
      }

      .variable-types-legend {
        display: flex;
        flex-direction: column;
        column-gap: 1rem;
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

      .user-variables-modal::part(dialog) {
      }

      .no-variables-phrase {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        align-items: center;
        justify-content: center;
        color: var(--gray-500);
      }

      @media (min-width: 500px) {
        :host {
          flex-direction: row;
        }

        .editor-switcher {
          width: initial;
        }
      }
    `,
  ];

  @consume({ context: programContext })
  @property()
  program?: Program;

  @property() selectedEditorView: 'ge' | 'te' | 'split' = 'split';
  @property() variablesTableMode: VariableTableMode = 'display';
  @property() selectedAddVariableType: UserVariableType = 'str';
  @property() selectedAddVariableInitialValueBool: boolean = true;
  @property() selectedAddVariableInitialValueBoolExpr: Expression[] | GroupedExpressions[] = [
    { exprList: [{ opd1: null, opr: '>', opd2: null }], opr: '??' },
  ];
  @property() selectedAddVariableInitialValueStr: string = '';
  @property() selectedAddVariableInitialValueNum: string = '0';
  @property() selectedAddVariableInitialValueNumExpr: any = [];
  @property() addVariableNameIsMissing: boolean = false;
  @property() addVariableInitialValueIsMissing: boolean = false;
  @property() addVariableNameExists: boolean = false;
  @property() variableSearchInput: string = '';

  @property() addVariableName: string = '';
  @property() tempNewVariable: UserVariable;

  userVariablesModalRef: Ref<EditorModal> = createRef();
  expressionModalRef: Ref<EditorModal> = createRef();
  addVariableExpressionModalRef: Ref<EditorModal> = createRef();
  addVariableModalRef: Ref<EditorModal> = createRef();
  variableTypesLegendModalRef: Ref<EditorModal> = createRef();

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
    this.program.header.userVariables[varKey].type = e.currentTarget.value;
    console.log(this.program.header.userVariables[varKey]);

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  convertVariableTypeToDisplayVariableType(varType: UserVariableType, short?: boolean) {
    switch (varType) {
      case 'bool':
        return short ? 'Bool' : 'Boolean';
      case 'bool_expr':
        return short ? 'BE' : 'Boolean Expression';
      case 'num':
        return short ? 'Num' : 'Number';
      case 'num_expr':
        return short ? 'NE' : 'Numeric Expression';
      case 'str':
        return short ? 'Str' : 'String';
      default:
        return 'UNKNOWN';
    }
  }

  convertVariableTypeToDisplayColor(varType: UserVariableType) {
    switch (varType) {
      case 'bool':
        return 'var(--blue-500)';
      case 'bool_expr':
        return 'var(--indigo-500)';
      case 'num':
        return 'var(--yellow-500)';
      case 'num_expr':
        return 'var(--orange-500)';
      case 'str':
        return 'var(--emerald-500)';
      default:
        return '#000000';
    }
  }

  handleSelectEditorView(e: Event) {
    this.selectedEditorView = e.currentTarget.value;
    const event = new CustomEvent(editorControlsCustomEvent.EDITOR_VIEW_CHANGED, {
      bubbles: true,
      composed: true,
      detail: { newView: this.selectedEditorView },
    });
    this.dispatchEvent(event);
  }

  handleShowExpressionModal() {
    this.expressionModalRef.value.showModal();
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
      // TODO emit update event.
    }
  }

  handleShowAddVariableModal() {
    this.addVariableModalRef.value.showModal();
  }

  handleSelectVariableType(e: Event) {
    this.addVariableInitialValueIsMissing = false;
    this.selectedAddVariableType = e.currentTarget.value;
  }

  handleAddVariableNameInputChange(e: Event) {
    this.addVariableName = e.currentTarget.value;
    this.addVariableNameIsMissing = false;
    this.addVariableNameExists = false;
  }

  handleAddVariableInitialInputChange(e: Event) {
    this.addVariableInitialValueIsMissing = false;

    switch (this.selectedAddVariableType) {
      case 'bool':
        this.selectedAddVariableInitialValueBool = e.currentTarget.value;
        break;
      case 'bool_expr':
        this.selectedAddVariableInitialValueBoolExpr = e.currentTarget.value;
        break;
      case 'num':
        this.selectedAddVariableInitialValueNum = e.currentTarget.value;
        break;
      case 'num_expr':
        this.selectedAddVariableInitialValueNumExpr = e.currentTarget.value;
        break;
      case 'str':
        this.selectedAddVariableInitialValueStr = e.currentTarget.value;
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
      case 'str':
        if (!this.selectedAddVariableInitialValueStr) {
          this.addVariableInitialValueIsMissing = true;
          return;
        }
        break;
      case 'num':
        if (!this.selectedAddVariableInitialValueNum) {
          this.addVariableInitialValueIsMissing = true;
          return;
        }
        break;
      case 'bool_expr':
        if (this.selectedAddVariableInitialValueBoolExpr.length === 0) {
          this.addVariableInitialValueIsMissing = true;
          return;
        }
        break;
      case 'num_expr':
        // TODO Add numeric expression support.
        break;
    }

    if (fromIsValid) {
      this.program.header.userVariables[this.addVariableName] = {
        type: 'bool',
        value: true,
      };
      this.program.header.userVariables[this.addVariableName].type = this.selectedAddVariableType;
      switch (this.selectedAddVariableType) {
        case 'str':
          this.program.header.userVariables[this.addVariableName].value = this.selectedAddVariableInitialValueStr;
          this.selectedAddVariableInitialValueStr = this.program.initDefaultArgumentType(this.selectedAddVariableType);
          break;
        case 'bool':
          this.program.header.userVariables[this.addVariableName].value = this.selectedAddVariableInitialValueBool;
          this.selectedAddVariableInitialValueBool = this.program.initDefaultArgumentType(this.selectedAddVariableType);
          break;
        case 'bool_expr':
          this.program.header.userVariables[this.addVariableName].value = this.selectedAddVariableInitialValueBoolExpr;
          this.selectedAddVariableInitialValueBoolExpr = this.program.initDefaultArgumentType(
            this.selectedAddVariableType
          );
          break;
        case 'num':
          this.program.header.userVariables[this.addVariableName].value = this.selectedAddVariableInitialValueNum;
          this.selectedAddVariableInitialValueNum = this.program.initDefaultArgumentType(this.selectedAddVariableType);
          break;
        case 'num_expr':
          this.program.header.userVariables[this.addVariableName].value = this.selectedAddVariableInitialValueNumExpr;
          this.selectedAddVariableInitialValueNumExpr = this.program.initDefaultArgumentType(
            this.selectedAddVariableType
          );
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
    this.variableSearchInput = e.currentTarget.value;
    console.log(this.variableSearchInput);
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
    let newVarKey = e.currentTarget.value;
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
    if (e.currentTarget.value) {
      this.program.header.userVariables[varKey].value = e.currentTarget.value;
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { newView: this.selectedEditorView },
      });
      this.dispatchEvent(event);
    }
  }

  userVariablesModalTemplate() {
    return html`
      <editor-modal class="user-variables-modal" ${ref(this.userVariablesModalRef)} .modalTitle="${'Variables'}">
        <div class="user-variables-wrapper">
          <div class="user-variables-header">
            <div class="user-variables-header-search">
              <input
                type="text"
                placeholder="Search"
                id="variable-search-field"
                .value="${this.variableSearchInput}"
                @input="${this.handleVariablesSearch}" />
              <div class="variables-buttons-wrapper">
                <editor-button class="edit-variable-button" @click="${this.handleVariablesTableChangeMode}">
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
                <editor-button class="add-variable-button" @click="${this.handleShowAddVariableModal}">
                  <editor-icon .icon="${plusLg}"></editor-icon>
                  <div>New</div>
                </editor-button>
                <editor-modal ${ref(this.addVariableModalRef)} .modalTitle="${'Add New Variable'}">
                  <div class="add-variable-modal-content-wrapper">
                    <div class="add-variable-modal-item">
                      <label for="add-variable-type-select">Type</label>
                      <select
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
                        style="color: var(--green-600);"
                        @click="${this.handleAddNewVariable}">
                        <editor-icon .icon="${checkLg}"></editor-icon>
                        <div>Add</div>
                      </editor-button>
                      <editor-button
                        @click="${this.handleCloseAddVariableModal}"
                        class="add-variable-modal-save-button"
                        style="color: var(--red-600);">
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
      case 'bool':
        return html`
          <select
            id="add-variable-init-value-input"
            .value="${this.selectedAddVariableInitialValueBool}"
            @change="${this.handleAddVariableInitialInputChange}">
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        `;
      case 'bool_expr':
        return html`
          <editor-button
            @click="${this.handleShowAddVariableExpressionModal}"
            style="${this.addVariableInitialValueIsMissing ? 'border: 1px solid var(--red-600);' : ''}"
            >${(this.selectedAddVariableInitialValueBoolExpr as GroupedExpressions[])?.length > 0
              ? this.program.parseGroupedExpressions(this.selectedAddVariableInitialValueBoolExpr[0])
              : 'Enter expression'}
          </editor-button>
          <editor-expression-modal
            ${ref(this.addVariableExpressionModalRef)}
            .exprList="${this.selectedAddVariableInitialValueBoolExpr}">
          </editor-expression-modal>
        `;
      case 'num':
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
      case 'num_expr':
        return html``;
      case 'str':
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
              .closeButtonIsVisible="${false}">
              <div class="variable-types-legend">
                ${userVariableTypes.map((varType: UserVariableType) => {
                  return html`
                    <div class="variable-types-legend-item" style="white-space: nowrap;">
                      <editor-icon
                        .icon="${circleFill}"
                        .color="${this.convertVariableTypeToDisplayColor(varType)}"></editor-icon>
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
          (key, i) => {
            return html`
              <tr>
                <td>
                  <div class="variable-type-wrapper">
                    <editor-icon
                      .icon="${circleFill}"
                      .color="${this.convertVariableTypeToDisplayColor(
                        this.program.header.userVariables[key].type
                      )}"></editor-icon>
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
                    ? html`${key}`
                    : html`<input
                        type="text"
                        name=""
                        id=""
                        .value="${key}"
                        @change="${(e) => this.handleModifyVariableName(e, key)}" />`}
                </td>
                <td class="mono-font">
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
      case 'bool':
        return html`<span style="text-transform: capitalize;"
          >${this.program.header.userVariables[varKey].value}</span
        >`;
      case 'bool_expr':
        return html`
          <div style="word-break: break-all;">
            ${(this.program.header.userVariables[varKey].value as GroupedExpressions[])?.length > 0
              ? this.program.parseGroupedExpressions(this.program.header.userVariables[varKey].value[0])
              : 'Enter expression'}
          </div>
        `;
      case 'num':
        return html` <div style="word-break: break-all;">${this.program.header.userVariables[varKey].value}</div> `;
      case 'num_expr':
        return html``;
      case 'str':
        return html` <div style="word-break: break-all;">${this.program.header.userVariables[varKey].value}</div> `;
    }
  }

  userVaribleModifyInitialValueTemplate(varKey: string) {
    switch (this.program.header.userVariables[varKey].type) {
      case 'bool':
        return html`
          <select
            class="mono-font"
            .value="${this.program.header.userVariables[varKey].value}"
            @change="${(e) => this.handleModifyVariableInitialValue(e, varKey)}">
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        `;
      case 'bool_expr':
        return html`
          <editor-button @click="${this.handleShowExpressionModal}"
            >${(this.program.header.userVariables[varKey].value as GroupedExpressions[])?.length > 0
              ? this.program.parseGroupedExpressions(this.program.header.userVariables[varKey].value[0])
              : 'Enter expression'}
          </editor-button>
          <editor-expression-modal
            ${ref(this.expressionModalRef)}
            .exprList="${this.program.header.userVariables[varKey].value}">
          </editor-expression-modal>
        `;
      case 'num':
        return html`
          <input
            type="number"
            name=""
            id=""
            inputmode="decimal"
            placeholder="123"
            .value="${this.program.header.userVariables[varKey].value}"
            @change="${(e) => this.handleModifyVariableInitialValue(e, varKey)}" />
        `;
      case 'num_expr':
        return html``;
      case 'str':
        return html`
          <input
            type="text"
            name=""
            id=""
            placeholder="abc"
            .value="${this.program.header.userVariables[varKey].value}"
            @change="${(e) => this.handleModifyVariableInitialValue(e, varKey)}" />
        `;
    }
  }

  render() {
    return html`
      <div class="controls">
        <div class="controls-group-export">
          <editor-button>
            <editor-icon .icon="${boxArrowInDown}" .width="${18}" .height="${18}" title="Import Program"></editor-icon>
          </editor-button>
          <editor-button>
            <editor-icon .icon="${boxArrowUp}" .width="${18}" .height="${18}" title="Export Program"></editor-icon>
          </editor-button>
        </div>
        <div class="controls-group-editor">
          <editor-button>
            <editor-icon
              .icon="${arrowCounterClockwise}"
              .width="${18}"
              .height="${18}"
              title="Step Back"></editor-icon>
          </editor-button>
          <editor-button>
            <editor-icon .icon="${arrowClockwise}" .width="${18}" .height="${18}" title="Step Forward"></editor-icon>
          </editor-button>
          <editor-button>
            <editor-icon .icon="${playCircle}" .width="${18}" .height="${18}" title="Run Program"></editor-icon>
          </editor-button>
          <editor-button>
            <editor-icon .icon="${cloudUpload}" .width="${18}" .height="${18}" title="Save Program"></editor-icon>
          </editor-button>
          <editor-button>
            <editor-icon .icon="${questionCircle}" .width="${18}" .height="${18}" title="Show Help"></editor-icon>
          </editor-button>
        </div>
        <div class="controls-group-user">
          <editor-button title="Variables" @click="${this.handleShowUserVariablesModal}">
            <div class="variables-icon">𝑥</div>
          </editor-button>
          <editor-button>
            <editor-icon .icon="${braces}" .width="${18}" .height="${18}" title="Procedures"></editor-icon>
          </editor-button>
        </div>
      </div>
      <select class="editor-switcher" .value="${this.selectedEditorView}" @change="${this.handleSelectEditorView}">
        <option value="split">Split View</option>
        <option value="ge">Graphical View</option>
        <option value="te">Text View</option>
      </select>
      ${this.userVariablesModalTemplate()}
    `;
  }
}
