import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';

import { languageContext, programContext } from '@/editor/context/editor-context';
import { Block, Program, ProgramStatement, CompoundStatement, AbstractStatementWithArgs, assignUuidToBlock, DeviceMetadata, initDefaultArgumentType, ProgramStatementArgument } from '@/vpl/program';
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
import Types from '@/vpl/types';

import { globalStyles } from '../global-styles';
import * as icons from '../icons';
import { findMetadataEntry } from '../utils/find-metadata-entry';
import { findBlockRecursively } from '../utils/find-block-recursively';

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

  @property() tmpUUID: string = '';
  @property() parentProcedureUuid: string = '';
  @property() clickedBlockDeviceInit: string = '';
  @property() editorMode: 'edit' | 'initialize' = 'edit';
  @property({ type: Boolean }) isUserProcedureEditing: boolean = false;
  @property({ type: Object }) procedureDeviceIndices: Map<string, number> = new Map();
  @property({ type: Object }) uuidMapping: Map<string, string> = new Map();

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
  private getDeviceIndexByPosition(procedureBlock: any[], targetUuid: string): number {
    let deviceIndex = 0;

    const traverseBlock = (block: any[]): number => {
      for (const stmt of block) {
        if (stmt.id === 'deviceType' || (stmt.id && this.language?.deviceList?.includes(stmt.id.split('.')[0]))) {
          if (stmt._uuid === targetUuid) {
            return deviceIndex;
          }
          deviceIndex++;
        }

        if (stmt.block && Array.isArray(stmt.block)) {
          const result = traverseBlock(stmt.block);
          if (result !== -1) return result;
        }
      }
      return -1;
    };

    const result = traverseBlock(procedureBlock);
    return result;
  }

  private countDeviceStatementsInBlock(block: any[]): number {
    let count = 0;

    const countDevicesInBlock = (blockToCount: any[]) => {
      if (!blockToCount || !Array.isArray(blockToCount)) return;

      for (const stmt of blockToCount) {
        if (stmt.id === 'deviceType') {
          count++;
        } else if (stmt.id && this.language?.deviceList) {
          const deviceName = stmt.id.split('.')[0];
          if (this.language.deviceList.includes(deviceName)) {
            count++;
          }
        }
        if (stmt.block && Array.isArray(stmt.block)) {
          countDevicesInBlock(stmt.block);
        }
      }
    };

    countDevicesInBlock(block);
    return count;
  }

  private trimDevicesArrayToMatchDeviceCount(metadataEntry: any, procedureBlock: any[]) {
    if (!metadataEntry || !metadataEntry.devices || !Array.isArray(metadataEntry.devices)) return;
    if (!procedureBlock || !Array.isArray(procedureBlock)) return;

    // Count the actual device statements in the procedure block
    const actualDeviceCount = this.countDeviceStatementsInBlock(procedureBlock);

    // Trim the devices array from the back to match the actual device count
    if (metadataEntry.devices.length > actualDeviceCount) {
      const removedCount = metadataEntry.devices.length - actualDeviceCount;
      metadataEntry.devices.splice(actualDeviceCount);
      console.log(`Trimmed ${removedCount} orphaned device entries from devices array. New length: ${actualDeviceCount}`);
    }
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
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, () => {
      this.updateUserProceduresList();
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.language.deviceList) {
      this.selectedDevice = this.language.deviceList[0];
    }

    this.updateUserProceduresList();

    if (this.isProcBody && this.selectedTab === 'procedures') {
      this.selectedTab = 'basic';
    }
  }

  updateUserProceduresList() {
    if (!this.language?.statements) return;

    GeBlock.statementCategories.userProcedures = [];

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
            if (stmt.id === 'deviceType') {
              const arg = (stmt as AbstractStatementWithArgs).arguments[0];
              devices.push({
                id: 'deviceType',
                arguments: [{
                  type: Types.string,
                  value: String(arg.value)
                }]
              });
            } else if (this.language.deviceList.includes(deviceName)) {
              const deviceArguments: any[] = [];
              const langStatement = this.language.statements[stmt.id];

              if (langStatement && (langStatement as UnitLanguageStatementWithArgs).arguments) {
                const argDefs = (langStatement as UnitLanguageStatementWithArgs).arguments;

                argDefs.forEach((argDef, index) => {
                  const newArg = {
                    type: argDef.type,
                    value: null as any
                  };

                  if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                    newArg.value = argDef.options[0].id;
                  } else {
                    newArg.value = initDefaultArgumentType(argDef.type);
                  }

                  if ((stmt as AbstractStatementWithArgs).arguments &&
                      (stmt as AbstractStatementWithArgs).arguments[index]) {
                    newArg.value = (stmt as AbstractStatementWithArgs).arguments[index].value;
                  }
                  deviceArguments.push(newArg);
                });
              }

              devices.push({
                id: stmt.id,
                arguments: deviceArguments
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
    const statementToRemove = this.block[statementIndex];

    if (statementToRemove) {
      const isDeviceBlock = statementToRemove.id === 'deviceType';
      const deviceName = statementToRemove.id.split('.')[0];
      const isDeviceStatement = this.language.deviceList?.includes(deviceName);

      if (isDeviceBlock || isDeviceStatement) {
        let metadataEntry = findMetadataEntry(this.program.block, this.tmpUUID);

        if (!metadataEntry && this.parentProcedureUuid) {
          metadataEntry = findMetadataEntry(this.program.block, this.parentProcedureUuid);
        }

        if (metadataEntry && metadataEntry.devices) {
          const procedureBlock = this.tmpUUID ?
            this.program.header.userProcedures[metadataEntry.id] :
            (this.parentProcedureUuid ? this.program.header.userProcedures[metadataEntry.id] : null);

          if (procedureBlock) {
            const deviceIndex = this.getDeviceIndexByPosition(procedureBlock, statementToRemove._uuid);
            if (deviceIndex !== -1 && deviceIndex < metadataEntry.devices.length) {
              metadataEntry.devices.splice(deviceIndex, 1);
            }

            // After removing the device, trim any remaining orphaned entries
            this.trimDevicesArrayToMatchDeviceCount(metadataEntry, procedureBlock);
          }
        }
      }
    }

    this.block.splice(statementIndex, 1);
    this.requestUpdate();
    e.stopPropagation();

    const programUpdatedEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
      detail: { programBodyUpdated: true },
    });
    this.dispatchEvent(programUpdatedEvent);

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
      if (this.language.deviceList.includes(deviceName)) {
        isDevice = true;
      }

      if (isDevice && (this.editorMode === 'initialize' || this.isProcBody) && isParentClick) {
        this.clickedBlockDeviceInit = stmtUuid;
        if (clickedBlock._uuid !== undefined) {
          this.showDeviceSelectionModal(clickedBlock);
          return;
        }
      } else if (clickedBlock.id === 'deviceType' && this.editorMode === 'initialize' && isParentClick) {
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

    if (searchTerm) {
      this.filteredDeviceStatements = allDeviceStatements.filter(stmtKey => {
        const statement = this.language.statements[stmtKey];
        return statement.label.toLowerCase().includes(searchTerm);
      });
    } else {
      this.filteredDeviceStatements = allDeviceStatements;
    }

    let selectedDeviceType = '';
    if (clickedBlock && clickedBlock.id === 'deviceType' && (clickedBlock as AbstractStatementWithArgs).arguments?.[0]) {
      selectedDeviceType = String((clickedBlock as AbstractStatementWithArgs).arguments[0].value);
    }

    this.categorizeDeviceStatements(this.filteredDeviceStatements, selectedDeviceType);
  }

  private updateDevicesArrayForSelectedDevice(stmtKey: string): void {
    let metadataEntry = findMetadataEntry(this.program.block, this.tmpUUID);

    if (!metadataEntry && this.parentProcedureUuid) {
      metadataEntry = findMetadataEntry(this.program.block, this.parentProcedureUuid);
    }

    if (metadataEntry) {
      if (!metadataEntry.devices) {
        metadataEntry.devices = [];
      }

      const procedureBlock = this.tmpUUID ?
        this.program.header.userProcedures[metadataEntry.id] :
        (this.parentProcedureUuid ? this.program.header.userProcedures[metadataEntry.id] : null);

      if (procedureBlock) {
        const deviceIndex = this.getDeviceIndexByPosition(procedureBlock, this.clickedBlockDeviceInit);

        if (deviceIndex !== -1) {
          while (metadataEntry.devices.length <= deviceIndex) {
            metadataEntry.devices.push({
              id: 'deviceType',
              arguments: [{
                type: Types.string,
                value: ''
              }]
            });
          }

          const langStatement = this.language.statements[stmtKey];
          const defaultArguments: any[] = [];

          if (langStatement && (langStatement as UnitLanguageStatementWithArgs).arguments) {
            const argDefs = (langStatement as UnitLanguageStatementWithArgs).arguments;

            argDefs.forEach(argDef => {
              let defaultValue: any;
              if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                defaultValue = argDef.options[0].id;
              } else {
                defaultValue = initDefaultArgumentType(argDef.type);
              }
              defaultArguments.push({
                type: argDef.type,
                value: defaultValue
              });
            });
          }

          metadataEntry.devices[deviceIndex] = {
            id: stmtKey,
            arguments: defaultArguments
          };
        }
      }
    }
  }

  private replaceAllDeviceTypesInProcedure(stmtKey: string): boolean {
    let metadataEntry = findMetadataEntry(this.program.block, this.tmpUUID);
    if (!metadataEntry && this.parentProcedureUuid) {
      metadataEntry = findMetadataEntry(this.program.block, this.parentProcedureUuid);
    }

    if (!metadataEntry || !metadataEntry.devices) {
      return false;
    }

    const procedureBlock = this.tmpUUID ?
      this.program.header.userProcedures[metadataEntry.id] :
      (this.parentProcedureUuid ? this.program.header.userProcedures[metadataEntry.id] : null);

    if (!procedureBlock) {
      return false;
    }

    const replacementState = {
      deviceIndex: 0,
      replacementsMade: false
    };

    const replaceDeviceTypesInBlock = (block: any[], parentContext: string = 'root'): void => {
      for (let i = 0; i < block.length; i++) {
        const stmt = block[i];
        const currentContext = `${parentContext}[${i}]`;

        if (stmt.id === 'deviceType' || (stmt.id && this.language?.deviceList?.includes(stmt.id.split('.')[0]))) {
          if (replacementState.deviceIndex < metadataEntry.devices.length) {
            const deviceData = metadataEntry.devices[replacementState.deviceIndex];

            if (deviceData.id !== 'deviceType' && deviceData.id !== '') {
              const selectedStatement = this.language.statements[deviceData.id];
              if (selectedStatement) {
                const originalUuid = stmt._uuid;
                Object.keys(stmt).forEach(key => {
                  if (key !== '_uuid') {
                    delete stmt[key];
                  }
                });

                Object.assign(stmt, selectedStatement, {
                  id: deviceData.id,
                  _uuid: originalUuid
                });

                replacementState.replacementsMade = true;
              }
            }
          }
          replacementState.deviceIndex++;
        }

        if (stmt.block && Array.isArray(stmt.block)) {
          replaceDeviceTypesInBlock(stmt.block, `${currentContext}.${stmt.id}`);
        }
      }
    };

    replaceDeviceTypesInBlock(this.block, 'procedure-root');

    if (replacementState.replacementsMade) {
      const programUpdatedEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { programBodyUpdated: true },
      });
      this.dispatchEvent(programUpdatedEvent);

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

      this.requestUpdate();
    }

    return replacementState.replacementsMade;
  }

  handleDeviceStatementSelected(stmtKey: string) {
    this.deviceSelectionModalRef.value.hideModal();

    this.updateDevicesArrayForSelectedDevice(stmtKey);
    const wasReplaced = this.replaceAllDeviceTypesInProcedure(stmtKey);

    if (wasReplaced) {
      let metadataEntry = findMetadataEntry(this.program.block, this.tmpUUID);

      if (!metadataEntry && this.parentProcedureUuid) {
        metadataEntry = findMetadataEntry(this.program.block, this.parentProcedureUuid);
      }

      if (metadataEntry) {
        if (!metadataEntry.devices) {
          metadataEntry.devices = [];
        }

        const procedureBlock = this.tmpUUID ?
          this.program.header.userProcedures[metadataEntry.id] :
          (this.parentProcedureUuid ? this.program.header.userProcedures[metadataEntry.id] : null);

        if (procedureBlock) {
          const deviceIndex = this.getDeviceIndexByPosition(procedureBlock, this.clickedBlockDeviceInit);

          if (deviceIndex !== -1) {
            while (metadataEntry.devices.length <= deviceIndex) {
              metadataEntry.devices.push({
                id: 'deviceType',
                arguments: [{
                  type: Types.string,
                  value: ''
                }]
              });
            }

            const langStatement = this.language.statements[stmtKey];
            const defaultArguments: ProgramStatementArgument[] = [];

            if (langStatement && (langStatement as UnitLanguageStatementWithArgs).arguments) {
              const argDefs = (langStatement as UnitLanguageStatementWithArgs).arguments;

              argDefs.forEach(argDef => {
                let defaultValue: any;
                if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                  defaultValue = String(argDef.options[0].id);
                } else {
                  defaultValue = initDefaultArgumentType(argDef.type);
                }
                defaultArguments.push({
                  type: argDef.type,
                  value: defaultValue
                });
              });
            }

            metadataEntry.devices[deviceIndex] = {
              id: stmtKey,
              arguments: defaultArguments
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

      const programUpdatedEvent = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
        detail: { programBodyUpdated: true },
      });
      this.dispatchEvent(programUpdatedEvent);
      this.requestUpdate();

      const updateDeviceCountsEvent = new CustomEvent('update-device-counts', {
        bubbles: true,
        composed: true,
        detail: { procedureUuid: this.parentProcedureUuid || this.tmpUUID }
      });
      this.dispatchEvent(updateDeviceCountsEvent);
    }

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

    if (changedProperties.has('program') || changedProperties.has('language')) {
      this.updateUserProceduresList();
    }

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
    if (!this.block || !Array.isArray(this.block) || !this.program || !this.program.header) {
      return html`<div class="error-statements">Error: Invalid block or program data</div>`;
    }

    const skeletonizeUuids = this.program.header.skeletonize_uuid || [];
    let deviceIndices = new Map<string, number>();

    if (this.editorMode === 'initialize') {
      if (this.procedureDeviceIndices.size > 0) {
        deviceIndices = this.procedureDeviceIndices;
      } else if (this.tmpUUID) {
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


  // addStatementOptionsTemplate() {
  //   return html`
  //     <div class="add-statement-options">
  //       <div class="no-available-statements">Please use the categorized statement templates</div>
  //     </div>
  //   `;
  // }

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
