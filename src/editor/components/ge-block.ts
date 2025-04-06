import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { Block, Program, ProgramStatement, getBlockDependencies, getBlockDependents, CompoundStatement, AbstractStatementWithArgs, assignUuidToBlock } from '@/vpl/program';
import { Block, Program, ProgramStatement, getBlockDependencies, getBlockDependents, CompoundStatement, AbstractStatementWithArgs, assignUuidToBlock } from '@/vpl/program';
import { graphicalEditorCustomEvent, statementCustomEvent } from '@/editor/editor-custom-events';
import {
  CompoundLanguageStatement,
  CompoundLanguageStatementWithArgs,
  DeviceStatement,
  EditorModal,
  Language,
  Statement,
  UnitLanguageStatementWithArgs,
} from '@/index';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { globalStyles } from '../global-styles';
import * as icons from '../icons';
import { classMap } from 'lit/directives/class-map.js';

@customElement('ge-block')
export class GeBlock extends LitElement {
  //#region Styles{{{
  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .highlighted {
        border: 2px solid var(--blue-500);
        border: 2px solid var(--blue-500);
        border: 2px solid var(--blue-500);
        background-color: var(--blue-100);
      }

      .add-new-statement-btn {
        width: fit-content;
      }

      .add-statement-tabs {
        display: flex;
      }

      .add-statement-dialog-content-wrapper {
        display: flex;
        flex-direction: column;
        height: 500px;
      }

      .statement-type-button::part(btn) {
        background-color: white;
        border: none;
        box-shadow: none;
        padding: 0.25rem;
        border-radius: 0;
      }

      .add-statements-wrapper {
        margin-top: 0.3rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .add-statement-search-field {
        font-family: var(--main-font) !important;
        box-shadow: none !important;
      }

      .add-statement-search-wrapper {
        position: sticky;
        top: 0;
        background: white;
        padding-bottom: 0.5rem;
      }

      .add-statement-search-input-wrapper {
        background: white;
        padding-bottom: 0.25rem;
      }

      .add-statement-options {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .add-statament-option-button.selected::part(btn) {
        box-shadow: rgb(99, 179, 237) 0px 0px 0px 3px;
      }

      .device-select-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      #device-select {
        width: 100%;
      }

      .device-select-label {
        padding-left: 0.25rem;
      }

      .no-available-statements {
        padding-top: 2rem;
        text-align: center;
        color: var(--gray-500);
      }
    `,
  ];//}}}
  //#endregion

  //#region Props
  @property() block: Block;
  @property() addStatementOptionsVisible: boolean = true;
  @property() addStatementOptionsFilter: string = '';
  @property() renderBasicStatements: boolean = true;
  @property() selectedDevice: string;
  @property() parentStmt: ProgramStatement;
  @property() isProcBody: boolean = false;
  @property() isExample: boolean = false;
  @property() selectedStatements: Set<string> = new Set();
  @property({ type: Boolean }) skeletonizeMode: boolean = false;
  @property({ type: Boolean }) restrainedMode: boolean = false;
  @property({ type: Boolean }) restrainedMode: boolean = false;
  @property({ type: Boolean }) isHighlighted: boolean = false;
  //#endregion

  //#region Refs
  addStatementModalRef: Ref<EditorModal> = createRef();
  deviceSelectionModalRef: Ref<EditorModal> = createRef();
  //#endregion

  //#region Context
  @consume({ context: programContext, subscribe: true })
  @property({ attribute: false })
  program?: Program;

  @consume({ context: languageContext, subscribe: true })
  @property({ attribute: false })
  language?: Language;
  //#endregion

  //#region Computed
  // NOTE: this is inefficient
  get filteredAddStatementOptions() {
    type KeysAndLabels = {
      key: string;
      label: string;
    };

    let statementKeysAndLabels: KeysAndLabels[] = [];
    let filteredStatements: {[key: string]: Statement} = {};

    for (let stmtKey in this.language.statements) {
      statementKeysAndLabels.push({ key: stmtKey, label: this.language.statements[stmtKey].label });
    }
    statementKeysAndLabels = statementKeysAndLabels.filter((stmt) => {
      const isBasic = !(this.language.statements[stmt.key] as DeviceStatement).deviceName; // NOTE: need to change this if we want to filter through all available blocks (basic+device)
      if (stmt.key.startsWith('_') || (this.isProcBody && this.language.statements[stmt.key].isUserProcedure) || this.renderBasicStatements !== isBasic) {
        return false;
      }

      if (this.parentStmt) {
        if (this.language.statements[stmt.key].parents) {
          if (!this.language.statements[stmt.key].parents.includes(this.parentStmt.id)) {
            return false;
          }
        }
        if ((this.language.statements[this.parentStmt.id] as CompoundLanguageStatement).nestedStatements) {
          if (
            !(this.language.statements[this.parentStmt.id] as CompoundLanguageStatement).nestedStatements.includes(
              stmt.key
            )
          ) {
            return false;
          }
        }
      } else {
        if (this.language.statements[stmt.key].parents) {
          return false;
        }
      }

      if (this.addStatementOptionsFilter) {
        return stmt.label.toLowerCase().includes(this.addStatementOptionsFilter.toLowerCase());
      }
      return true;
    });
    for (let stmtLabel of statementKeysAndLabels) {
      if (stmtLabel.key in this.language.statements) {
        filteredStatements[stmtLabel.key] = this.language.statements[stmtLabel.key];
      }
    }
    return filteredStatements;
  }
  //#endregion

  //#region Lifecycle
  constructor() {
    super();
    this.addEventListener(statementCustomEvent.REMOVE, (e: CustomEvent) => {
      this.handleRemoveStatement(e);
    });
    this.addEventListener(statementCustomEvent.MOVE_UP, (e: CustomEvent) => {
      this.handleMoveStatementUp(e);
    });
    this.addEventListener(statementCustomEvent.MOVE_DOWN, (e: CustomEvent) => {
      this.handleMoveStatementDown(e);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.language.deviceList) {
      this.selectedDevice = this.language.deviceList[0];
    }
  }
  //#endregion

  //#region Methods
  addNewStatement(stmtKey: string) {
    const newStatement = {
    const newStatement = {
    const newStatement = {
      type: this.language.statements[stmtKey].type,
      key: stmtKey,
      arguments: (this.language.statements[stmtKey] as UnitLanguageStatementWithArgs | CompoundLanguageStatementWithArgs)
        .arguments,
    };

    this.program.addStatement(this.block, newStatement);

    // Check if the statement is a custom user procedure
    if (this.language.statements[stmtKey].isUserProcedure) {
      const addedStmt = this.block[this.block.length - 1]; // Get the newly added statement
      console.log(`Added User Procedure - ID: ${stmtKey}, UUID: ${addedStmt._uuid}`);

      // Add entry to initializedProcedures with MetadataInit structure
      const metadataEntry = {
        uuid: addedStmt._uuid,
        id: stmtKey,
        devices: ["Pipik"], // Populate devices if available
      };
      this.program.header.initializedProcedures.push(metadataEntry);

      // Log each entry in initializedProcedures explicitly
      console.log('Updated initializedProcedures:');
      this.program.header.initializedProcedures.forEach((entry) => {
        console.log(`UUID: ${entry.uuid}, ID: ${entry.id}, Devices: ${entry.devices}`);
      });
    }
    };

    this.program.addStatement(this.block, newStatement);

    // Check if the statement is a custom user procedure
    if (this.language.statements[stmtKey].isUserProcedure) {
      const addedStmt = this.block[this.block.length - 1]; // Get the newly added statement
      const userProcedureBlock = this.program.header.userProcedures[stmtKey];

      // Use the existing logic to assign UUIDs to the user procedure block
      assignUuidToBlock(userProcedureBlock);

      console.log(`Added User Procedure - ID: ${stmtKey}, UUID: ${addedStmt._uuid}`);

      // Parse the block to populate the devices array
      const devices: [string, string][] = [];
      const parseBlockForDevices = (block: Block) => {
        block.forEach((stmt) => {
          console.log(`Parsing statement - UUID: ${stmt._uuid}, ID: ${stmt.id}`);
          
          // Check if the statement has arguments
          if ((stmt as AbstractStatementWithArgs).arguments) {
            (stmt as AbstractStatementWithArgs).arguments.forEach((arg, index) => {
              console.log(`Argument ${index}: Type = ${arg.type}, Value = ${arg.value}`);
              
              // Push the UUID of the statement and the argument value
              devices.push([stmt._uuid, String(arg.value)]);
            });
          }
      
          if (stmt.id === 'deviceType') {
            console.log(`Found device statementssssssssss - UUID: ${stmt._uuid}, ID: ${stmt.id}`);
            
            // Push the UUID of the statement and the argument value (if applicable)
            if ((stmt as AbstractStatementWithArgs).arguments?.[0]) {
              const arg = (stmt as AbstractStatementWithArgs).arguments[0];
              console.log(`Found device statement - UUID: ${stmt._uuid}, ID: ${stmt.id} with argument value: ${arg.value}`);
              devices.push([stmt._uuid, String(arg.value)]);
            }
          }
      
          if ((stmt as CompoundStatement).block) {
            parseBlockForDevices((stmt as CompoundStatement).block);
          }
        });
      };
      

      parseBlockForDevices(userProcedureBlock);

      // Add entry to initializedProcedures with MetadataInit structure
      const metadataEntry = {
        uuid: addedStmt._uuid,
        id: stmtKey,
        devices, // Devices is now a tuple array
      };
      this.program.header.initializedProcedures.push(metadataEntry);

      // Log each entry in initializedProcedures explicitly
      console.log('Updated initializedProcedures:');
      this.program.header.initializedProcedures.forEach((entry) => {
        console.log(`UUID: ${entry.uuid}, ID: ${entry.id}, Devices:`);
        entry.devices.forEach(([deviceUuid, deviceId]) => {
          console.log(`  - Device UUID: ${deviceUuid}, Device ID: ${deviceId}`);
        });
      });
    }

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
      detail: { programBodyUpdated: true },
    });
    this.dispatchEvent(event);
  }

  hideAddNewStatementDialog() {
    this.addStatementModalRef.value.hideModal();
    this.restrainedMode = false; // Set restrainedMode to false when closing the modal
    //log the restrainedMode value
    console.log('restrainedMode value:', this.restrainedMode); // Debug log
  }

  showAddNewStatementOptions() {
    this.addStatementOptionsVisible = true;
  }
  //#endregion

  //#region Handlers
  handleMoveStatementUp(e: CustomEvent) {
    if (this.skeletonizeMode) {
      e.stopPropagation();
      return; // Disable interaction when skeletonize mode is active
    }
    let statementIndex = e.detail.index;
    if (statementIndex > 0) {
      let tmpStatement = this.block[statementIndex];
      this.block[statementIndex] = this.block[statementIndex - 1];
      this.block[statementIndex - 1] = tmpStatement;
      this.requestUpdate();
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { programBodyUpdated: true },
      });
      this.dispatchEvent(event);
    }
    e.stopPropagation();
  }

  handleMoveStatementDown(e: CustomEvent) {
    if (this.skeletonizeMode) {
      e.stopPropagation();
      return; // Disable interaction when skeletonize mode is active
    }
    let statementIndex = e.detail.index;
    if (statementIndex < this.block.length - 1) {
      let tmpStatement = this.block[statementIndex];
      this.block[statementIndex] = this.block[statementIndex + 1];
      this.block[statementIndex + 1] = tmpStatement;
      this.requestUpdate();
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { programBodyUpdated: true },
      });
      this.dispatchEvent(event);
    }
    e.stopPropagation();
  }

  handleRemoveStatement(e: CustomEvent) {
    if (this.skeletonizeMode) {
      e.stopPropagation();
      return; // Disable interaction when skeletonize mode is active
    }
    let statementIndex = e.detail.index;
    const stmtToRemove = this.block[statementIndex];

    // Check if the statement is a custom user procedure
    if (this.language.statements[stmtToRemove.id]?.isUserProcedure) {
      console.log(`Removed User Procedure - ID: ${stmtToRemove.id}, UUID: ${stmtToRemove._uuid}`);

      // Remove entry from initializedProcedures
      this.program.header.initializedProcedures = this.program.header.initializedProcedures.filter(
        (entry) => entry.uuid !== stmtToRemove._uuid
      );
      console.log('Updated initializedProcedures:', this.program.header.initializedProcedures);
    }

    const stmtToRemove = this.block[statementIndex];

    // Check if the statement is a custom user procedure
    if (this.language.statements[stmtToRemove.id]?.isUserProcedure) {
      console.log(`Removed User Procedure - ID: ${stmtToRemove.id}, UUID: ${stmtToRemove._uuid}`);

      // Remove entry from initializedProcedures
      this.program.header.initializedProcedures = this.program.header.initializedProcedures.filter(
        (entry) => entry.uuid !== stmtToRemove._uuid
      );
      console.log('Updated initializedProcedures:', this.program.header.initializedProcedures);
    }

    const stmtToRemove = this.block[statementIndex];

    // Check if the statement is a custom user procedure
    if (this.language.statements[stmtToRemove.id]?.isUserProcedure) {
      console.log(`Removed User Procedure - ID: ${stmtToRemove.id}, UUID: ${stmtToRemove._uuid}`);

      // Remove entry from initializedProcedures
      this.program.header.initializedProcedures = this.program.header.initializedProcedures.filter(
        (entry) => entry.uuid !== stmtToRemove._uuid
      );
      console.log('Updated initializedProcedures:', this.program.header.initializedProcedures);
    }

    this.block.splice(statementIndex, 1);
    this.requestUpdate();
    e.stopPropagation();

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
      detail: { programBodyUpdated: true },
    });
    this.dispatchEvent(event);
  }

  handleAddNewStatement(e: Event) {
    let target = e.currentTarget as HTMLButtonElement;
    this.addNewStatementFromDialog(target.value);
  }

  private addNewStatementFromDialog(stmtKey: string) {
    this.selectedStmtIdx = 0;
    this.addStatementOptionsFilter = "";
    this.addNewStatement(stmtKey);
    this.hideAddNewStatementDialog();
    if (this.language.deviceList) {
      this.selectedDevice = this.language.deviceList[0];
    }
  }

  handleShowAddNewStatementDialog() {
    this.addStatementModalRef.value.showModal();
  }

  handleToggleAddNewStatementOptionsVisibility() {
    this.addStatementOptionsVisible = !this.addStatementOptionsVisible;
  }

  handleAddStatementFilter(e: Event) {
    this.selectedStmtIdx = 0;
    this.addStatementOptionsFilter = (e.currentTarget as HTMLInputElement).value;
  }

  handleStmtSelectKeyboard(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const maxLen = Object.keys(this.filteredAddStatementOptions).length;
      if (this.selectedStmtIdx < maxLen - 1) {
        console.log("what", maxLen, this.selectedStmtIdx)
        this.selectedStmtIdx++;
      }
    }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (this.selectedStmtIdx > 0) {
        this.selectedStmtIdx--;
      }
    }
    else if (e.key === "Enter") {
      e.preventDefault();
      const statements = this.filteredAddStatementOptions;
      const key = Object.keys(statements)[this.selectedStmtIdx];
      this.addNewStatementFromDialog(key);
    }
  }

  handleRenderBasicStatements() {
    if (!this.renderBasicStatements) {
      this.renderBasicStatements = true;
      this.addStatementOptionsFilter = '';
      this.selectedStmtIdx = 0;
    }
  }

  handleRenderDeviceStatements() {
    if (this.renderBasicStatements) {
      this.renderBasicStatements = false;
      this.addStatementOptionsFilter = '';
      this.selectedStmtIdx = 0;
    }
  }

  handleSelectedDeviceChange(e: Event) {
    this.selectedDevice = (e.currentTarget as HTMLInputElement).value;
  }

  toggleStatementSelection(stmtUuid: string, isParentClick: boolean = false) {
    console.log(`toggleStatementSelection called with UUID: ${stmtUuid}, isParentClick: ${isParentClick}`);

    const clickedBlock = this.block.find((s) => s._uuid === stmtUuid);
    if (clickedBlock && clickedBlock.id === 'deviceType') {
      console.log(`Clicked block is a deviceType statement with UUID: ${stmtUuid}`);
      if (clickedBlock._uuid !== undefined){
        this.showDeviceSelectionModal();
        console.log(`Showing device selection modal for UUID: ${stmtUuid}`);
        
      }
        
      return;
    }

    if (!this.skeletonizeMode) {
      console.log('Skeletonize mode is disabled. No action taken.');
      return;
    }

    const stmt = this.block.find((s) => s._uuid === stmtUuid);
    if (!stmt) {
      console.log(`Statement with UUID ${stmtUuid} not found.`);
      return;
    }

    // Log the corresponding entry in initializedProcedures
    const entry = this.program.header.initializedProcedures.find((entry) => entry.uuid === stmtUuid);
    if (entry) {
      //set restrainedMode to true
      this.restrainedMode = true;
      console.log(`Opening: Info about the entry - UUID: ${entry.uuid}, ID: ${entry.id}, Devices: ${entry.devices}`);
    }

    if (!this.skeletonizeMode) {
      console.log('Skeletonize mode is disabled. No action taken.');
      return;
    }
    const addedUuids: string[] = [];
    const removedUuids: string[] = [];

    const selectBlock = (stmt: ProgramStatement) => {
      if (!this.selectedStatements.has(stmt._uuid)) {
        console.log(`Selecting statement with UUID: ${stmt._uuid}`); // Log UUID when selecting
        this.requestUpdate();
        this.selectedStatements.add(stmt._uuid);
        this.program.header.skeletonize_uuid.push(stmt._uuid); // Add to skeletonize_uuid
        addedUuids.push(stmt._uuid);
      }
      if (isParentClick && (stmt as CompoundStatement).block) {
        (stmt as CompoundStatement).block.forEach(selectBlock);
      }
    };

    const deselectBlock = (stmt: ProgramStatement) => {
      if (this.selectedStatements.has(stmt._uuid)) {
        console.log(`Deselecting statement with UUID: ${stmt._uuid}`); // Log UUID when deselecting
        this.requestUpdate();
        this.selectedStatements.delete(stmt._uuid);
        this.program.header.skeletonize_uuid = this.program.header.skeletonize_uuid.filter(
          (uuid) => uuid !== stmt._uuid
        ); // Remove from skeletonize_uuid
        removedUuids.push(stmt._uuid);
      }
      if (isParentClick && (stmt as CompoundStatement).block) {
        (stmt as CompoundStatement).block.forEach(deselectBlock);
      }
    };

    if (this.selectedStatements.has(stmtUuid)) {
      deselectBlock(stmt);
    } else {
      selectBlock(stmt);
    }

    console.log('Skeletonize UUIDs:', this.program.header.skeletonize_uuid);
    if (addedUuids.length > 0) {
      console.log('Added UUIDs:', addedUuids);
    }
    if (removedUuids.length > 0) {
      console.log('Removed UUIDs:', removedUuids);
    if (!stmt) {
      console.log(`Statement with UUID ${stmtUuid} not found.`);
      return;
    }

    const addedUuids: string[] = [];
    const removedUuids: string[] = [];

    const propagateSelection = (stmt: ProgramStatement, isSelected: boolean) => {
      if (isSelected) {
        if (!this.selectedStatements.has(stmt._uuid)) {
          console.log(`Selecting statement with UUID: ${stmt._uuid}`);
          this.selectedStatements.add(stmt._uuid);
          this.program.header.skeletonize_uuid.push(stmt._uuid);
          addedUuids.push(stmt._uuid);
          this.requestUpdate();
        }
      } else {
        if (this.selectedStatements.has(stmt._uuid)) {
          console.log(`Deselecting statement with UUID: ${stmt._uuid}`);
          this.selectedStatements.delete(stmt._uuid);
          this.program.header.skeletonize_uuid = this.program.header.skeletonize_uuid.filter(
            (uuid) => uuid !== stmt._uuid
          );
          removedUuids.push(stmt._uuid);
          this.requestUpdate();
        }
      }

      if ((stmt as CompoundStatement).block) {
        (stmt as CompoundStatement).block.forEach((childStmt) => propagateSelection(childStmt, isSelected));
      }
    };

    const isSelected = !this.selectedStatements.has(stmtUuid);
    propagateSelection(stmt, isSelected);

    console.log('Skeletonize UUIDs:', this.program.header.skeletonize_uuid);
    if (addedUuids.length > 0) {
      console.log('Added UUIDs:', addedUuids);
    }
    if (removedUuids.length > 0) {
      console.log('Removed UUIDs:', removedUuids);
    }

    this.requestUpdate(); // Trigger UI rerender
    this.requestUpdate(); // Trigger UI rerender
  }

  showDeviceSelectionModal() {
    this.deviceSelectionModalRef.value.showModal();
  }

  handleDeviceStatementSelected(stmtKey: string) {
    console.log(`Selected device statement: ${stmtKey}`);
    this.deviceSelectionModalRef.value.hideModal();
    // Add logic to handle the selected statement
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('skeletonizeMode') && !this.skeletonizeMode) {
      this.selectedStatements.clear();statementCustomEvent
      this.selectedStatements.clear();statementCustomEvent
      this.requestUpdate();
    }
    if (changedProperties.has('restrainedMode')) {
      console.log('restrainedMode updated:', this.restrainedMode); // Debug log
    }
  }
  //#endregion

  //#region Templates
  addStatementButtonTemplate() {
    return html`
      ${!this.skeletonizeMode && !this.restrainedMode // Hide button in restrained mode
        ? html`
            <editor-button
              @click="${this.handleShowAddNewStatementDialog}"
              title="Add Statement"
              class="add-new-statement-btn">
              <editor-icon .icon="${icons['plusLg']}"></editor-icon>
            </editor-button>
          `
        : nothing}
    `;
  }

  statementsTemplate() {
    return html`
      ${repeat(
        this.block,
        (stmt) => stmt._uuid,
        (stmt, i) =>
          html`
            <ge-statement
              class="${this.selectedStatements.has(stmt._uuid) ? 'highlighted' : ''}"
              class="${this.selectedStatements.has(stmt._uuid) ? 'highlighted' : ''}" 
              .statement="${stmt}"
              .index="${i}"
              .isProcBody="${this.isProcBody}"
              .isProcBody="${this.isProcBody}"
              .isProcBody="${this.isProcBody}"
              .isExample="${this.isExample}"
              .skeletonizeMode="${this.skeletonizeMode}"
              .restrainedMode="${this.restrainedMode}"
              @click="${(e: Event) => {
                e.stopPropagation();
                console.log(`Block clicked: UUID ${stmt._uuid}`);
                this.toggleStatementSelection(stmt._uuid, true);
              }}"
              @nested-click="${(e: CustomEvent) => {
                e.stopPropagation();
                console.log(`Nested block clicked: UUID ${e.detail.uuid}`);
                this.toggleStatementSelection(e.detail.uuid, false);
              }}">
              .restrainedMode="${this.restrainedMode}"
              .isSelected="${this.selectedStatements.has(stmt._uuid)}"
              @click="${(e: Event) => {
                e.stopPropagation();
                console.log(`Block clicked: UUID ${stmt._uuid}`);
                this.toggleStatementSelection(stmt._uuid, true);
              }}"
              @nested-click="${(e: CustomEvent) => {
                e.stopPropagation();
                console.log(`Nested block clicked: UUID ${e.detail.uuid}`);
                this.toggleStatementSelection(e.detail.uuid, false);
              }}">
            </ge-statement>
          `
      )}
    `;
  }

  addStatementOptionTemplate(stmtKey: string, idx: number = 0) {
    // const isSelected = (this.selectedStmtKey === null && idx === 0) || stmtKey === this.selectedStmtKey;
    const isSelected = this.selectedStmtIdx === idx;

    return html`
      <editor-button
        .value="${stmtKey}"
        @click="${this.handleAddNewStatement}"
        .title="${stmtKey}"
        class="add-statament-option-button ${classMap({ selected: isSelected })}"
        btnStyle="${`color: ${this.language.statements[stmtKey].foregroundColor}; background-color: ${this.language.statements[stmtKey].backgroundColor}`}">
        <editor-icon .icon="${icons[this.language.statements[stmtKey].icon]}"></editor-icon>
        <span>${this.language.statements[stmtKey].label}</span>
      </editor-button>
    `;
  }

  addStatementOptionsTemplate() {
    return html`
      <div class="add-statement-options">
        ${Object.keys(this.filteredAddStatementOptions).length
          ? Object.keys(this.filteredAddStatementOptions).map((stmtKey, idx) => {
              if (!(this.language.statements[stmtKey] as DeviceStatement).deviceName) {
                return this.addStatementOptionTemplate(stmtKey, idx);
              }
            })
          : html`<div class="no-available-statements">No available statements</div>`}
      </div>
    `;
  }

  deviceStatementsTemplate() {
    return html`
      ${this.devicesTemplate()}
      <div class="add-statement-options">
        ${Object.keys(this.filteredAddStatementOptions).length > 0
          ? Object.keys(this.filteredAddStatementOptions).map((stmtKey, idx) => {
              return (this.language.statements[stmtKey] as DeviceStatement).deviceName === this.selectedDevice
                ? this.addStatementOptionTemplate(stmtKey, idx)
                : nothing;
            })
          : html`<div class="no-available-device-statements">No available device statements</div>`}
      </div>
    `;
  }

  basicStatementsTemplate() {
    return html`${this.addStatementOptionsVisible ? this.addStatementOptionsTemplate() : nothing}`;
  }

  devicesTemplate() {
    return html`
      <div class="device-select-wrapper">
        <label for="device-select" class="device-select-label">Device</label>
        <select id="device-select" .value=${this.selectedDevice} @change="${this.handleSelectedDeviceChange}">
          ${this.language.deviceList.map((deviceName) => {
            return html` <option value="${deviceName}">${deviceName}</option> `;
          })}
        </select>
      </div>
    `;
  }

  addStatementModalTemplate() {
    return html`
      <editor-modal ${ref(this.addStatementModalRef)} .modalTitle="${'Add New Statement'}" class="add-statement-modal">
        <div class="add-statement-dialog-content-wrapper">
          <div class="add-statement-search-wrapper">
            <div class="add-statement-search-input-wrapper">
              <input
                @keydown="${this.handleStmtSelectKeyboard}"
                autofocus
                type="text"
                placeholder="Search"
                .value="${this.addStatementOptionsFilter}"
                @input="${this.handleAddStatementFilter}"
                class="add-statement-search-field" />
            </div>
            <div class="add-statement-tabs">
              <editor-button
                class="statement-type-button"
                @click="${this.handleRenderBasicStatements}"
                style="${this.renderBasicStatements
                  ? 'border-bottom: 2px solid var(--blue-500)'
                  : 'border-bottom: 2px solid white'}">
                Basic statements
              </editor-button>
                  : 'border-bottom: 2px solid white'}">
                Basic statements
              </editor-button>
                  : 'border-bottom: 2px solid white'}">
                Basic statements
              </editor-button>
              <editor-button
                class="statement-type-button"
                @click="${this.handleRenderDeviceStatements}"
                style="${!this.renderBasicStatements
                  ? 'border-bottom: 2px solid var(--blue-500)'
                  : 'border-bottom: 2px solid white'}">
                Device statements
              </editor-button>
                  : 'border-bottom: 2px solid white'}">
                Device statements
              </editor-button>
                  : 'border-bottom: 2px solid white'}">
                Device statements
              </editor-button>
            </div>
          </div>
          <div class="add-statements-wrapper">
            ${this.renderBasicStatements ? this.basicStatementsTemplate() : this.deviceStatementsTemplate()}
          </div>
        </div>
      </editor-modal>
    `;
  }

  render() {
    return html`
      ${this.isExample
        ? html`${this.statementsTemplate()}`
        : html`${this.statementsTemplate()} ${this.addStatementButtonTemplate()} ${this.addStatementModalTemplate()}`}
      <editor-modal ${ref(this.deviceSelectionModalRef)} .modalTitle="${'Select Device Statement'}">
        <div class="device-selection-modal-content">
          ${Object.keys(this.filteredAddStatementOptions).map((stmtKey) => {
            const statement = this.language.statements[stmtKey];
            return html`
              <editor-button
                @click="${() => this.handleDeviceStatementSelected(stmtKey)}"
                style="color: ${statement.foregroundColor}; background-color: ${statement.backgroundColor};">
                <editor-icon .icon="${icons[statement.icon]}"></editor-icon>
                <span>${statement.label}</span>
              </editor-button>
            `;
          })}
        </div>
      </editor-modal>
    `;
  }
  //#endregion
}
