import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  AbstractStatementWithArgs,
  CompoundStatement,
  CompoundStatementWithArgs,
  Program,
  ProgramStatement,
  initDefaultArgumentType,
  assignUuidToBlock,
  DeviceMetadata,
} from '@vpl/program';
import { Argument, Language } from '@vpl/language';
import { consume } from '@lit/context';
import { languageContext, programContext } from '@/editor/context/editor-context';
import {
  editorVariablesModalCustomEvent,
  graphicalEditorCustomEvent,
  procedureEditorCustomEvent,
  statementCustomEvent,
  deviceStatementCustomEvent,
} from '@/editor/editor-custom-events';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { globalStyles } from '../global-styles';
import * as icons from '../icons';
import { EditorModal } from './editor-modal';
import Types from '@vpl/types.ts';

@customElement('ge-statement')
export class GEStatement extends LitElement {
  //#region Styles
  static styles = [//{{{
    globalStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
      }



      .highlight-active {
        box-shadow: 0 0 10px 2px rgba(255, 255, 0, 0.8); /* Highlight effect */
        border: 2px solid rgba(255, 255, 0, 0.8);
      }

      /* Apply highlight to nested blocks when parent is highlighted */
      .highlight-active .nested {
        box-shadow: 0 0 10px 2px rgba(255, 255, 0, 0.8); /* Highlight effect */
        border: 2px solid rgba(255, 255, 0, 0.8);
      }

      .expr-arg {
        white-space: nowrap;
        overflow-x: auto;
        width: 100%;
      }

      .statement-controls {
        display: flex;
        gap: 0.35rem;
        margin-left: auto;
        height: 100%;
      }

      .device-count {
        display: flex;
        align-items: center;
        margin-right: 0.5rem;
        font-weight: bold;
      }

      .device-count-incomplete {
        color: var(--red-600);
      }

      .device-count-complete {
        color: var(--green-600);
      }

      .statement-label-wrapper {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        position: relative;
        /* width: 100%; */
      }

      .statement-header {
        display: flex;
        flex-direction: row;
        /* justify-content: space-between; */
        align-items: center;
        gap: 0.35rem;
        padding: 0.5rem;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
        height: 55px;
      }

      .nested {
        padding: 0.75rem;
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
      }

      .hidden {
        display: none;
      }

      .bottom-radius {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
      }

      .statement-controls-modal-wrapper {
        display: flex;
        position: relative;
      }

      .statement-controls-modal {
        bottom: 0;
        left: -94px;
      }

      .statement-controls-modal::part(dialog) {
        padding: 0;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      }

      .statement-controls-buttons {
        display: flex;
        flex-direction: column;
      }

      .statement-controls-buttons editor-button::part(btn) {
        display: flex;
        justify-items: center;
        white-space: nowrap;
        box-shadow: none;
        border: none;
        border-radius: 0;
        border-bottom: 1px solid var(--gray-300);
      }

      .statement-controls-buttons editor-button:first-child::part(btn) {
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
      }

      .statement-controls-buttons editor-button:last-child::part(btn) {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        border-bottom: none;
      }

      .remove-statement-button::part(btn) {
        color: var(--red-600);
      }

      .expand-nested-block-button {
        display: flex;
        align-items: center;
        padding-left: 4px;
        padding-right: 4px;
        cursor: pointer;
      }

      .statement-arguments-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .user-proc-wrapper::part(btn) {
        display: block;
        padding: 0;
        border: none;
        box-shadow: none;
        background: none;
      }

      .ok-button::part(btn) {
        justify-content: center;
        color: var(--green-600);
        gap: 4px;
      }

      .stmt-brief-desc-wrapper {
        max-width: 800px;
        text-align: justify;
        text-justify: inter-word;
      }

      .stmt-desc-modal {
        position: absolute;
        bottom: -4px;
      }

      .stmt-icon {
        cursor: help;
      }

      .stmt-desc-modal * {
        outline: none;
      }

      .stmt-desc-inner-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 500px;
        overflow: auto;
      }

      .stmt-desc-item-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stmt-desc-label {
        font-weight: 600;
        font-size: 1.125rem;
      }

      .divider {
        width: 100%;
        height: 1px;
        background: var(--gray-300);
        margin-bottom: 8px;
      }

      @media (min-width: 500px) {
        .statement-label {
          white-space: nowrap;
        }
      }
    `,
  ];//}}}
  //#endregion

  //#region Props
  @property() statement: ProgramStatement;
  @property() index: number;
  @property() nestedBlockVisible: boolean = true;
  @property() isProcBody: boolean = false;
  @property() isExample: boolean = false;
  @property() exampleBlockIsVisible: boolean = false;
  @property({ type: Boolean }) skeletonizeMode: boolean = false;
  @property({ type: Boolean }) restrainedMode: boolean = false;
  @property({ type: Boolean }) isHighlighted: boolean = false; // Track if the statement is highlighted
  @property({ type: Boolean }) isSelected: boolean = false; // Track if the statement is selected in skeletonize mode
  @property({ type: Boolean }) isNestedUserProcedure: boolean = false; // Track if this is a nested user procedure
  @property({ type: Object }) procedureBlockCopy: any = []; // Add a new property
  @property() uuidMetadata: string;
  @property() editorMode: 'edit' | 'initialize' = 'edit'; // Mode for the editor: edit or initialize
  @property() initializedDeviceCount: number = 0; // Count of initialized devices
  @property() totalDeviceCount: number = 0; // Total count of device blocks
  //#endregion

  //#region Context
  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;
  //#endregion

  //#region Refs
  statementHeaderRef: Ref<HTMLElement> = createRef();
  statementNestedBlockRef: Ref<HTMLElement> = createRef();
  statementControlsModalRef: Ref<EditorModal> = createRef();
  multipleArgsModalRef: Ref<EditorModal> = createRef();
  procModalRef: Ref<EditorModal> = createRef();
  stmtDescModalRef: Ref<EditorModal> = createRef();
  //#endregion

  //#region Lifecycles

  constructor() {
    super();

    // Update device counts when component is constructed
    setTimeout(() => this.updateDeviceCounts(), 0);
    this.addEventListener(editorVariablesModalCustomEvent.VARIABLE_SELECTED, (_e: CustomEvent) => {
      if (this.statement.id === 'setvar') {
        (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[1].type = this.program.header
          .userVariables[
          (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0].value as string
        ]
          ? this.program.header.userVariables[
              (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0].value as string
            ].type
          : this.language.variables[
              (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0].value as string
            ]
          ? 'device'
          : 'invalid';
        (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[1].value =
          (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[1].type === Types.boolean_expression
            ? initDefaultArgumentType(Types.boolean_expression)
            : null;

        const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(event);
      }
    });

    this.addEventListener('device-selection-changed', (e: CustomEvent) => {
      // Check if this statement is the device that was changed
      if (this.statement._uuid && this.statement._uuid === e.detail.deviceUuid) {
        // Update the statement to reflect the device selection
        this.requestUpdate();
      }

      // If this is a user procedure and the procedure UUID matches the one in the event
      // update the device counts as a device was initialized/changed
      if (this.language?.statements[this.statement.id]?.isUserProcedure &&
          this.statement._uuid === e.detail.procedureUuid) {
        this.updateDeviceCounts();
        this.requestUpdate();
      }
    });

    // Listen for argument value changes
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, (_e: CustomEvent) => {
      // Only process if this is a device statement in an initialized procedure
      if (this.statement._uuid && this.editorMode === 'initialize') {
        console.log(`Device metadata value changed for UUID: ${this.uuidMetadata}`);
        const initProcEntry = this.program.block.find(entry => entry._uuid === this.uuidMetadata);

        if (isInInitializedProcedure) {
          this.updateDeviceMetadataValue();
        }
      }
      this.requestUpdate();
    });

    this.addEventListener(procedureEditorCustomEvent.PROCEDURE_MODAL_CLOSED, (_e: CustomEvent) => {
      // Reset restrainedMode and editorMode when the procedure modal is closed
      // This ensures the burger menu is re-enabled for the procedure block itself
      this.restrainedMode = false;
      this.editorMode = 'edit';
      this.requestUpdate();
    });

    this.addEventListener(deviceMetadataCustomEvent.REOPEN_PROCEDURE_MODAL, (e: CustomEvent) => {
      if (this.language?.statements[this.statement.id]?.isUserProcedure &&
          this.statement._uuid === e.detail.procedureUuid) {
        // Close the modal silently
        if (this.procModalRef.value) {
          this.procModalRef.value.hideModal();
        }
        this.handleShowProcDef();
      }
    });

    // Listen for program updates to refresh device counts
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, () => {
      if (this.language?.statements[this.statement?.id]?.isUserProcedure && !this.isProcBody) {
        this.updateDeviceCounts();
        this.requestUpdate();
      }
    });
  }

  updateDeviceMetadataValue() {
    if (!this.statement._uuid) return;
    const procInitEntry = this.program.block.find(entry => entry._uuid === this.uuidMetadata);
    const deviceEntry = procInitEntry?.devices.find(device => device.uuid === this.statement._uuid);

    if (deviceEntry && (this.statement as AbstractStatementWithArgs).arguments) {
      const argValue = (this.statement as AbstractStatementWithArgs).arguments[0]?.value;
      if (argValue !== undefined && argValue !== null) {
        deviceEntry.values[0] = String(argValue);
      }
      return;
    }
  }

  countDeviceTypeBlocks(block: any[]): number {
    let count = 0;

    const countDevicesInBlock = (blockToCount: any[]) => {
      if (!blockToCount || !Array.isArray(blockToCount)) return;

      for (const stmt of blockToCount) {
        // Check if this is a deviceType block or a device from the device list
        if (stmt.id === 'deviceType') {
          count++;
        } else if (stmt.id && this.language?.deviceList) {
          // Check if the statement ID starts with a device name from the device list
          const deviceName = stmt.id.split('.')[0];
          if (this.language.deviceList.includes(deviceName)) {
            count++;
          }
        }

        // Recursively check nested blocks
        if (stmt.block && Array.isArray(stmt.block)) {
          countDevicesInBlock(stmt.block);
        }
      }
    };

    countDevicesInBlock(block);
    return count;
  }

  // Count the number of initialized devices in a procedure
  countInitializedDevices(procedureUuid: string): number {
    if (!this.program || !procedureUuid) return 0;

    // Find the procedure entry recursively through the program structure
    const findProcedureEntry = (block: any[], targetUuid: string): any => {
      // First check if the entry is in this block
      const directEntry = block.find(stmt => stmt._uuid === targetUuid);
      if (directEntry) return directEntry;

      // If not found directly, search in nested blocks
      for (const stmt of block) {
        if (stmt.block && Array.isArray(stmt.block)) {
          const nestedEntry = findProcedureEntry(stmt.block, targetUuid);
          if (nestedEntry) return nestedEntry;
        }
      }

      return null;
    };

    const procedureEntry = findProcedureEntry(this.program.block, procedureUuid);

    if (!procedureEntry || !procedureEntry.devices) return 0;

    const initializedCount = procedureEntry.devices.filter((device: any) => {
      if (device.deviceId === 'deviceType') {
        return false;
      }

      // Check if the device ID is in the language statements
      if (this.language.statements[device.deviceId]) {
        return true;
      }

      return false;
    }).length;

    return initializedCount;
  }

  // Check if all devices are initialized
  areAllDevicesInitialized(): boolean {
    return this.initializedDeviceCount === this.totalDeviceCount && this.totalDeviceCount > 0;
  }

  // Update device counts when needed
  updateDeviceCounts() {
    if (!this.language?.statements || !this.statement?.id) return;

    // Only process for user procedures that aren't in procedure body view
    if (this.language.statements[this.statement.id]?.isUserProcedure && !this.isProcBody) {
      // Get the procedure block
      const procedureBlock = this.program.header.userProcedures[this.statement.id];
      if (procedureBlock) {
        // Count total device blocks
        this.totalDeviceCount = this.countDeviceTypeBlocks(procedureBlock);

        // Count initialized devices
        this.initializedDeviceCount = this.countInitializedDevices(this.statement._uuid);

        // Log for debugging
        console.log(`Device count for procedure ${this.statement.id}: ${this.initializedDeviceCount}/${this.totalDeviceCount}`);
      }
    }
  }

  updated(changedProperties: Map<string, any>) {
    // Check if the statement UUID is in the skeletonize_uuid array
    if (this.statement._uuid && this.program) {
      // Update isHighlighted when skeletonizeMode or statement changes
      if (changedProperties.has('skeletonizeMode') || changedProperties.has('statement')) {
        this.isHighlighted = this.skeletonizeMode && this.program.header.skeletonize_uuid.includes(this.statement._uuid);
      }
    }

    // Update device counts
    this.updateDeviceCounts();

    // If this is a new statement or the statement ID has changed, update device counts
    if (changedProperties.has('statement') || changedProperties.has('statement.id')) {
      this.updateDeviceCounts();
    }

    this.statementHeaderRef.value.setAttribute(
      'style',
      `background-color: ${bgColor}; color: ${color}; ${invalidStyle}`
    );

    if (this.statementNestedBlockRef.value) {
      // Get the background color
      const bgColor = this.language.statements[this.statement.isInvalid ? '_err' : this.statement.id].backgroundColor;
      const fgColor = this.language.statements[this.statement.isInvalid ? '_err' : this.statement.id].foregroundColor;

      // Apply transparency only when not in skeletonize mode or not a user procedure
      const isUserProcedure = this.language.statements[this.statement.id]?.isUserProcedure;
      const transparency = (this.skeletonizeMode && isUserProcedure) ? '' : '3a';

      this.statementNestedBlockRef.value.setAttribute(
        'style',
        `background-color: ${bgColor}${transparency}; color: ${fgColor};`
      );
    }
  }
  //#endregion

  //#region Handlers

  handleToggleNestedBlockVisibility() {
    this.nestedBlockVisible = !this.nestedBlockVisible;
  }

  handleRemoveStatement(e: Event) {
    const event = new CustomEvent(statementCustomEvent.REMOVE, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
    e.stopPropagation();
  }

  handleMoveStatementUp(e: Event) {
    const event = new CustomEvent(statementCustomEvent.MOVE_UP, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
    e.stopPropagation();
  }

  handleMoveStatementDown(e: Event) {
    const event = new CustomEvent(statementCustomEvent.MOVE_DOWN, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
    e.stopPropagation();
  }

  handleToggleStatementControlsModal(e: Event) {
    this.statementControlsModalRef.value.toggleModal();
    e.stopPropagation();
  }

  handleHideStatementControlsModal() {
    this.statementControlsModalRef.value.hideModal();
  }

  handleShowProcDef() {
    if (this.skeletonizeMode) return;

    // For nested user procedure blocks, we always want to open the initialization modal
    // This is a simpler approach than trying to detect if it's a nested block
    this.editorMode = 'initialize';
    this.restrainedMode = true;

    console.log('Original Procedure Block:', this.statement.id);
    const originalProcedureBlock = this.program.header.userProcedures[this.statement.id];

    if (originalProcedureBlock) {
      this.procedureBlockCopy = JSON.parse(JSON.stringify(originalProcedureBlock));
      assignUuidToBlock(this.procedureBlockCopy);

      this.uuidMetadata = this.statement._uuid;
      this.requestUpdate();

      // Find the procedure entry recursively through the program structure
      const findProcedureEntry = (block: any[], targetUuid: string): any => {
        // First check if the entry is in this block
        const directEntry = block.find(stmt => stmt._uuid === targetUuid);
        if (directEntry) return directEntry;

        // If not found directly, search in nested blocks
        for (const stmt of block) {
          if (stmt.block && Array.isArray(stmt.block)) {
            const nestedEntry = findProcedureEntry(stmt.block, targetUuid);
            if (nestedEntry) return nestedEntry;
          }
        }

        return null;
      };

      const procedureEntry = findProcedureEntry(this.program.block, this.statement._uuid);
      console.log('Procedure Entry:', procedureEntry);

      const parseBlock = (block: any[]) => {
        block.forEach((stmt: any, index: number) => {
          console.log('Current Statement:', stmt.id);
          if (stmt.id === 'deviceType') {
            // Handle the case where procedureEntry might be null
            const deviceEntry = procedureEntry && procedureEntry.devices ?
              procedureEntry.devices.find((device: any) => device.uuid === stmt._uuid) : null;
            let deviceID = deviceEntry?.deviceId || 'deviceType';
            if (deviceEntry) {

              var deviceIDName = deviceID.split('.')[0];

              if (!this.language.deviceList.includes(deviceIDName)) deviceID = 'deviceType';

            } else {
              console.log('------------------> Device Entry not found');
              deviceID = 'deviceType'; // Default to 'deviceType' if no entry is found
            }
            if (deviceID === 'deviceType') {
              const deviceTypeValue = stmt.arguments && stmt.arguments[0] ? stmt.arguments[0].value : '';
              console.log(`Found deviceType block with value: ${deviceTypeValue}`);

              block[index] = {
                ... this.language.statements[deviceID],
                id: deviceID,
                _uuid: stmt._uuid,
                arguments: [
                  {
                    type: Types.string,
                    value: deviceTypeValue,
                  },
                ],
                isInvalid: false,
              };

            } else {
              // Get the language statement definition to determine arguments structure
              const langStatement = this.language.statements[deviceID];
              const newArguments = [];

              // If the device has arguments defined in the language
              if (langStatement && (langStatement as any).arguments) {
                const argDefs = (langStatement as any).arguments;

                // Create arguments with values from device entry if available
                argDefs.forEach((argDef: any, argIndex: number) => {
                  const newArg: any = {
                    type: argDef.type,
                    isInvalid: false
                  };

                  // Set the value from device entry values if available
                  if (deviceEntry && deviceEntry.values && deviceEntry.values[argIndex] !== undefined) {
                    if (argDef.type === Types.number || argDef.type === 'num_opt') {
                      newArg.value = Number(deviceEntry.values[argIndex]);
                    } else {
                      newArg.value = deviceEntry.values[argIndex];
                    }
                  } else if (argDef.type === 'str_opt' || argDef.type === 'num_opt') {
                    // Default to first option if no value is available
                    newArg.value = argDef.options[0].id;
                  } else {
                    // Use default value for the argument type
                    newArg.value = initDefaultArgumentType(argDef.type);
                  }

                  newArguments.push(newArg);
                });
              }

              block[index] = {
                ... this.language.statements[deviceID],
                id: deviceID,
                _uuid: stmt._uuid,
                arguments: newArguments,
                isInvalid: false,
              };
              console.log('Modified Statement with values:', block[index]);
            }
          }
          if (stmt.block && Array.isArray(stmt.block)) {
            parseBlock(stmt.block);
          }
        });
      };

      parseBlock(this.procedureBlockCopy);

      // Clean up orphaned device entries
      this.cleanupOrphanedDeviceEntries();

      this.requestUpdate();
    }
    this.procModalRef.value.showModal();
  }

  handleShowStmtDescModal(e: Event) {
    if (!this.exampleBlockIsVisible) {
      this.exampleBlockIsVisible = true;
    }
    if (this.stmtDescModalRef.value) {
      this.stmtDescModalRef.value.showModal();
    }
    e.stopPropagation();
  }

  toggleHighlight() {
    this.isHighlighted = !this.isHighlighted;

    // If in skeletonize mode, update the program's skeletonize_uuid array
    if (this.skeletonizeMode && this.statement._uuid && this.program) {
      if (this.isHighlighted) {
        // Add to skeletonize_uuid if not already there
        if (!this.program.header.skeletonize_uuid.includes(this.statement._uuid)) {
          this.program.header.skeletonize_uuid.push(this.statement._uuid);
        }
      } else {
        // Remove from skeletonize_uuid
        this.program.header.skeletonize_uuid = this.program.header.skeletonize_uuid.filter(
          (uuid) => uuid !== this.statement._uuid
        );
      }

      // Notify other components about the change
      const event = new CustomEvent('skeletonize-selection-changed', {
        bubbles: true,
        composed: true,
        detail: { skeletonizeUuids: this.program.header.skeletonize_uuid }
      });
      this.dispatchEvent(event);
    }

    this.requestUpdate();
  }
  //#endregion

  cleanupOrphanedDeviceEntries() {
    // Find the procedure entry recursively through the program structure
    const findProcedureEntry = (block: any[], targetUuid: string): any => {
      // First check if the entry is in this block
      const directEntry = block.find(stmt => stmt._uuid === targetUuid);
      if (directEntry) return directEntry;

      // If not found directly, search in nested blocks
      for (const stmt of block) {
        if (stmt.block && Array.isArray(stmt.block)) {
          const nestedEntry = findProcedureEntry(stmt.block, targetUuid);
          if (nestedEntry) return nestedEntry;
        }
      }

      return null;
    };

    const procedureEntry = findProcedureEntry(this.program.block, this.statement._uuid);

    if (!procedureEntry || !procedureEntry.devices || !Array.isArray(procedureEntry.devices)) {
      return;
    }

    // Get all device UUIDs in the procedure body
    const validDeviceUuids = new Set<string>();

    const collectDeviceUuids = (block: any[]) => {
      if (!block || !Array.isArray(block)) return;

      for (const stmt of block) {
        if (stmt._uuid) {
          const isDeviceBlock = stmt.id === 'deviceType';
          const deviceName = stmt.id.split('.')[0];
          const isDeviceStatement = this.language.deviceList?.includes(deviceName);

          if (isDeviceBlock || isDeviceStatement) {
            validDeviceUuids.add(stmt._uuid);
          }
        }

        if (stmt.block && Array.isArray(stmt.block)) {
          collectDeviceUuids(stmt.block);
        }
      }
    };

    // Collect valid device UUIDs from the procedure body
    const procedureBlock = this.program.header.userProcedures[this.statement.id];
    if (procedureBlock) {
      collectDeviceUuids(procedureBlock);
    }

    // Filter out orphaned device entries
    procedureEntry.devices = procedureEntry.devices.filter((device: any) =>
      validDeviceUuids.has(device.uuid)
    );

    // Also clean up the main program's devices array
    // Recursively search through all blocks in the program to find and clean up device entries
    const cleanupDevicesInBlock = (block: any[]) => {
      if (!block || !Array.isArray(block)) return;

      // Check if this block has a devices array
      for (const stmt of block) {
        if (stmt.devices && Array.isArray(stmt.devices)) {
          // Keep only devices that have valid UUIDs
          stmt.devices = stmt.devices.filter((device: any) =>
            validDeviceUuids.has(device.uuid) ||
            // Keep devices that don't belong to this procedure
            !device.uuid.startsWith(this.statement._uuid.substring(0, 8))
          );
        }

        // Recursively check nested blocks
        if (stmt.block && Array.isArray(stmt.block)) {
          cleanupDevicesInBlock(stmt.block);
        }
      }
    };

    // Start the cleanup from the program's root block
    cleanupDevicesInBlock(this.program.block);

    console.log('Cleaned up orphaned device entries. Valid UUIDs:',
      Array.from(validDeviceUuids),
      'Remaining devices:', procedureEntry.devices.length);
  }

  //#region Templates
  multipleArgumentTemplate(argumentsArray: Argument[]) {
    return html`
      <editor-button class="expr-arg" @click="${() => this.multipleArgsModalRef.value.showModal()}">
        <div style="display: flex; gap: 4px; align-items: center;">
          <editor-icon .icon="${icons.threeDots}"></editor-icon>
          <div>Arguments</div>
        </div>
      </editor-button>
      <editor-modal ${ref(this.multipleArgsModalRef)} .modalTitle="${'Set Arguments'}">
        <div class="statement-arguments-wrapper">
          ${argumentsArray.map(
            (arg, i) =>
              html`
                <ge-statement-argument
                  .argument="${arg}"
                  .argPosition="${i}"
                  .stmtId="${this.statement.id}"
                  .showLabel="${true}"
                  .variableKey="${this.statement.id === 'setvar' && arg.type === Types.unknown
                    ? (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0].value
                    : null}">
                </ge-statement-argument>
              `
          )}
          <editor-button class="ok-button" @click="${() => this.multipleArgsModalRef.value.hideModal()}">
            <editor-icon .icon="${icons.checkLg}"></editor-icon>
            <span>OK</span>
          </editor-button>
        </div>
      </editor-modal>
    `;
  }

  statementTemplate(hasNestedBlock: boolean) {
    // Add defensive checks to prevent errors when statement or language data is missing
    if (!this.statement || !this.statement.id || !this.language || !this.language.statements) {
      console.error('Missing required data for rendering statement:',
        { statement: this.statement, language: this.language });
      return html`<div class="error-statement">Error: Invalid statement data</div>`;
    }

    // Check if the statement exists in the language
    if (!this.language.statements[this.statement.id]) {
      console.error(`Statement with ID "${this.statement.id}" not found in language statements`);
      return html`<div class="error-statement">Error: Unknown statement type: ${this.statement.id}</div>`;
    }

    const statementDef = this.language.statements[this.statement.isInvalid ? '_err' : this.statement.id];
    const isUserProcedure = statementDef.isUserProcedure || false;

    return html`
      <div
        ${ref(this.statementHeaderRef)}
        class="statement-header ${!hasNestedBlock || !this.nestedBlockVisible ? 'bottom-radius' : ''} ${isUserProcedure
          ? 'user-proc'
          : ''}">
        <div class="statement-label-wrapper">
          ${statementDef.icon
            ? html`
                <editor-icon
                  class="stmt-icon"
                  title="Show Help"
                  @click="${this.handleShowStmtDescModal}"
                  .icon="${icons[statementDef.icon] || icons.questionCircle}"
                  .color="${statementDef.foregroundColor}"
                  .width="${24}"
                  .height="${24}">
                </editor-icon>
                ${this.language.statements[this.statement.id].description
                  ? html`
                      <editor-modal
                        class="stmt-desc-modal"
                        .modalTitle="${`Help for "${this.language.statements[this.statement.id].label}" statement`}"
                        .modalIcon="${icons.questionCircle}"
                        ${ref(this.stmtDescModalRef)}>
                        <div class="stmt-desc-inner-wrapper">
                          <div class="stmt-desc-item-wrapper">
                            <div class="stmt-desc-label">Description</div>
                            <div class="stmt-brief-desc-wrapper">
                              ${this.language.statements[this.statement.id].description.brief}
                            </div>
                          </div>
                          ${this.language.statements[this.statement.id].description.example
                            ? html`
                                <div class="stmt-desc-item-wrapper">
                                  <div class="stmt-desc-label">Example</div>
                                  <div class="stmt-brief-desc-wrapper">
                                    ${this.language.statements[this.statement.id].description.example.description}
                                  </div>
                                </div>
                                <div>
                                  ${this.exampleBlockIsVisible
                                    ? html`
                                        <div class="divider"></div>
                                        <ge-block
                                          .isExample="${true}"
                                          .block="${this.language.statements[this.statement.id].description.example
                                            .block}">
                                        </ge-block>
                                      `
                                    : nothing}
                                </div>
                              `
                            : nothing}
                        </div>
                      </editor-modal>
                    `
                  : nothing}
              `
            : nothing}

          <div class="statement-label">${statementDef.label || 'Unknown Statement'}</div>
        </div>
        ${(() => {
          // Check if statement has arguments
          const stmt = this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs;
          if (!stmt.arguments) {
            return nothing;
          }

          // Check if arguments is an array
          if (!Array.isArray(stmt.arguments)) {
            return nothing;
          }

          // Handle single argument
          if (stmt.arguments.length === 1) {
            return html`
              <ge-statement-argument
                ?disabled="${this.statement.isInvalid || this.skeletonizeMode}"
                .argument="${stmt.arguments[0]}"
                .argPosition="${0}"
                .stmtId="${this.statement.id}"
                .isExample="${this.isExample}">
              </ge-statement-argument>
            `;
          }

          // Handle multiple arguments
          return this.multipleArgumentTemplate(stmt.arguments);
        })()}
        <div class="statement-controls">
          ${this.language.statements[this.statement.id]?.isUserProcedure && !this.isProcBody
            ? html`
              <div class="device-count ${this.areAllDevicesInitialized() ? 'device-count-complete' : 'device-count-incomplete'}"
                   title="Initialized devices / Total device blocks">
                ${this.initializedDeviceCount}/${this.totalDeviceCount}
              </div>
            `
            : nothing
          }
          <div class="statement-controls-modal-wrapper">
            ${!this.isExample && !this.skeletonizeMode && !(this.isProcBody && this.editorMode === 'initialize' && this.restrainedMode)
              ? html`
                  <editor-button
                    @click="${this.handleToggleStatementControlsModal}"
                    title="Statement Controls"
                  >
                    <editor-icon .icon="${icons.list}"></editor-icon>
                  </editor-button>
                  <editor-modal
                    class="statement-controls-modal"
                    .displayType="${'dialog'}"
                    .titleIsVisible="${false}"
                    ?hideCloseButton="${true}"
                    ${ref(this.statementControlsModalRef)}>
                    <div class="statement-controls-buttons">
                      <editor-button @click="${this.handleMoveStatementUp}" title="Move statement up">
                        <editor-icon .icon="${icons.arrowUp}"></editor-icon>
                        Move Up
                      </editor-button>
                      <editor-button @click="${this.handleMoveStatementDown}" title="Move statement down">
                        <editor-icon .icon="${icons.arrowDown}"></editor-icon>
                        Move Down
                      </editor-button>
                      <editor-button
                        @click="${this.handleRemoveStatement}"
                        title="Remove Statement"
                        class="remove-statement-button">
                        <editor-icon .icon="${icons.trash}"></editor-icon>
                        Delete
                      </editor-button>
                    </div>
                  </editor-modal>
                `
              : nothing}
          </div>
          ${(this.statement as CompoundStatement).block && !this.skeletonizeMode && !(this.isProcBody && this.editorMode === 'initialize' && this.restrainedMode)
            ? html`
                <div @click="${this.handleToggleNestedBlockVisibility}" class="expand-nested-block-button">
                  <editor-icon
                    .icon="${this.nestedBlockVisible ? icons.chevronDown : icons.chevronRight}"
                    .width="${18}"
                    .height="${18}"
                    title="Show Block"></editor-icon>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }
  //#endregion

  //#region Render
  render() {
    // Add defensive checks to prevent errors when statement or language data is missing
    if (!this.statement || !this.statement.id || !this.language || !this.language.statements) {
      console.error('Missing required data for rendering statement:',
        { statement: this.statement, language: this.language });
      return html`<div class="error-statement">Error: Invalid statement data</div>`;
    }

    // Check if the statement exists in the language
    if (!this.language.statements[this.statement.id]) {
      console.error(`Statement with ID "${this.statement.id}" not found in language statements`);
      return html`<div class="error-statement">Error: Unknown statement type: ${this.statement.id}</div>`;
    }

    const statementDef = this.language.statements[this.statement.isInvalid ? '_err' : this.statement.id];
    const isCompoundStatement = !!(this.statement as CompoundStatement).block;
    const isUserProcedure = statementDef.isUserProcedure && !this.isProcBody;

    return html`
      <div
        class="statement-wrapper ${this.isHighlighted || this.isSelected ? 'highlight-active' : ''}"
        uuid="${this.statement._uuid || ''}"
        @click="${() => {
          // Always dispatch the toggle-statement-selection event
          // The parent component will decide what to do based on the mode
          if (this.statement.isInvalid) {
            console.log(`Skipping invalid block with UUID: ${this.statement._uuid}`);
            return;
          }

          // For device statements in initialize mode, or for any statement in skeletonize mode
          const event = new CustomEvent('toggle-statement-selection', {
            bubbles: true,
            composed: true,
            detail: { uuid: this.statement._uuid },
          });
          this.dispatchEvent(event);
        }}">
        ${isCompoundStatement
          ? html`
              ${this.statementTemplate(true)}
              <ge-block
                ${ref(this.statementNestedBlockRef)}
                style="background-color: ${statementDef.backgroundColor || '#cccccc'}aa;"
                class="nested ${this.nestedBlockVisible ? '' : 'hidden'} ${this.isHighlighted ? 'highlight-active' : ''}"
                .block="${(this.statement as CompoundStatement).block}"
                .parentStmt="${this.statement}"
                .isProcBody="${this.isProcBody}"
                .skeletonizeMode="${this.skeletonizeMode}"
                .restrainedMode="${this.restrainedMode}"
                .tmpUUID="${this.uuidMetadata}"
                .editorMode="${this.editorMode}"
                @click="${(e: Event) => {
                  e.stopPropagation();
                  const event = new CustomEvent('nested-click', {
                    bubbles: true,
                    composed: true,
                    detail: { uuid: this.statement._uuid },
                  });
                  this.dispatchEvent(event);
                }}">
              </ge-block>
            `
          : isUserProcedure
          ? html`
              <editor-button
                @click="${this.handleShowProcDef}"
                class="user-proc-wrapper"
                ?disabled="${this.skeletonizeMode}">
                ${this.statementTemplate(false)}
              </editor-button>
              <editor-modal
                ${ref(this.procModalRef)}
                .modalTitle="${statementDef.label || 'User Procedure'}"
                .modalIcon="${icons[statementDef.icon || 'lightningChargeFill']}"
                .backgroundColor="${statementDef.backgroundColor || '#d946ef'}"
                .foregroundColor="${statementDef.foregroundColor || '#ffffff'}"
                .isFullWidth="${true}"
                .isFullHeight="${true}"
                .isFromBody="${true}">
                <ge-block
                  .isProcBody="${true}"
                  .isExample="${this.isExample}"
                  .block="${this.procedureBlockCopy}"
                  .skeletonizeMode="${this.skeletonizeMode}"
                  .restrainedMode="${this.restrainedMode}"
                  .tmpUUID="${this.uuidMetadata}"
                  .editorMode="${this.editorMode}"
                  .parentProcedureUuid="${this.statement._uuid}">
                </ge-block>
              </editor-modal>
            `
          : this.statementTemplate(false)}
      </div>
    `;
  }
  //#endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'ge-statement': GEStatement;
  }
}
