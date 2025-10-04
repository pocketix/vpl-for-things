import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { Block, Program, ProgramStatement, CompoundStatement, AbstractStatementWithArgs, assignUuidToBlock, DeviceMetadata, initDefaultArgumentType } from '@/vpl/program';
import { graphicalEditorCustomEvent, statementCustomEvent, deviceMetadataCustomEvent } from '@/editor/editor-custom-events';
import {
  CompoundLanguageStatement,
  CompoundLanguageStatementWithArgs,
  DeviceStatement,
  EditorModal,
  GraphicalEditor,
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

      .highlight-active {
        box-shadow: 0 0 10px 2px rgba(255, 255, 0, 0.8); /* Highlight effect */
        border: 2px solid rgba(255, 255, 0, 0.8);
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
        padding: 0.25rem;
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

      /* Device Selection Modal Styles */
      .device-selection-modal-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        height: 500px;
        color: black;
        padding: 0;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
      }

      /* Style for the dialog element to control width */
      .device-selection-modal dialog {
        width: 75%;
        min-width: 400px;
        height: 600px;
        max-height: 600px;
        box-sizing: border-box;
        min-height: 600px;
      }

      /* Fix the width of the search input container */
      .search-container {
        width: 100%;
        box-sizing: border-box;
      }

      .device-search-input {
        width: 100%;
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid var(--gray-500);
        font-family: var(--main-font);
        margin-bottom: 0.75rem;
        background-color: white;
        color: black;
        font-size: 1rem;
        box-sizing: border-box;
      }

      .device-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .device-section-header {
        font-size: 1.25rem;
        font-weight: bold;
        color: black;
        margin-bottom: 0.25rem;
      }

      .device-section-divider {
        height: 1px;
        background-color: var(--gray-500);
        margin: 0.25rem 0;
      }

      .device-buttons-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-left: 0.5rem;
        overflow-y: auto;
      }

      .no-devices-message {
        color: var(--gray-700);
        text-align: center;
        padding: 1rem 0;
      }
    `,
  ];
  //#endregion

  //#region Props
  @property() block: Block;
  @property() addStatementOptionsVisible: boolean = true;
  @property() addStatementOptionsFilter: string = '';
  @property() selectedTab: 'basic' | 'procedures' | 'riot' = 'basic';
  @property() selectedDevice: string;
  @property() parentStmt: ProgramStatement;
  @property() isProcBody: boolean = false;
  @property() isExample: boolean = false;
  @property() selectedStatements: Set<string> = new Set();
  @property({ type: Boolean }) skeletonizeMode: boolean = false;
  @property({ type: Boolean }) restrainedMode: boolean = false;
  @property({ type: Boolean }) isHighlighted: boolean = false;
  @property() filteredDeviceStatements: string[] = [];
  @property() deviceSearchInput: string = '';
  @property() recommendedDeviceStatements: string[] = [];
  @property() otherDeviceStatements: string[] = [];
  @property() tmpUUID :string = '';
  @property() parentProcedureUuid: string; // Add property to store the UUID
  @property() clickedBlockDeviceInit: string='';
  @property() editorMode: 'edit' | 'initialize' = 'edit'; // Mode for the editor: edit or initialize
  @property({ type: Boolean }) isUserProcedureEditing: boolean = false; // Flag to indicate if we're editing a user procedure
  @property({ type: Object }) procedureDeviceIndices: Map<string, number> = new Map(); // Device indices for the entire procedure (passed down from parent)
  @property({ type: Object }) uuidMapping: Map<string, string> = new Map(); // UUID mapping from parent procedure

  // Configuration for statement categories
  static statementCategories = {
    // Statements that appear only in the Riot statements tab
    riotOnly: ['setvar', 'alert'],

    // Statements that should be excluded from device selection
    excludeFromDeviceSelection: ['deviceType', 'alert'],

    // Statements that are available ONLY in user procedures (not in main body)
    procedureOnlyStatements: ['deviceType'],

    // Statements that are available in user procedures
    availableInUserProcedures: ['deviceType', 'setvar', 'alert'],

    // Basic statement blocks (control flow, etc.)
    basicBlocks: ['if', 'elseif', 'else', 'switch', 'case', 'repeat', 'while'],

    // User procedures (will be dynamically populated)
    userProcedures: []
  };
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
      // Filter out internal statements and user procedures when in procedure body
      if (stmt.key.startsWith('_') || (this.isProcBody && this.language.statements[stmt.key].isUserProcedure)) {
        return false;
      }

      // Handle procedure-only statements (like deviceType)
      if (GeBlock.statementCategories.procedureOnlyStatements.includes(stmt.key)) {
        // Only show these statements in user procedures and in the Riot statements tab
        return this.isProcBody && this.selectedTab === 'riot';
      }

      // Handle statements that should only appear in Riot statements tab
      if (GeBlock.statementCategories.riotOnly.includes(stmt.key)) {
        // Only show these statements in the Riot statements tab (not in Basic statements)
        return this.selectedTab === 'riot';
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

  //#region Utility Methods
  /**
   * Helper function to get device index by position in a procedure block
   * This ensures consistent index-based device management across the application
   */
  private getDeviceIndexByPosition(procedureBlock: any[], targetUuid: string): number {
    let deviceIndex = 0;

    // Recursive function to traverse the block structure depth-first
    const traverseBlock = (block: any[]): number => {
      for (const stmt of block) {
        // Check if this is a device statement
        if (stmt.id === 'deviceType' || (stmt.id && this.language?.deviceList?.includes(stmt.id.split('.')[0]))) {
          if (stmt._uuid === targetUuid) {
            console.log(`Found target device at index ${deviceIndex}`);
            return deviceIndex;
          }
          console.log(`Device ${deviceIndex}: ${stmt.id} (UUID: ${stmt._uuid})`);
          deviceIndex++;
        }

        // Recursively traverse nested blocks (depth-first)
        if (stmt.block && Array.isArray(stmt.block)) {
          const result = traverseBlock(stmt.block);
          if (result !== -1) return result;
        }
      }
      return -1;
    };

    console.log('Calculating device index for UUID:', targetUuid);
    console.log('Procedure block structure:', procedureBlock);
    const result = traverseBlock(procedureBlock);
    console.log('Final device index result:', result);
    return result;
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

    // Listen for program updates to refresh user procedures list
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, () => {
      this.updateUserProceduresList();
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.language.deviceList) {
      this.selectedDevice = this.language.deviceList[0];
    }

    // Populate user procedures list
    this.updateUserProceduresList();

    // If we're in a procedure body and the selected tab is 'procedures', switch to 'basic'
    if (this.isProcBody && this.selectedTab === 'procedures') {
      this.selectedTab = 'basic';
    }
  }

  // Update the list of user procedures in the statementCategories
  updateUserProceduresList() {
    if (!this.language?.statements) return;

    // Clear the existing list
    GeBlock.statementCategories.userProcedures = [];

    // Find all user procedures in the language statements
    for (const stmtKey in this.language.statements) {
      if (this.language.statements[stmtKey].isUserProcedure) {
        GeBlock.statementCategories.userProcedures.push(stmtKey);
      }
    }
  }
  //#endregion

  //#region Methods

  addNewStatement(stmtKey: string) {
    const newStatement = {
      type: this.language.statements[stmtKey].type,
      key: stmtKey,
      arguments: (this.language.statements[stmtKey] as UnitLanguageStatementWithArgs | CompoundLanguageStatementWithArgs)
        .arguments,
    };

    this.program.addStatement(this.block, newStatement);
    const addedStmt = this.block[this.block.length - 1];



    if (this.language.statements[stmtKey].isUserProcedure) {
      const userProcedureBlock = this.program.header.userProcedures[stmtKey];
      assignUuidToBlock(userProcedureBlock);

      const devices: DeviceMetadata[] = [];
      const parseBlockForDevices = (block: Block) => {
        block.forEach((stmt) => {
          const deviceName = stmt.id.split('.')[0];
          const isDeviceStatement = stmt.id === 'deviceType' || this.language.deviceList.includes(deviceName);

          if (isDeviceStatement) {
            if (stmt.id === 'deviceType' ) {
              const arg = (stmt as AbstractStatementWithArgs).arguments[0];
              devices.push({
                deviceId: String(arg.value),
                values: [String(arg.value)],
              });
            } else if (this.language.deviceList.includes(deviceName)) {
              const deviceStatement = {
                ...stmt,
                arguments: []
              };
              const langStatement = this.language.statements[stmt.id];
              const deviceValues: string[] = [];

              if (langStatement && (langStatement as UnitLanguageStatementWithArgs).arguments) {
                const argDefs = (langStatement as UnitLanguageStatementWithArgs).arguments;

                argDefs.forEach((argDef, index) => {
                  const newArg = {
                    type: argDef.type,
                    value: null
                  };

                  if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                    newArg.value = argDef.options[0].id;
                    deviceValues.push(String(argDef.options[0].id));
                  } else {
                    newArg.value = initDefaultArgumentType(argDef.type);
                    deviceValues.push(String(newArg.value));
                  }
                  if ((stmt as AbstractStatementWithArgs).arguments &&
                      (stmt as AbstractStatementWithArgs).arguments[index]) {
                    newArg.value = (stmt as AbstractStatementWithArgs).arguments[index].value;
                    deviceValues[index] = String(newArg.value);
                  }
                  deviceStatement.arguments.push(newArg);
                });
              }

              devices.push({
                deviceId: stmt.id,
                values: deviceValues
              });
            }
          }
          if ((stmt as CompoundStatement).block) {
            parseBlockForDevices((stmt as CompoundStatement).block);
          }
        });
      };
      parseBlockForDevices(userProcedureBlock);

      addedStmt.devices = devices;
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
      return;
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
      return;
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
      return;
    }
    let statementIndex = e.detail.index;

    // Get the statement to be removed
    const statementToRemove = this.block[statementIndex];

    // Check if it's a device type block or a device statement
    if (statementToRemove) {
      const isDeviceBlock = statementToRemove.id === 'deviceType';
      const deviceName = statementToRemove.id.split('.')[0];
      const isDeviceStatement = this.language.deviceList?.includes(deviceName);

      if (isDeviceBlock || isDeviceStatement) {
        // Find the metadata entry recursively through the program structure
        const findMetadataEntry = (block: any[], targetUuid: string): any => {
          // First check if the entry is in this block
          const directEntry = block.find(stmt => stmt._uuid === targetUuid);
          if (directEntry) return directEntry;

          // If not found directly, search in nested blocks
          for (const stmt of block) {
            if (stmt.block && Array.isArray(stmt.block)) {
              const nestedEntry = findMetadataEntry(stmt.block, targetUuid);
              if (nestedEntry) return nestedEntry;
            }
          }

          return null;
        };

        // First try to find the metadata entry using the tmpUUID
        let metadataEntry = findMetadataEntry(this.program.block, this.tmpUUID);

        // If not found and we have a parent procedure UUID, try that
        if (!metadataEntry && this.parentProcedureUuid) {
          metadataEntry = findMetadataEntry(this.program.block, this.parentProcedureUuid);
        }

        // Remove the device entry from the metadata using index-based approach
        if (metadataEntry && metadataEntry.devices) {
          // Find the procedure block to get the correct device index
          const procedureBlock = this.tmpUUID ?
            this.program.header.userProcedures[metadataEntry.id] :
            (this.parentProcedureUuid ? this.program.header.userProcedures[metadataEntry.id] : null);

          if (procedureBlock) {
            const deviceIndex = this.getDeviceIndexByPosition(procedureBlock, statementToRemove._uuid);
            if (deviceIndex !== -1 && deviceIndex < metadataEntry.devices.length) {
              // Remove the device at the specific index
              metadataEntry.devices.splice(deviceIndex, 1);
            }
          }
        }

        // Also clean up the main program's devices array using index-based approach
        // Recursively search through all blocks in the program to find and clean up device entries
        const cleanupDevicesInBlock = (block: any[]) => {
          if (!block || !Array.isArray(block)) return;

          // Check if this block has a devices array
          for (const stmt of block) {
            if (stmt.devices && Array.isArray(stmt.devices)) {
              // For statements with devices arrays, we need to find the correct index to remove
              // This is more complex as we need to determine which device entry corresponds to the removed statement
              // For now, we'll keep the devices array as-is since the index-based system should handle this
              // through the metadata entry cleanup above
            }

            // Recursively check nested blocks
            if (stmt.block && Array.isArray(stmt.block)) {
              cleanupDevicesInBlock(stmt.block);
            }
          }
        };

        // Start the cleanup from the program's root block
        cleanupDevicesInBlock(this.program.block);
      }
    }

    // Remove the statement from the block
    this.block.splice(statementIndex, 1);
    this.requestUpdate();
    e.stopPropagation();

    // Dispatch program updated event
    const programUpdatedEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
      detail: { programBodyUpdated: true },
    });
    this.dispatchEvent(programUpdatedEvent);

    // Dispatch a specific event to update device counts in all ge-statement components
    const updateDeviceCountsEvent = new CustomEvent('update-device-counts', {
      bubbles: true,
      composed: true,
      detail: { procedureUuid: this.parentProcedureUuid || this.tmpUUID }
    });
    this.dispatchEvent(updateDeviceCountsEvent);
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
    if (this.selectedTab !== 'basic') {
      this.selectedTab = 'basic';
      this.addStatementOptionsFilter = '';
    }
  }

  handleRenderProceduresStatements() {
    if (this.selectedTab !== 'procedures') {
      this.selectedTab = 'procedures';
      this.addStatementOptionsFilter = '';
    }
  }

  handleRenderDeviceStatements() {
    if (this.selectedTab !== 'riot') {
      this.selectedTab = 'riot';
      this.addStatementOptionsFilter = '';
    }
  }

  handleSelectedDeviceChange(e: Event) {
    this.selectedDevice = (e.currentTarget as HTMLInputElement).value;
  }

  toggleStatementSelection(stmtUuid: string, isParentClick: boolean = false) {
    const clickedBlock = this.block.find((s) => s._uuid === stmtUuid);

    if (clickedBlock) {
      const deviceName = clickedBlock?.id.split('.')[0];
      var isDevice = false;
      if (this.language.deviceList.includes(deviceName)) { isDevice = true; }

      // Handle device selection for both main program and nested procedure blocks
      if (isDevice && (this.editorMode === 'initialize' || this.isProcBody) && isParentClick) {
        // Allow device selection for device blocks in both initialize and edit modes
        this.clickedBlockDeviceInit = stmtUuid;
        if (clickedBlock._uuid !== undefined) {
          this.showDeviceSelectionModal(clickedBlock);
          return;
        }
      } else if (clickedBlock.id === 'deviceType' && this.editorMode === 'initialize' && isParentClick) {
        // Only allow device type selection in initialize mode, not in edit mode
        this.clickedBlockDeviceInit = stmtUuid;
        if (clickedBlock._uuid !== undefined) {
          this.showDeviceSelectionModal(clickedBlock);
          return;
        }
      }
    }
    if (!this.skeletonizeMode) {
      return;
    }

    const stmt = this.block.find((s) => s._uuid === stmtUuid);
    const addedUuids: string[] = [];
    const removedUuids: string[] = [];


    const propagateSelection = (stmt: ProgramStatement, isSelected: boolean) => {
      const isInvalid = stmt.isInvalid;
      if (!isInvalid) {
        if (isSelected) {
          if (!this.selectedStatements.has(stmt._uuid)) {
            this.selectedStatements.add(stmt._uuid);
            this.program.header.skeletonize_uuid.push(stmt._uuid);
            addedUuids.push(stmt._uuid);
          }
        } else {
          if (this.selectedStatements.has(stmt._uuid)) {
            this.selectedStatements.delete(stmt._uuid);
            this.program.header.skeletonize_uuid = this.program.header.skeletonize_uuid.filter(
              (uuid) => uuid !== stmt._uuid
            );
            removedUuids.push(stmt._uuid);
          }
        }
      }

      if ((stmt as CompoundStatement).block) {
        (stmt as CompoundStatement).block.forEach((childStmt) => propagateSelection(childStmt, isSelected));
      }
    };

    const isSelected = !this.selectedStatements.has(stmtUuid);
    propagateSelection(stmt, isSelected);

    const highlightEvent = new CustomEvent('update-highlight-state', {
      bubbles: true,
      composed: true,
      detail: {
        skeletonizeUuids: this.program.header.skeletonize_uuid,
        forceUpdate: true
      }
    });
    this.dispatchEvent(highlightEvent);

    const updateNestedBlocks = (element: Element) => {
      if (element.shadowRoot) {
        const statements = element.shadowRoot.querySelectorAll('ge-statement');
        statements.forEach(stmt => {
          const uuid = stmt.getAttribute('uuid');
          if (uuid && this.program.header.skeletonize_uuid.includes(uuid)) {
            (stmt as any).isHighlighted = true;
            updateNestedBlocks(stmt);
          }
        });
      }
    };

    updateNestedBlocks(document.documentElement);

    const programEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
      detail: { skeletonizeUpdated: true }
    });
    this.dispatchEvent(programEvent);

    this.requestUpdate();
  }


  showDeviceSelectionModal(clickedBlock: ProgramStatement) {
    this.clickedBlockDeviceInit = clickedBlock._uuid;
    this.deviceSearchInput = '';

    // Get all device statements
    const allDeviceStatements = Object.keys(this.language.statements).filter((stmtKey) => {
      const statement = this.language.statements[stmtKey];

      // If the clicked block is a deviceType, make sure deviceType is included in the options
      if (clickedBlock.id === 'deviceType' && stmtKey === 'deviceType') {
        return true;
      }

      // Filter out non-device groups and statements that should be excluded
      return statement.group !== 'logic' && statement.group !== 'loop' && statement.group !== 'variable' && statement.group !== 'misc' && statement.group !== 'internal'
        && !GeBlock.statementCategories.excludeFromDeviceSelection.includes(stmtKey);
    });

    // Find the device type of the clicked block if it's a deviceType statement
    let selectedDeviceType = '';
    if (clickedBlock.id === 'deviceType' && (clickedBlock as AbstractStatementWithArgs).arguments?.[0]) {
      selectedDeviceType = String((clickedBlock as AbstractStatementWithArgs).arguments[0].value);
    }

    // Categorize devices into recommended and other based on device type
    this.categorizeDeviceStatements(allDeviceStatements, selectedDeviceType);

    // Set filtered statements to all statements initially
    this.filteredDeviceStatements = allDeviceStatements;

    this.deviceSelectionModalRef.value.showModal();
  }

  categorizeDeviceStatements(deviceStatements: string[], selectedDeviceType: string) {
    this.recommendedDeviceStatements = [];
    this.otherDeviceStatements = [];

    deviceStatements.forEach(stmtKey => {
      // Special handling for deviceType statement
      if (stmtKey === 'deviceType') {
        // Always put deviceType in the Other category
        this.otherDeviceStatements.push(stmtKey);
        return;
      }

      const deviceName = stmtKey.split('.')[0];
      const deviceType = this.language.deviceListWithTypes[deviceName];

      if (deviceType === selectedDeviceType && selectedDeviceType !== '') {
        this.recommendedDeviceStatements.push(stmtKey);
      } else {
        this.otherDeviceStatements.push(stmtKey);
      }
    });
  }

  handleDeviceSearchInput(e: Event) {
    this.deviceSearchInput = (e.currentTarget as HTMLInputElement).value;
    const searchTerm = this.deviceSearchInput.toLowerCase();

    // Helper function to find block recursively
    const findBlockRecursively = (block: any[], targetUuid: string): any => {
      for (const stmt of block) {
        if (stmt._uuid === targetUuid) {
          return stmt;
        }
        if (stmt.block && Array.isArray(stmt.block)) {
          const found = findBlockRecursively(stmt.block, targetUuid);
          if (found) return found;
        }
      }
      return null;
    };

    // Find the clicked block recursively
    const clickedBlock = findBlockRecursively(this.block, this.clickedBlockDeviceInit);

    // Filter all device statements based on search input
    const allDeviceStatements = Object.keys(this.language.statements).filter((stmtKey) => {
      const statement = this.language.statements[stmtKey];

      // If the clicked block is a deviceType, make sure deviceType is included in the options
      if (clickedBlock && clickedBlock.id === 'deviceType' && stmtKey === 'deviceType') {
        return true;
      }

      // Filter out non-device groups and statements that should be excluded
      return statement.group !== 'logic' && statement.group !== 'loop' && statement.group !== 'variable' && statement.group !== 'misc' && statement.group !== 'internal'
        && !GeBlock.statementCategories.excludeFromDeviceSelection.includes(stmtKey);
    });

    // Filter based on search term
    if (searchTerm) {
      this.filteredDeviceStatements = allDeviceStatements.filter(stmtKey => {
        const statement = this.language.statements[stmtKey];
        return statement.label.toLowerCase().includes(searchTerm);
      });
    } else {
      this.filteredDeviceStatements = allDeviceStatements;
    }

    // Find the device type of the clicked block if it's a deviceType statement
    let selectedDeviceType = '';
    if (clickedBlock && clickedBlock.id === 'deviceType' && (clickedBlock as AbstractStatementWithArgs).arguments?.[0]) {
      selectedDeviceType = String((clickedBlock as AbstractStatementWithArgs).arguments[0].value);
    }

    // Recategorize filtered statements
    this.categorizeDeviceStatements(this.filteredDeviceStatements, selectedDeviceType);
  }


  private updateDevicesArrayForSelectedDevice(stmtKey: string): void {
    // Find the metadata entry recursively through the program structure
    const findMetadataEntry = (block: any[], targetUuid: string): any => {
      console.log('Searching for metadata entry with UUID:', targetUuid, 'in block:', block);

      // First check if the entry is in this block
      const directEntry = block.find(stmt => stmt._uuid === targetUuid);
      if (directEntry) {
        console.log('Found direct metadata entry:', directEntry);
        return directEntry;
      }

      // If not found directly, search in nested blocks
      for (const stmt of block) {
        if (stmt.block && Array.isArray(stmt.block)) {
          const nestedEntry = findMetadataEntry(stmt.block, targetUuid);
          if (nestedEntry) return nestedEntry;
        }
      }

      console.log('No metadata entry found for UUID:', targetUuid);
      return null;
    };

    // First try to find the metadata entry using the tmpUUID
    console.log('Looking for metadata entry with tmpUUID:', this.tmpUUID);
    console.log('Program block structure:', this.program.block);
    let metadataEntry = findMetadataEntry(this.program.block, this.tmpUUID);

    // If not found and we have a parent procedure UUID, try that
    if (!metadataEntry && this.parentProcedureUuid) {
      metadataEntry = findMetadataEntry(this.program.block, this.parentProcedureUuid);
    }

    if (metadataEntry) {
      // Ensure the devices array exists
      if (!metadataEntry.devices) {
        metadataEntry.devices = [];
      }

      const procedureBlock = this.tmpUUID ?
        this.program.header.userProcedures[metadataEntry.id] :
        (this.parentProcedureUuid ? this.program.header.userProcedures[metadataEntry.id] : null);

      if (procedureBlock) {
        const deviceIndex = this.getDeviceIndexByPosition(procedureBlock, this.clickedBlockDeviceInit);

        if (deviceIndex !== -1) {
          // Ensure the devices array has enough entries
          while (metadataEntry.devices.length <= deviceIndex) {
            metadataEntry.devices.push({
              deviceId: 'deviceType',
              values: ['']
            });
          }

          const langStatement = this.language.statements[stmtKey];
          const defaultValues: string[] = [];

          if (langStatement && (langStatement as UnitLanguageStatementWithArgs).arguments) {
            const argDefs = (langStatement as UnitLanguageStatementWithArgs).arguments;

            argDefs.forEach(argDef => {
              let defaultValue: string;
              if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                defaultValue = String(argDef.options[0].id);
              } else {
                defaultValue = String(initDefaultArgumentType(argDef.type));
              }
              defaultValues.push(defaultValue);
            });
          }

          metadataEntry.devices[deviceIndex] = {
            deviceId: stmtKey,
            values: defaultValues
          };

          console.log('Updated devices array:', metadataEntry.devices);
        }
      }
    }
  }

  private replaceAllDeviceTypesInProcedure(stmtKey: string): boolean {
    // Get the metadata entry to access the devices array
    const findMetadataEntry = (block: any[], targetUuid: string): any => {
      const directEntry = block.find(stmt => stmt._uuid === targetUuid);
      if (directEntry) return directEntry;

      for (const stmt of block) {
        if (stmt.block && Array.isArray(stmt.block)) {
          const nestedEntry = findMetadataEntry(stmt.block, targetUuid);
          if (nestedEntry) return nestedEntry;
        }
      }
      return null;
    };

    let metadataEntry = findMetadataEntry(this.program.block, this.tmpUUID);
    if (!metadataEntry && this.parentProcedureUuid) {
      metadataEntry = findMetadataEntry(this.program.block, this.parentProcedureUuid);
    }

    if (!metadataEntry || !metadataEntry.devices) {
      console.log('No metadata entry or devices array found');
      return false;
    }

    const procedureBlock = this.tmpUUID ?
      this.program.header.userProcedures[metadataEntry.id] :
      (this.parentProcedureUuid ? this.program.header.userProcedures[metadataEntry.id] : null);

    if (!procedureBlock) {
      console.log('No procedure block found');
      return false;
    }

    // Now traverse the entire procedure and replace all deviceType statements
    // Use a shared counter that persists across all recursive calls
    const replacementState = {
      deviceIndex: 0,
      replacementsMade: false
    };

    const replaceDeviceTypesInBlock = (block: any[], parentContext: string = 'root'): void => {
      console.log(`\n=== Processing block at ${parentContext} ===`);
      console.log(`Block has ${block.length} statements`);
      console.log(`Current device index: ${replacementState.deviceIndex}`);

      for (let i = 0; i < block.length; i++) {
        const stmt = block[i];
        const currentContext = `${parentContext}[${i}]`;
        console.log(`\n--- Processing statement ${currentContext}: ${stmt.id} (UUID: ${stmt._uuid}) ---`);

        // Check if this statement itself is a device statement FIRST
        // This matches the order in getDeviceIndexByPosition
        if (stmt.id === 'deviceType' || (stmt.id && this.language?.deviceList?.includes(stmt.id.split('.')[0]))) {
          console.log(`Found device statement at ${currentContext}, device index ${replacementState.deviceIndex}: ${stmt.id}`);

          if (replacementState.deviceIndex < metadataEntry.devices.length) {
            const deviceData = metadataEntry.devices[replacementState.deviceIndex];
            console.log(`Device data for index ${replacementState.deviceIndex}:`, deviceData);

            if (deviceData.deviceId !== 'deviceType' && deviceData.deviceId !== '') {
              // Replace this statement with the actual device statement
              const selectedStatement = this.language.statements[deviceData.deviceId];
              if (selectedStatement) {
                console.log(`✅ Replacing device at ${currentContext} (index ${replacementState.deviceIndex}) with ${deviceData.deviceId}`);
                console.log('Original statement:', stmt);

                // Preserve the UUID and replace the statement
                const originalUuid = stmt._uuid;
                Object.keys(stmt).forEach(key => {
                  if (key !== '_uuid') {
                    delete stmt[key];
                  }
                });

                Object.assign(stmt, selectedStatement, {
                  id: deviceData.deviceId,
                  _uuid: originalUuid
                });

                console.log('✅ Replaced statement:', stmt);
                replacementState.replacementsMade = true;
              }
            } else {
              console.log(`⏭️ Skipping replacement at ${currentContext} - deviceId is '${deviceData.deviceId}'`);
            }
          } else {
            console.log(`⚠️ Device index ${replacementState.deviceIndex} is out of bounds (max: ${metadataEntry.devices.length - 1})`);
          }
          replacementState.deviceIndex++;
        }

        // Then recursively process nested blocks (depth-first)
        if (stmt.block && Array.isArray(stmt.block)) {
          console.log(`🔄 Entering nested block in ${currentContext} (${stmt.id}) with ${stmt.block.length} children`);
          const beforeNestedIndex = replacementState.deviceIndex;
          replaceDeviceTypesInBlock(stmt.block, `${currentContext}.${stmt.id}`);
          const afterNestedIndex = replacementState.deviceIndex;
          console.log(`🔄 Exited nested block ${currentContext}.${stmt.id}, device index went from ${beforeNestedIndex} to ${afterNestedIndex}`);
        }
      }

      console.log(`=== Finished processing block at ${parentContext}, final device index: ${replacementState.deviceIndex} ===\n`);
    };

    console.log('Starting complete procedure replacement with devices:', metadataEntry.devices);
    console.log('this.block before replacement:', JSON.stringify(this.block, null, 2));

    // Update this.block (the current instance), not procedureBlock (the template)
    replaceDeviceTypesInBlock(this.block, 'procedure-root');

    console.log('this.block after replacement:', JSON.stringify(this.block, null, 2));
    console.log('Replacement complete, replacements made:', replacementState.replacementsMade);

    // Force a complete re-render by dispatching events and requesting update
    if (replacementState.replacementsMade) {
      // Dispatch program updated event to notify parent components
      const programUpdatedEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { programBodyUpdated: true },
      });
      this.dispatchEvent(programUpdatedEvent);

      // Dispatch device selection event
      const deviceSelectionEvent = new CustomEvent('device-selection-changed', {
        bubbles: true,
        composed: true,
        detail: {
          deviceUuid: this.clickedBlockDeviceInit,
          procedureUuid: this.tmpUUID || this.parentProcedureUuid,
          selectedDeviceId: stmtKey,
          forceRerender: true
        }
      });
      this.dispatchEvent(deviceSelectionEvent);

      // Force re-render of this component
      this.requestUpdate();
    }

    return replacementState.replacementsMade;
  }

  handleDeviceStatementSelected(stmtKey: string) {
    this.deviceSelectionModalRef.value.hideModal();

    console.log('Device statement selected:', stmtKey);
    console.log('Target UUID:', this.clickedBlockDeviceInit);
    console.log('Current block structure:', this.block);

    // First, update the devices array with the selected device
    this.updateDevicesArrayForSelectedDevice(stmtKey);

    // Then, replace all deviceType statements in the entire procedure with their corresponding devices
    const wasReplaced = this.replaceAllDeviceTypesInProcedure(stmtKey);

    if (wasReplaced) {
      console.log('Statement replacement successful, triggering UI update');
      console.log('Current block structure after replacement:', JSON.stringify(this.block, null, 2));

      // Find the metadata entry recursively through the program structure
      const findMetadataEntry = (block: any[], targetUuid: string): any => {
        console.log('Searching for metadata entry with UUID:', targetUuid, 'in block:', block);

        // First check if the entry is in this block
        const directEntry = block.find(stmt => stmt._uuid === targetUuid);
        if (directEntry) {
          console.log('Found direct metadata entry:', directEntry);
          return directEntry;
        }

        // If not found directly, search in nested blocks
        for (const stmt of block) {
          if (stmt.block && Array.isArray(stmt.block)) {
            const nestedEntry = findMetadataEntry(stmt.block, targetUuid);
            if (nestedEntry) return nestedEntry;
          }
        }

        console.log('No metadata entry found for UUID:', targetUuid);
        return null;
      };

      // First try to find the metadata entry using the tmpUUID
      console.log('Looking for metadata entry with tmpUUID:', this.tmpUUID);
      console.log('Program block structure:', this.program.block);
      let metadataEntry = findMetadataEntry(this.program.block, this.tmpUUID);

      // If not found and we have a parent procedure UUID, try that
      if (!metadataEntry && this.parentProcedureUuid) {
        metadataEntry = findMetadataEntry(this.program.block, this.parentProcedureUuid);
      }

      if (metadataEntry) {
        // Ensure the devices array exists
        if (!metadataEntry.devices) {
          metadataEntry.devices = [];
        }

        const procedureBlock = this.tmpUUID ?
          this.program.header.userProcedures[metadataEntry.id] :
          (this.parentProcedureUuid ? this.program.header.userProcedures[metadataEntry.id] : null);

        if (procedureBlock) {
          const deviceIndex = this.getDeviceIndexByPosition(procedureBlock, this.clickedBlockDeviceInit);
          
          if (deviceIndex !== -1) {
            // Ensure the devices array has enough entries
            while (metadataEntry.devices.length <= deviceIndex) {
              metadataEntry.devices.push({
                deviceId: 'deviceType',
                values: ['']
              });
            }

            const langStatement = this.language.statements[stmtKey];
            const defaultValues: string[] = [];

            if (langStatement && (langStatement as UnitLanguageStatementWithArgs).arguments) {
              const argDefs = (langStatement as UnitLanguageStatementWithArgs).arguments;

              argDefs.forEach(argDef => {
                let defaultValue: string;
                if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                  defaultValue = String(argDef.options[0].id);
                } else {
                  defaultValue = String(initDefaultArgumentType(argDef.type));
                }
                defaultValues.push(defaultValue);
              });
            }

            metadataEntry.devices[deviceIndex] = {
              deviceId: stmtKey,
              values: defaultValues
            };
            const reparseEvent = new CustomEvent(deviceMetadataCustomEvent.REOPEN_PROCEDURE_MODAL, {
              bubbles: true,
              composed: true,
              detail: { 
                procedureUuid: this.tmpUUID || this.parentProcedureUuid
              }
            });
            this.dispatchEvent(reparseEvent);
            this.requestUpdate();
          }
        }
      }  

      // Dispatch program updated event
      const programUpdatedEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { programBodyUpdated: true },
      });
      this.dispatchEvent(programUpdatedEvent);
      this.requestUpdate();

      // Dispatch a specific event to update device counts in all ge-statement components
      const updateDeviceCountsEvent = new CustomEvent('update-device-counts', {
        bubbles: true,
        composed: true,
        detail: { procedureUuid: this.parentProcedureUuid || this.tmpUUID }
      });
      this.dispatchEvent(updateDeviceCountsEvent);
      
    }

    // Dispatch custom event to reopen the user procedure initialization modal
    const reopenModalEvent = new CustomEvent(deviceMetadataCustomEvent.REOPEN_PROCEDURE_MODAL, {
      bubbles: true,
      composed: true,
      detail: {
        procedureUuid: this.tmpUUID
      }
    });
    this.dispatchEvent(reopenModalEvent);
    
  }


  //#region Lifecycle
  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('skeletonizeMode') && !this.skeletonizeMode) {
      this.selectedStatements.clear();

      const event = new CustomEvent('skeletonize-selection-changed', {
        bubbles: true,
        composed: true,
        detail: { skeletonizeUuids: this.program.header.skeletonize_uuid }
      });
      this.dispatchEvent(event);

      this.requestUpdate();
    }

    // Update user procedures list when program or language changes
    if (changedProperties.has('program') || changedProperties.has('language')) {
      this.updateUserProceduresList();
    }

    // If isProcBody changed and we're now in a procedure body, make sure we're not on the procedures tab
    if (changedProperties.has('isProcBody') && this.isProcBody && this.selectedTab === 'procedures') {
      this.selectedTab = 'basic';
    }
  }
  //#endregion

  //#region Templates
  addStatementButtonTemplate() {
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
    // Add defensive checks
    if (!this.block || !Array.isArray(this.block) || !this.program || !this.program.header) {
      return html`<div class="error-statements">Error: Invalid block or program data</div>`;
    }

    // Ensure skeletonize_uuid exists
    const skeletonizeUuids = this.program.header.skeletonize_uuid || [];

    // Use device indices - either calculate them (if top-level) or use passed-down indices
    let deviceIndices = new Map<string, number>();

    if (this.editorMode === 'initialize') {
      if (this.procedureDeviceIndices.size > 0) {
        // Use the device indices passed down from the parent procedure
        deviceIndices = this.procedureDeviceIndices;
      } else if (this.tmpUUID) {
        // This is the root procedure block, calculate all device indices for the entire procedure
        const sharedState = { deviceIndex: 0 };

        const calculateAllDeviceIndices = (block: any[]) => {
          for (const stmt of block) {
            if (stmt.id === 'deviceType' || (stmt.id && this.language?.deviceList?.includes(stmt.id.split('.')[0]))) {
              if (stmt._uuid) {
                deviceIndices.set(stmt._uuid, sharedState.deviceIndex);
                sharedState.deviceIndex++;
              }
            }

            if (stmt.block && Array.isArray(stmt.block)) {
              calculateAllDeviceIndices(stmt.block);
            }
          }
        };

        calculateAllDeviceIndices(this.block);
      }
    }

    return html`
      ${repeat(
        this.block,
        (stmt) => stmt._uuid || '',
        (stmt, i) =>
          html`
            <ge-statement
              .statement="${stmt}"
              .index="${i}"
              .deviceIndex="${deviceIndices.get(stmt._uuid || '') ?? -1}"
              .isProcBody="${this.isProcBody}"
              .isExample="${this.isExample}"
              .skeletonizeMode="${this.skeletonizeMode}"
              .restrainedMode="${this.restrainedMode || (this.editorMode === 'initialize')}"
              .isSelected="${stmt._uuid ? this.selectedStatements.has(stmt._uuid) : false}"
              .isHighlighted="${stmt._uuid ? skeletonizeUuids.includes(stmt._uuid) : false}"
              .uuidMetadata="${this.tmpUUID}"
              .editorMode="${this.editorMode}"
              .procedureDeviceIndices="${deviceIndices}"
              @click="${(e: Event) => {
                e.stopPropagation();
                if (stmt._uuid) {
                  this.toggleStatementSelection(stmt._uuid, true);
                }
              }}"
              @nested-click="${(e: CustomEvent) => {
                e.stopPropagation();
                if (e.detail && e.detail.uuid) {
                  this.toggleStatementSelection(e.detail.uuid, false);
                }
              }}">
            </ge-statement>
          `
      )}
    `;
  }

  addStatementOptionTemplate(stmtKey: string) {
    // Add defensive checks
    if (!stmtKey || !this.language || !this.language.statements || !this.language.statements[stmtKey]) {
      return html`<div class="error-statement-option">Error: Unknown statement type: ${stmtKey}</div>`;
    }

    const statement = this.language.statements[stmtKey];
    const foregroundColor = statement.foregroundColor || '#ffffff';
    const backgroundColor = statement.backgroundColor || '#cccccc';
    const icon = statement.icon && icons[statement.icon] ? icons[statement.icon] : icons.questionCircle;
    const label = statement.label || stmtKey;

    return html`
      <editor-button
        .value="${stmtKey}"
        @click="${this.handleAddNewStatement}"
        .title="${stmtKey}"
        class="add-statament-option-button"
        style="${`color: ${foregroundColor}; background-color: ${backgroundColor}`}">
        <editor-icon .icon="${icon}"></editor-icon>
        <span>${label}</span>
      </editor-button>
    `;
  }

  // This method is no longer used directly - kept for backward compatibility
  addStatementOptionsTemplate() {
    return html`
      <div class="add-statement-options">
        <div class="no-available-statements">Please use the categorized statement templates</div>
      </div>
    `;
  }

  deviceStatementsTemplate() {
    // Filter statements based on search input
    const filterStatement = (stmtKey: string): boolean => {
      if (!this.language.statements[stmtKey]) return false;

      // If there's a search filter, check if the statement label matches
      if (this.addStatementOptionsFilter) {
        return this.language.statements[stmtKey].label
          .toLowerCase()
          .includes(this.addStatementOptionsFilter.toLowerCase());
      }

      return true;
    };

    // Filter the Riot statements
    const filteredRiotStatements = GeBlock.statementCategories.riotOnly.filter(filterStatement);

    // Filter the procedure-only statements
    const filteredProcedureOnlyStatements = this.isProcBody ?
      GeBlock.statementCategories.procedureOnlyStatements.filter(filterStatement) : [];

    // Check if we have any Riot statements to show
    const hasRiotStatements = filteredRiotStatements.length > 0 || filteredProcedureOnlyStatements.length > 0;

    // Create the Riot statements section based on context
    const riotStatementsTemplate = html`
      ${hasRiotStatements ? html`
        <div class="add-statement-options">
          <!-- Show filtered regular Riot statements -->
          ${filteredRiotStatements.map(stmtKey =>
            this.addStatementOptionTemplate(stmtKey)
          )}

          <!-- Only show filtered procedure-only statements when in a procedure body -->
          ${this.isProcBody && filteredProcedureOnlyStatements.length > 0 ?
            filteredProcedureOnlyStatements.map(stmtKey =>
              this.addStatementOptionTemplate(stmtKey)
            )
            : nothing
          }
        </div>
      ` : html`
        <div class="no-available-statements">No matching Riot statements found</div>
      `}
    `;

    // If we're editing a user procedure, only show Riot statements
    if (this.isProcBody) {
      return html`
        <div class="device-section-header">Riot Statements</div>
        <div class="device-section-divider"></div>
        ${riotStatementsTemplate}
      `;
    }

    // For regular editing, filter device statements
    const deviceStatements = Object.keys(this.filteredAddStatementOptions).filter(stmtKey => {
      return (this.language.statements[stmtKey] as DeviceStatement).deviceName === this.selectedDevice &&
        filterStatement(stmtKey);
    });

    const hasDeviceStatements = deviceStatements.length > 0;

    // For regular editing, show both Device statements and Riot statements (Device statements first)
    return html`
      <div class="device-section-header">Device Statements</div>
      <div class="device-section-divider"></div>
      ${this.devicesTemplate()}
      <div class="add-statement-options">
        ${hasDeviceStatements
          ? deviceStatements.map(stmtKey => this.addStatementOptionTemplate(stmtKey))
          : html`<div class="no-available-device-statements">No matching device statements</div>`}
      </div>

      <div class="device-section-header" style="margin-top: 1rem;">Riot Statements</div>
      <div class="device-section-divider"></div>
      ${riotStatementsTemplate}
    `;
  }

  basicStatementsTemplate() {
    // Filter statements based on search input
    const filterStatement = (stmtKey: string): boolean => {
      if (!this.language.statements[stmtKey]) return false;

      // If there's a search filter, check if the statement label matches
      if (this.addStatementOptionsFilter) {
        return this.language.statements[stmtKey].label
          .toLowerCase()
          .includes(this.addStatementOptionsFilter.toLowerCase());
      }

      return true;
    };

    // Filter the basic blocks
    const filteredBasicBlocks = GeBlock.statementCategories.basicBlocks.filter(filterStatement);

    // Check if we have any results to show
    const hasResults = filteredBasicBlocks.length > 0;

    return html`
      ${this.addStatementOptionsVisible ? html`
        ${hasResults ? html`
          <!-- Basic Blocks Section -->
          <div class="add-statement-options">
            <div class="device-section-header">Basic Blocks</div>
            <div class="device-section-divider"></div>
            ${filteredBasicBlocks.map(stmtKey => this.addStatementOptionTemplate(stmtKey))}
          </div>
        ` : html`
          <div class="no-available-statements">No matching statements found</div>
        `}
      ` : nothing}
    `;
  }

  proceduresStatementsTemplate() {
    // Make sure user procedures list is up to date
    this.updateUserProceduresList();

    // Filter statements based on search input
    const filterStatement = (stmtKey: string): boolean => {
      if (!this.language.statements[stmtKey]) return false;

      // If there's a search filter, check if the statement label matches
      if (this.addStatementOptionsFilter) {
        return this.language.statements[stmtKey].label
          .toLowerCase()
          .includes(this.addStatementOptionsFilter.toLowerCase());
      }

      return true;
    };

    // Filter the user procedures
    const filteredUserProcedures = !this.isProcBody ?
      GeBlock.statementCategories.userProcedures.filter(filterStatement) : [];

    // Check if we have any results to show
    const hasResults = filteredUserProcedures.length > 0;

    return html`
      ${this.addStatementOptionsVisible ? html`
        ${hasResults ? html`
          <!-- User Procedures Section -->
          <div class="add-statement-options">
            <div class="device-section-header">Procedures</div>
            <div class="device-section-divider"></div>
            ${filteredUserProcedures.map(stmtKey => this.addStatementOptionTemplate(stmtKey))}
          </div>
        ` : html`
          <div class="no-available-statements">No matching procedures found</div>
        `}
      ` : nothing}
    `;
  }

  devicesTemplate() {
    // Add defensive checks
    if (!this.language || !this.language.deviceList || !Array.isArray(this.language.deviceList)) {
      return html`<div class="error-devices">Error: No devices available</div>`;
    }

    // If device list is empty, show a message
    if (this.language.deviceList.length === 0) {
      return html`<div class="no-devices-message">No devices available</div>`;
    }

    // Ensure selectedDevice is set to a valid device
    if (!this.selectedDevice || !this.language.deviceList.includes(this.selectedDevice)) {
      this.selectedDevice = this.language.deviceList[0];
    }

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
                style="${this.selectedTab === 'basic'
                  ? 'border-bottom: 2px solid var(--blue-500)'
                  : 'border-bottom: 2px solid white'}">
                Basic statements
              </editor-button>
              ${!this.isProcBody ? html`
                <editor-button
                  class="statement-type-button"
                  @click="${this.handleRenderProceduresStatements}"
                  style="${this.selectedTab === 'procedures'
                    ? 'border-bottom: 2px solid var(--blue-500)'
                    : 'border-bottom: 2px solid white'}">
                  Procedures
                </editor-button>
              ` : nothing}
              <editor-button
                class="statement-type-button"
                @click="${this.handleRenderDeviceStatements}"
                style="${this.selectedTab === 'riot'
                  ? 'border-bottom: 2px solid var(--blue-500)'
                  : 'border-bottom: 2px solid white'}">
                Riot statements
              </editor-button>
            </div>
          </div>
          <div class="add-statements-wrapper">
            ${this.selectedTab === 'basic'
              ? this.basicStatementsTemplate()
              : this.selectedTab === 'procedures' && !this.isProcBody
                ? this.proceduresStatementsTemplate()
                : this.deviceStatementsTemplate()}
          </div>
        </div>
      </editor-modal>
    `;
  }

  render() {
    // Add defensive checks to prevent errors
    if (!this.language || !this.program) {
      return html`<div class="error-block">Error: Missing language or program context</div>`;
    }

    // Check if block is defined
    if (!this.block || !Array.isArray(this.block)) {
      return html`<div class="error-block">Error: Invalid block data</div>`;
    }

    return html`
      ${this.isExample
        ? html`${this.statementsTemplate()}`
        : html`${this.statementsTemplate()} ${this.addStatementButtonTemplate()} ${this.addStatementModalTemplate()}`}
      <editor-modal ${ref(this.deviceSelectionModalRef)} .modalTitle="${'Select Device Statement'}" class="device-selection-modal">
        <div class="device-selection-modal-content">
          <div style="padding: 1rem; height: 500px; overflow-y: auto;">
            <!-- Search bar -->
            <div class="search-container">
              <input
                type="text"
                placeholder="Search"
                class="device-search-input"
                .value="${this.deviceSearchInput}"
                @input="${this.handleDeviceSearchInput}" />
            </div>

            <!-- Recommended section -->
            ${this.recommendedDeviceStatements.length > 0 ? html`
              <div class="device-section">
                <div class="device-section-header">Recomended</div>
                <div class="device-section-divider"></div>
                <div class="device-buttons-container">
                  ${this.recommendedDeviceStatements.map((stmtKey) => {
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
              </div>
            ` : nothing}

            <!-- Other section -->
            ${this.otherDeviceStatements.length > 0 ? html`
              <div class="device-section">
                <div class="device-section-header">Other</div>
                <div class="device-section-divider"></div>
                <div class="device-buttons-container">
                  ${this.otherDeviceStatements.map((stmtKey) => {
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
              </div>
            ` : nothing}

            ${this.filteredDeviceStatements.length === 0 ? html`
              <div class="no-devices-message">No matching devices found</div>
            ` : nothing}
          </div>
        </div>
      </editor-modal>
    `;
  }
  //#endregion
}
