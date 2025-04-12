import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { Block, Program, ProgramStatement, CompoundStatement, AbstractStatementWithArgs, assignUuidToBlock, DeviceMetadata, MetadataInit, initDefaultArgumentType } from '@/vpl/program';
import { graphicalEditorCustomEvent, statementCustomEvent } from '@/editor/editor-custom-events';
import {
  CompoundLanguageStatement,
  CompoundLanguageStatementWithArgs,
  DeviceStatement,
  EditorModal,
  Language,
  UnitLanguageStatementWithArgs,
} from '@/index';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { globalStyles } from '../global-styles';
import * as icons from '../icons';


@customElement('ge-block')
export class GeBlock extends LitElement {
  //#region Styles
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
        background-color: var(--blue-100);
      }

      .add-new-statement-btn {
        width: fit-content;
        align-self: flex-end;
      }

      .add-statement-tabs {
        display: flex;
      }

      .add-statement-dialog-content-wrapper {
        display: flex;
        flex-direction: column;
        height: 500px;
      }

      .statement-type-button {
        background-color: white;
        border: none;
        box-shadow: none;
        padding: 0.25rem;
        border-radius: 0;
      }

      .add-statements-wrapper {
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

      .add-statament-option-button {
        display: flex;
        gap: 0.25rem;
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
  ];
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
  @property({ type: Boolean }) isHighlighted: boolean = false;
  @property() filteredDeviceStatements: string[] = [];
  @property() tmpUUID :string = '';
  @property() parentProcedureUuid: string; // Add property to store the UUID
  @property() clickedBlockDeviceInit: string='';
  @property() editorMode: 'edit' | 'initialize' = 'edit'; // Mode for the editor: edit or initialize
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
  get filteredAddStatementOptions() {
    type KeysAndLabels = {
      key: string;
      label: string;
    };

    let statementKeysAndLabels: KeysAndLabels[] = [];
    let filteredStatements = {};

    for (let stmtKey in this.language.statements) {
      statementKeysAndLabels.push({ key: stmtKey, label: this.language.statements[stmtKey].label });
    }
    statementKeysAndLabels = statementKeysAndLabels.filter((stmt) => {
      if (stmt.key.startsWith('_') || (this.isProcBody && this.language.statements[stmt.key].isUserProcedure)) {
        return false;
      }
      if(stmt.key === 'deviceType'){
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
    //this.tmpUUID = '';
  }
  //   if (this.parentProcedureUuid) {
  //     console.log(`Parent Procedure UUID: ${this.parentProcedureUuid}`); // Debugging log

  //     // Log the entry from initializedProcedures for the parentProcedureUuid
  //     const metadataEntry = this.program.header.initializedProcedures.find(
  //       (entry) => entry.uuid === this.parentProcedureUuid
  //     );
  //     if (metadataEntry) {
  //       console.log(`Metadata entry for UUID ${this.parentProcedureUuid}:`, metadataEntry);
  //     } else {
  //       console.warn(`No metadata entry found for UUID: ${this.parentProcedureUuid}`);
  //     }
  //   }
  // }
  //#endregion

  //#region Methods
  //----------------------------------------
  addNewStatement(stmtKey: string) {
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
      const userProcedureBlock = this.program.header.userProcedures[stmtKey];
      // Use the existing logic to assign UUIDs to the user procedure block
      assignUuidToBlock(userProcedureBlock);

      console.log(`Added User Procedure - ID: ${stmtKey}, UUID: ${addedStmt._uuid}`);


      // Parse the block to populate the devices array
      const devices: DeviceMetadata[] = [];
      const parseBlockForDevices = (block: Block) => {
        block.forEach((stmt) => {
          console.log(`Parsing statement - UUID: ${stmt._uuid}, ID: ${stmt.id}`);
          // if ((stmt as AbstractStatementWithArgs).arguments) {
          //   (stmt as AbstractStatementWithArgs).arguments.forEach((arg, index) => {
          //     console.log(`Argument ${index}: Type = ${arg.type}, Value = ${arg.value}`);

          //     // Push the UUID of the statement and the argument value
          //     devices.push({
          //       uuid: stmt._uuid,
          //       deviceId: String(arg.value),
          //       statement: stmt,
          //     });
          //   });
          // }

          // Check for device statements (either deviceType or actual device statements)
          const deviceName = stmt.id.split('.')[0];
          const isDeviceStatement = stmt.id === 'deviceType' || this.language.deviceList.includes(deviceName);

          if (isDeviceStatement) {
            console.log(`Found device statement - UUID: ${stmt._uuid}, ID: ${stmt.id}`);

            if (stmt.id === 'deviceType' && (stmt as AbstractStatementWithArgs).arguments?.[0]) {
              // For deviceType statements, use the argument value as the deviceId
              const arg = (stmt as AbstractStatementWithArgs).arguments[0];
              console.log(`Device statement with argument value: ${arg.value}`);

              devices.push({
                uuid: stmt._uuid,
                deviceId: String(arg.value),
                statement: stmt,
                value: undefined // Will be set when a value is selected
              });
            } else if (this.language.deviceList.includes(deviceName)) {
              // For actual device statements, use the statement ID as the deviceId
              console.log(`Found device statement with ID: ${stmt.id}`);

              // Get the language statement definition to ensure correct argument structure
              const deviceStatement = {
                ...stmt,
                arguments: []
              };

              // If the language statement has arguments, initialize them properly
              const langStatement = this.language.statements[stmt.id];
              if (langStatement && (langStatement as UnitLanguageStatementWithArgs).arguments) {
                const argDefs = (langStatement as UnitLanguageStatementWithArgs).arguments;

                // Initialize each argument with the correct type and default value
                argDefs.forEach((argDef, index) => {
                  const newArg = {
                    type: argDef.type,
                    value: null
                  };

                  // Set default value based on type
                  if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                    newArg.value = argDef.options[0].id;
                  } else {
                    newArg.value = initDefaultArgumentType(argDef.type);
                  }

                  // Use existing argument value if available
                  if ((stmt as AbstractStatementWithArgs).arguments &&
                      (stmt as AbstractStatementWithArgs).arguments[index]) {
                    newArg.value = (stmt as AbstractStatementWithArgs).arguments[index].value;
                  }

                  // Add the argument to the statement
                  deviceStatement.arguments.push(newArg);
                });
              }

              devices.push({
                uuid: stmt._uuid,
                deviceId: stmt.id,
                statement: deviceStatement,
                value: undefined // Will be set when a value is selected
              });
            }
          }
          if ((stmt as CompoundStatement).block) {
            parseBlockForDevices((stmt as CompoundStatement).block);
          }
        });
      };
      parseBlockForDevices(userProcedureBlock);

      const newEntry: MetadataInit = {
        uuid: addedStmt._uuid,
        id: stmtKey,
        devices: devices, // Store complete device statements
      };
      this.program.header.initializedProcedures.push(newEntry);
      //print all initializedProcedures and their conent
      console.log('Updated initializedProcedures:', this.program.header.initializedProcedures);

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
    this.addNewStatement(target.value);
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
    this.addStatementOptionsFilter = (e.currentTarget as HTMLInputElement).value;
  }

  handleRenderBasicStatements() {
    if (!this.renderBasicStatements) {
      this.renderBasicStatements = true;
      this.addStatementOptionsFilter = '';
    }
  }

  handleRenderDeviceStatements() {
    if (this.renderBasicStatements) {
      this.renderBasicStatements = false;
      this.addStatementOptionsFilter = '';
    }
  }

  handleSelectedDeviceChange(e: Event) {
    this.selectedDevice = (e.currentTarget as HTMLInputElement).value;
  }
//----------------------------------
  toggleStatementSelection(stmtUuid: string, isParentClick: boolean = false) {
    console.log(`toggleStatementSelection called with UUID: ${stmtUuid}, isParentClick: ${isParentClick}`);

    const clickedBlock = this.block.find((s) => s._uuid === stmtUuid);

    if (clickedBlock) {
      console.log(`Clicked block:`, clickedBlock.id);
      const deviceName = clickedBlock?.id.split('.')[0];
      //if device name in device list, set var true
      var isDevice = false;
      if (this.language.deviceList.includes(deviceName)) { isDevice = true; }

      // Handle device selection in initialize mode
      // Only show device selection modal if the click is directly on the statement (isParentClick=true)
      // This prevents the modal from opening when clicking on dropdowns or inputs inside the statement
      if ((clickedBlock.id === 'deviceType' || isDevice) && this.editorMode === 'initialize' && isParentClick) {
        console.log(`Clicked block is a deviceType statement with UUID: ${stmtUuid} in initialize mode`);
        this.clickedBlockDeviceInit = stmtUuid;
        if (clickedBlock._uuid !== undefined) {
          this.showDeviceSelectionModal(clickedBlock);
          console.log(`Showing device selection modal for UUID: ${stmtUuid}`);
          return; // Exit early after showing device selection modal
        }
      }
    }

    // In initialize mode with restrainedMode, don't allow any other interactions
    if (this.editorMode === 'initialize' && this.restrainedMode) {
      console.log('In initialize mode with restrainedMode. No other actions taken.');
      return;
    }

    // For skeletonize mode
    if (!this.skeletonizeMode) {
      console.log('Skeletonize mode is disabled. No selection action taken.');
      return;
    }

    const stmt = this.block.find((s) => s._uuid === stmtUuid);
    if (!stmt) {
      console.log(`Statement with UUID ${stmtUuid} not found.`);
      return;
    }

    // For invalid blocks, we still want to process their nested blocks
    if (stmt.isInvalid) {
      console.log(`Found invalid block with UUID: ${stmt._uuid} - will process its nested blocks`);
      // Don't return here - we'll process nested blocks but not select the invalid block itself
    }

    const addedUuids: string[] = [];
    const removedUuids: string[] = [];

    const propagateSelection = (stmt: ProgramStatement, isSelected: boolean) => {
      // For invalid blocks, we still want to process their nested blocks
      // but we don't select the invalid block itself
      const isInvalid = stmt.isInvalid;

      if (isInvalid) {
        console.log(`Found invalid block during propagation with UUID: ${stmt._uuid}`);
        // Don't return here - continue to process nested blocks
      }

      // Only select/deselect the statement if it's not invalid
      if (!isInvalid) {
        if (isSelected) {
          if (!this.selectedStatements.has(stmt._uuid)) {
            console.log(`Selecting statement with UUID: ${stmt._uuid}`);
            this.selectedStatements.add(stmt._uuid);
            this.program.header.skeletonize_uuid.push(stmt._uuid);
            addedUuids.push(stmt._uuid);
          }
        } else {
          if (this.selectedStatements.has(stmt._uuid)) {
            console.log(`Deselecting statement with UUID: ${stmt._uuid}`);
            this.selectedStatements.delete(stmt._uuid);
            this.program.header.skeletonize_uuid = this.program.header.skeletonize_uuid.filter(
              (uuid) => uuid !== stmt._uuid
            );
            removedUuids.push(stmt._uuid);
          }
        }
      }

      // Always process nested blocks, even for invalid blocks
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

    // Dispatch a custom event to notify all components about the skeletonize selection change
    const selectionEvent = new CustomEvent('skeletonize-selection-changed', {
      bubbles: true,
      composed: true,
      detail: {
        skeletonizeUuids: this.program.header.skeletonize_uuid,
        addedUuids,
        removedUuids
      }
    });
    this.dispatchEvent(selectionEvent);

    // Also dispatch a program updated event to ensure all components are in sync
    const programEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
      detail: { skeletonizeUpdated: true }
    });
    this.dispatchEvent(programEvent);

    this.requestUpdate(); // Trigger UI rerender
  }

  //----------------------------------
  showDeviceSelectionModal(clickedBlock: ProgramStatement) {
    // Store the clicked block UUID for later use
    this.clickedBlockDeviceInit = clickedBlock._uuid;
    console.log(`Storing clicked block UUID: ${clickedBlock._uuid} for device selection`);

    this.filteredDeviceStatements = Object.keys(this.language.statements).filter((stmtKey) => {
      const statement = this.language.statements[stmtKey];
      return statement.group !== 'logic' && statement.group !== 'loop' && statement.group !== 'variable' && statement.group !== 'misc' && statement.group !== 'internal'
        && statement.label !== 'Send Notification' && statement.label !== 'DeviceType';

    });
    this.deviceSelectionModalRef.value.showModal();
  }

  //this---------------------------------------
  handleDeviceStatementSelected(stmtKey: string) {
    console.log(`UUID of the clicked block: ${this.clickedBlockDeviceInit} Selected device statement: ${stmtKey}`);
    this.deviceSelectionModalRef.value.hideModal();

    const clickedBlock = this.block.find((stmt) => stmt._uuid === this.clickedBlockDeviceInit);
    if (clickedBlock) {
      console.log(`Replacing deviceType block with selected statement: ${stmtKey}`);
      const selectedStatement = {
        ...this.language.statements[stmtKey],
        id: stmtKey,
        _uuid: clickedBlock._uuid, // Retain the UUID of the original block
      };
      const index = this.block.indexOf(clickedBlock);
      if (index !== -1) {
        this.block[index] = selectedStatement;

        // Debugging log to confirm block replacement
        console.log(`Block at index ${index} replaced with selected statement:`, selectedStatement);

        // Log the UUID of the user procedure being displayed
        console.log(`User Procedure UUID being displayeddddd:d ${this.tmpUUID}`);
        //check is clickedBlock is in the initializedProcedures array



        // Ensure UI updates with the new tmpUUID
        this.requestUpdate();

        // Notify other components about the device selection change
        const deviceSelectionEvent = new CustomEvent('device-selection-changed', {
          bubbles: true,
          composed: true,
          detail: {
            deviceUuid: clickedBlock._uuid,
            procedureUuid: this.tmpUUID,
            selectedDeviceId: stmtKey
          }
        });
        this.dispatchEvent(deviceSelectionEvent);

        // Update the metadata entry in the initializedProcedures array
        const metadataEntry = this.program.header.initializedProcedures.find(
          (entry) => entry.uuid === this.tmpUUID
        );

        if (metadataEntry) {
          console.log(`Found metadata entry for UUID: ${this.clickedBlockDeviceInit}`, metadataEntry);

          // Find the device metadata entry for the clicked block
          const deviceEntry = metadataEntry.devices.find(device => device.uuid === clickedBlock._uuid);
          if (deviceEntry) {
            // Update the device ID in the metadata
            deviceEntry.deviceId = stmtKey;

            // Update the complete statement in the metadata with the correct argument structure
            // Get the language statement definition to get the correct argument structure
            const langStatement = this.language.statements[stmtKey];

            // Create a proper statement with the correct argument structure
            deviceEntry.statement = {
              ...selectedStatement,
              arguments: []
            };

            // If the language statement has arguments, initialize them properly
            if (langStatement && (langStatement as UnitLanguageStatementWithArgs).arguments) {
              const argDefs = (langStatement as UnitLanguageStatementWithArgs).arguments;

              // Initialize each argument with the correct type and default value
              argDefs.forEach(argDef => {
                const newArg = {
                  type: argDef.type,
                  value: null
                };

                // Set default value based on type
                if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                  newArg.value = argDef.options[0].id;
                } else {
                  newArg.value = initDefaultArgumentType(argDef.type);
                }

                // Add the argument to the statement
                (deviceEntry.statement as AbstractStatementWithArgs).arguments.push(newArg);
              });
            }

            console.log(`Device statement selected: ${stmtKey}`);
            console.log(`Updated device metadata:`, deviceEntry);

            // Clear any previously set value
            if (deviceEntry.value) {
              deviceEntry.value = undefined;
              console.log(`Cleared previous value in device metadata`);
            }
          } else {
            console.warn(`No device metadata entry found for UUID: ${clickedBlock._uuid}`);
          }
        } else {
          console.warn(`No metadata entry found for UUID: ${this.tmpUUID}`);
        }

        this.requestUpdate();
        const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
          bubbles: true,
          composed: true,
          detail: { programBodyUpdated: true },
        });
        this.dispatchEvent(event);
      } else {
        console.warn(`Clicked block not found in the block array.`);
      }
    }
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('skeletonizeMode') && !this.skeletonizeMode) {
      this.selectedStatements.clear();

      // Dispatch event to notify other components about cleared selection
      const event = new CustomEvent('skeletonize-selection-changed', {
        bubbles: true,
        composed: true,
        detail: { skeletonizeUuids: this.program.header.skeletonize_uuid }
      });
      this.dispatchEvent(event);

      this.requestUpdate();
    }
  }
  //#endregion

  //#region Templates
  addStatementButtonTemplate() {
    // Don't show add statement button in skeletonize mode or initialize mode with restrainedMode
    return html`
      ${!this.skeletonizeMode && !(this.editorMode === 'initialize' && this.restrainedMode)
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
              .statement="${stmt}"
              .index="${i}"
              .isProcBody="${this.isProcBody}"
              .isExample="${this.isExample}"
              .skeletonizeMode="${this.skeletonizeMode}"
              .restrainedMode="${this.restrainedMode || (this.editorMode === 'initialize')}"
              .isSelected="${this.selectedStatements.has(stmt._uuid)}"
              .uuidMetadata="${this.tmpUUID}"
              .editorMode="${this.editorMode}"
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

  addStatementOptionTemplate(stmtKey: string) {
    return html`
      <editor-button
        .value="${stmtKey}"
        @click="${this.handleAddNewStatement}"
        .title="${stmtKey}"
        class="add-statament-option-button"
        style="${`color: ${this.language.statements[stmtKey].foregroundColor}; background-color: ${this.language.statements[stmtKey].backgroundColor}`}">
        <editor-icon .icon="${icons[this.language.statements[stmtKey].icon]}"></editor-icon>
        <span>${this.language.statements[stmtKey].label}</span>
      </editor-button>
    `;
  }

  addStatementOptionsTemplate() {
    return html`
      <div class="add-statement-options">
        ${Object.keys(this.filteredAddStatementOptions).length > 0
          ? Object.keys(this.filteredAddStatementOptions).map((stmtKey) => {
              if (!(this.language.statements[stmtKey] as DeviceStatement).deviceName) {
                return this.addStatementOptionTemplate(stmtKey);
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
          ? Object.keys(this.filteredAddStatementOptions).map((stmtKey) => {
              return (this.language.statements[stmtKey] as DeviceStatement).deviceName === this.selectedDevice
                ? this.addStatementOptionTemplate(stmtKey)
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
                type="text"
                placeholder="Search"
                .value="${this.addStatementOptionsFilter}"
                @input="${this.handleAddStatementFilter}"
                class="add-statement-search-field" />
            </div>
            <div class="add-statement-tabs">
              <editor-button
                class="statement-type-button basic-statement-button"
                @click="${this.handleRenderBasicStatements}"
                style="${this.renderBasicStatements
                  ? 'border-bottom: 2px solid var(--blue-500)'
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
          ${this.filteredDeviceStatements.map((stmtKey) => {
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
