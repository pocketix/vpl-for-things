import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { Block, Program, ProgramStatement, CompoundStatement, AbstractStatementWithArgs, assignUuidToBlock, DeviceMetadata } from '@/vpl/program';
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
  @property() currentDeviceBlock: ProgramStatement; // Store the current device block being edited
  @property() uuidMetadata: string; // Add property to store the UUID metadata
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
    if (this.parentProcedureUuid) {
      console.log(`Parent Procedure UUID: ${this.parentProcedureUuid}`); // Debugging log

      // Log the entry from initializedProcedures for the parentProcedureUuid
      const metadataEntry = this.program.header.initializedProcedures.find(
        (entry) => entry.uuid === this.parentProcedureUuid
      );
      if (metadataEntry) {
        console.log(`Metadata entry for UUID ${this.parentProcedureUuid}:`, metadataEntry);
      } else {
        console.warn(`No metadata entry found for UUID: ${this.parentProcedureUuid}`);
      }
    }
  }
  //#endregion

  //#region Methods
  addNewStatement(stmtKey: string) {
    // Hide all modals in the document to prevent them from stacking
    this.hideAllModals();

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

          if (stmt.id === 'deviceType') {
            console.log(`Found device statement - UUID: ${stmt._uuid}, ID: ${stmt.id}`);

            // Store the complete statement with its arguments
            if ((stmt as AbstractStatementWithArgs).arguments?.[0]) {
              const arg = (stmt as AbstractStatementWithArgs).arguments[0];
              console.log(`Found device statement - UUID: ${stmt._uuid}, ID: ${stmt.id} with argument value: ${arg.value}`);

              // Create a deep copy of the statement to store in metadata
              const statementCopy = JSON.parse(JSON.stringify(stmt));

              devices.push({
                uuid: stmt._uuid,
                deviceId: String(arg.value),
                statement: statementCopy
              });
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
        devices, // Now using DeviceMetadata array
      };

      // Check if there's already an entry with the same UUID
      const existingEntryIndex = this.program.header.initializedProcedures.findIndex(
        entry => entry.uuid === addedStmt._uuid
      );

      if (existingEntryIndex >= 0) {
        // Update the existing entry
        console.log(`Updating existing metadata entry for UUID: ${addedStmt._uuid}`);
        this.program.header.initializedProcedures[existingEntryIndex] = metadataEntry;
      } else {
        // Add a new entry
        console.log(`Adding new metadata entry for UUID: ${addedStmt._uuid}`);
        this.program.header.initializedProcedures.push(metadataEntry);
      }

      // Set the _isInitializing flag on the statement component to prevent modal from showing
      // We need to wait for the component to be rendered
      setTimeout(() => {
        // Find the statement component by UUID
        const statementElement = this.shadowRoot?.querySelector(`ge-statement[uuid="${addedStmt._uuid}"]`);
        if (statementElement) {
          (statementElement as any)._isInitializing = true;
          console.log(`Set _isInitializing flag on statement with UUID: ${addedStmt._uuid}`);
        }
      }, 0);

      // Log each entry in initializedProcedures explicitly
      console.log('Updated initializedProcedures:');
      this.program.header.initializedProcedures.forEach((entry) => {
        console.log(`UUID: ${entry.uuid}, ID: ${entry.id}, Devices:`);
        entry.devices.forEach((device) => {
          console.log(`  - Device UUID: ${device.uuid}, Device ID: ${device.deviceId}`);
          console.log(`  - Device Statement:`, device.statement);
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
  }

  hideAllModals() {
    // Hide all modals to prevent them from stacking
    if (this.addStatementModalRef.value) {
      this.addStatementModalRef.value.hideModal();
    }
    if (this.deviceSelectionModalRef.value) {
      this.deviceSelectionModalRef.value.hideModal();
    }

    // Hide all modals in the document
    const allModals = document.querySelectorAll('editor-modal');
    allModals.forEach(modal => {
      if (typeof (modal as any).hideModal === 'function') {
        (modal as any).hideModal();
      }
    });

    // Also hide modals in all child ge-statement components
    const statementElements = this.shadowRoot?.querySelectorAll('ge-statement');
    if (statementElements) {
      statementElements.forEach(statement => {
        if (typeof (statement as any).hideAllModals === 'function') {
          (statement as any).hideAllModals();
        }
      });
    }
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

  toggleStatementSelection(stmtUuid: string, isParentClick: boolean = false) {
    console.log(`toggleStatementSelection called with UUID: ${stmtUuid}, isParentClick: ${isParentClick}`);

    const clickedBlock = this.block.find((s) => s._uuid === stmtUuid);
    if (clickedBlock && clickedBlock.id === 'deviceType') {
      console.log(`Clicked block is a deviceType statement with UUID: ${stmtUuid}`);

      if (clickedBlock._uuid !== undefined && !this.skeletonizeMode) {
        // If we're in a procedure body, we need to set the parentProcedureUuid and tmpUUID
        if (this.isProcBody) {
          // If we have a uuidMetadata, use it for both tmpUUID and parentProcedureUuid
          if (this.uuidMetadata) {
            this.tmpUUID = this.uuidMetadata;
            this.parentProcedureUuid = this.uuidMetadata;
            console.log(`Set tmpUUID and parentProcedureUuid from uuidMetadata: ${this.uuidMetadata}`);
          }
          // If parentProcedureUuid is not set, try to get it from other sources
          else if (!this.parentProcedureUuid) {
            // Try to get the parent procedure UUID from the parent element
            const parentElement = this.parentElement;
            if (parentElement && parentElement.tagName === 'GE-BLOCK') {
              this.parentProcedureUuid = (parentElement as any).parentProcedureUuid;
              this.tmpUUID = this.parentProcedureUuid; // Also set tmpUUID
              console.log(`Got parentProcedureUuid and tmpUUID from parent element: ${this.parentProcedureUuid}`);
            } else if (this.parentStmt && this.parentStmt._uuid) {
              // If we can't get it from the parent element, try to get it from the parent statement
              this.parentProcedureUuid = this.parentStmt._uuid;
              this.tmpUUID = this.parentProcedureUuid; // Also set tmpUUID
              console.log(`Got parentProcedureUuid and tmpUUID from parent statement: ${this.parentProcedureUuid}`);
            }
          }
        }

        console.log(`toggleStatementSelection - parentProcedureUuid: ${this.parentProcedureUuid}, tmpUUID: ${this.tmpUUID}`);
        this.showDeviceSelectionModal(clickedBlock);
        console.log(`Showing device selection modal for UUID: ${stmtUuid}`);
      }
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
  }

  showDeviceSelectionModal(clickedBlock: ProgramStatement) {
    // Store the clicked block for later use
    this.currentDeviceBlock = clickedBlock;

    // If we're in a procedure body, we need to find the parent procedure UUID
    if (this.isProcBody) {
      console.log('In procedure body');

      // If we have a uuidMetadata, use it for both tmpUUID and parentProcedureUuid
      if (this.uuidMetadata) {
        this.tmpUUID = this.uuidMetadata;
        this.parentProcedureUuid = this.uuidMetadata;
        console.log(`Set tmpUUID and parentProcedureUuid from uuidMetadata: ${this.uuidMetadata}`);
      }
      // If parentProcedureUuid is not set, try to get it from other sources
      else if (!this.parentProcedureUuid) {
        console.log('parentProcedureUuid is not set');

        // Try to get the parent procedure UUID from the parent element
        const parentElement = this.parentElement;
        if (parentElement && parentElement.tagName === 'GE-BLOCK') {
          this.parentProcedureUuid = (parentElement as any).parentProcedureUuid;
          this.tmpUUID = this.parentProcedureUuid; // Also set tmpUUID
          console.log(`Got parentProcedureUuid and tmpUUID from parent element: ${this.parentProcedureUuid}`);
        } else if (this.parentStmt && this.parentStmt._uuid) {
          // If we can't get it from the parent element, try to get it from the parent statement
          this.parentProcedureUuid = this.parentStmt._uuid;
          this.tmpUUID = this.parentProcedureUuid; // Also set tmpUUID
          console.log(`Got parentProcedureUuid and tmpUUID from parent statement: ${this.parentProcedureUuid}`);
        }
      }
    }

    console.log(`showDeviceSelectionModal - parentProcedureUuid: ${this.parentProcedureUuid}, tmpUUID: ${this.tmpUUID}`);

    // Filter device statements
    this.filteredDeviceStatements = Object.keys(this.language.statements).filter((stmtKey) => {
      const statement = this.language.statements[stmtKey];
      return statement.group !== 'logic' && statement.group !== 'loop' && statement.group !== 'variable' && statement.group !== 'misc' && statement.group !== 'internal'
        && statement.label !== 'Send Notification' && statement.label !== 'DeviceType';
    });

    this.deviceSelectionModalRef.value.showModal();
  }

  handleDeviceStatementSelected(stmtKey: string) {
    console.log(`Selected device statement: ${stmtKey}`);
    console.log(`handleDeviceStatementSelected - parentProcedureUuid: ${this.parentProcedureUuid}`);

    this.deviceSelectionModalRef.value.hideModal();

    // Use the stored device block
    const clickedBlock = this.currentDeviceBlock;
    if (clickedBlock) {
      console.log(`Replacing deviceType block with selected statement: ${stmtKey}`);

      // Create a new statement with the selected device type
      const newStatement: ProgramStatement = {
        id: stmtKey,
        _uuid: clickedBlock._uuid, // Retain the UUID of the original block
        arguments: clickedBlock.id === 'deviceType' && (clickedBlock as AbstractStatementWithArgs).arguments ?
          JSON.parse(JSON.stringify((clickedBlock as AbstractStatementWithArgs).arguments)) : [],
        isInvalid: false
      };

      // Find the index of the clicked block in the current block
      const index = this.block.indexOf(clickedBlock);
      if (index !== -1) {
        // Replace the block with the new statement
        this.block[index] = newStatement;

        // Debugging log to confirm block replacement
        console.log(`Block at index ${index} replaced with selected statement:`, newStatement);

        // Log the UUID of the user procedure being displayed
        console.log(`User Procedure UUID: ${clickedBlock._uuid}`);
        this.tmpUUID = clickedBlock._uuid;
        console.log(`Assigned tmpUUID: ${this.tmpUUID}`);
        this.requestUpdate(); // Ensure UI updates with the new tmpUUID

        // Update the metadata entry in the initializedProcedures array
        // First try to find the entry using tmpUUID, then fall back to parentProcedureUuid
        let metadataEntry = null;

        if (this.tmpUUID) {
          console.log(`Looking for metadata entry with tmpUUID: ${this.tmpUUID}`);
          metadataEntry = this.program.header.initializedProcedures.find(
            (entry) => entry.uuid === this.tmpUUID
          );
        }

        if (!metadataEntry && this.parentProcedureUuid) {
          console.log(`Looking for metadata entry with parentProcedureUuid: ${this.parentProcedureUuid}`);
          metadataEntry = this.program.header.initializedProcedures.find(
            (entry) => entry.uuid === this.parentProcedureUuid
          );
        }

        // If we still don't have a metadata entry, try to find it using uuidMetadata
        if (!metadataEntry && this.uuidMetadata) {
          console.log(`Looking for metadata entry with uuidMetadata: ${this.uuidMetadata}`);
          metadataEntry = this.program.header.initializedProcedures.find(
            (entry) => entry.uuid === this.uuidMetadata
          );
        }

        if (metadataEntry) {
          console.log(`Found metadata entry for UUID: ${metadataEntry.uuid}`, metadataEntry);

          // We need to update the metadata directly
          // Since we've already replaced the deviceType statement with a device statement,
          // we need to find the device in the metadata by its UUID

          // Find the device in the metadata by UUID
          const deviceIndex = metadataEntry.devices.findIndex((device: DeviceMetadata) => device.uuid === clickedBlock._uuid);

          console.log(`Device index in metadata: ${deviceIndex}`);
          console.log(`Device UUID: ${clickedBlock._uuid}`);
          console.log(`Metadata devices:`, metadataEntry.devices.map((d: DeviceMetadata) => d.uuid));

          console.log(`Total devices in metadata: ${metadataEntry.devices.length}`);

          // Update the device metadata at the corresponding index
          if (deviceIndex >= 0) {
            const deviceToUpdate = metadataEntry.devices[deviceIndex];
            console.log(`Updating device at index ${deviceIndex} - Old ID: ${deviceToUpdate.deviceId}, New ID: ${stmtKey}`);

            // Update the device metadata
            metadataEntry.devices[deviceIndex] = {
              uuid: deviceToUpdate.uuid, // Keep the original UUID
              deviceId: stmtKey,
              statement: newStatement
            };
          } else {
            // If the device is not found in the metadata, add it
            console.log(`Device not found in metadata, adding new entry with UUID: ${clickedBlock._uuid}`);
            metadataEntry.devices.push({
              uuid: clickedBlock._uuid,
              deviceId: stmtKey,
              statement: newStatement
            });
          }

          // Clear the procedureBlockCopy to force a rebuild on next open
          metadataEntry.procedureBlockCopy = null;
          console.log('Cleared procedureBlockCopy in metadata to force rebuild on next open');
        } else {
          console.warn(`No metadata entry found for UUID: ${this.parentProcedureUuid}`);
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
      this.requestUpdate();
    }
  }
  //#endregion

  //#region Templates
  addStatementButtonTemplate() {
    return html`
      ${!this.skeletonizeMode
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
              .statement="${stmt}"
              .index="${i}"
              .isProcBody="${this.isProcBody}"
              .isExample="${this.isExample}"
              .skeletonizeMode="${this.skeletonizeMode}"
              .restrainedMode="${this.restrainedMode}"
              .isSelected="${this.selectedStatements.has(stmt._uuid)}"
              .uuidMetadata="${this.tmpUUID}"
              uuid="${stmt._uuid}"
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
