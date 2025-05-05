import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Language, Statement, Statements } from '@/vpl/language';
import { Block, CompoundStatement, Program, ProgramStatement, analyzeBlock } from '@/vpl/program';
import { languageContext, programContext } from '@/editor/context/editor-context';
import {
  editorControlsCustomEvent,
  graphicalEditorCustomEvent,
  statementCustomEvent,
  textEditorCustomEvent,
} from '../editor-custom-events';
import { TextEditor } from './text-editor';
import { GraphicalEditor } from './graphical-editor';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { exampleDevices } from '@/vpl/example.devices';
import { globalStyles } from '../global-styles';
import { EditorControls } from './editor-controls';
import { initPreventEscClose } from '../init-prevent-esc';

@customElement('vpl-editor')
export class VplEditor extends LitElement {
  //#region Styles
  static styles = [
    globalStyles,
    css`
      :host {
        font-family: var(--main-font);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        position: relative;
        width: 100%;
        max-width: 1200px;
      }

      .editor-view-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: center;
      }
    `,
  ];
  //#endregion

  //#region Props
  @property() width?: number;
  @property() height?: number;
  @property() isSmallScreen: boolean = document.body.clientWidth < 800;
  @property() viewMode: string = 'split';
  @property({ type: Boolean }) skeletonizeMode: boolean = false;
  @property({ attribute: false }) onProgramChange?: (program: Program) => void;

  // Property to allow parent components to pass in a program
  private _initialProgram: any = null;

  @property({ attribute: false })
  set initialProgram(value: any) {
    if (value) {
      console.log('Initial program set:', value);
      this._initialProgram = value;
      this.updateProgram(value);
    }
  }

  get initialProgram() {
    return this._initialProgram;
  }

  // Property to allow parent components to pass in custom devices
  private _customDevices: any = null;

  @property({ attribute: false })
  set devices(value: any) {
    if (value) {
      console.log('Custom devices set:', value);
      this._customDevices = value;
      this.setVplDevices(value);
    }
  }

  get devices() {
    return this._customDevices;
  }
  //#endregion

  //#region Refs
  textEditorRef: Ref<TextEditor> = createRef();
  graphicalEditorRef: Ref<GraphicalEditor> = createRef();
  //#endregion

  //#region Context
  @provide({ context: languageContext })
  @property({ attribute: false })
  language = new Language(exampleDevices);

  @provide({ context: programContext })
  @property({ attribute: false })
  program = new Program();
  //#endregion

  // Add missing TypeScript declarations
  declare shadowRoot: ShadowRoot;
  declare addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => void;
  declare requestUpdate: (name?: PropertyKey, oldValue?: unknown) => Promise<void>;
  declare dispatchEvent: (event: Event) => boolean;

  // Helper methods for dispatching events
  private dispatchGraphicalEditorProgramUpdatedEvent(): void {
    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      detail: { programBodyUpdated: true },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  private dispatchTextEditorProgramUpdatedEvent(): void {
    const event = new CustomEvent(textEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  /**
   * Updates the devices in the language context
   * @param newDevices The new devices to set (Device[] array)
   */
  setVplDevices(newDevices: any): void {
    console.log('Updating devices in VPL editor');

    if (!Array.isArray(newDevices)) {
      console.error('Invalid devices type. Expected an array of Device objects.');
      return; // Exit early
    }

    // Clear only the device-related properties
    // Remove existing device variables
    Object.keys(this.language.variables).forEach(key => {
      if (key.includes('.')) { // Device variables contain a dot (deviceName.attribute)
        delete this.language.variables[key];
      }
    });

    // Remove existing device statements
    Object.keys(this.language.statements).forEach(key => {
      if (key.includes('.')) { // Device statements contain a dot (deviceName.function)
        delete this.language.statements[key];
      }
    });

    // Clear device lists
    this.language.deviceList = [];
    this.language.deviceListWithTypes = {};
    this.language.uniqueDeviceTypes = [];

    // Process the new devices
    for (let device of newDevices) {
      // Converts device attributes to language variables.
      for (let attr of device.attributes) {
        this.language.variables[`${device.deviceName}.${attr}`] = { type: 'device', label: `${device.deviceName}.${attr}` };
      }

      // Converts device functions to language statements.
      for (let func of device.functions) {
        this.language.statements[`${device.deviceName}.${func.label}`] = {
          ...func,
          deviceName: device.deviceName,
          label: `${device.deviceName}.${func.label}`,
        };
      }

      // Store device type in deviceListWithTypes
      this.language.deviceListWithTypes[device.deviceName] = device.deviceType;

      // Add device type to uniqueDeviceTypes if not already present
      if (!this.language.uniqueDeviceTypes.includes(device.deviceType)) {
        this.language.uniqueDeviceTypes.push(device.deviceType);
      }

      // Do not include devices with no functions
      if (device.functions.length > 0) {
        this.language.deviceList.push(device.deviceName);
      }
    }

    console.log('Device List:', this.language.deviceList);
    console.log('Device deviceListWithTypes:', this.language.deviceListWithTypes);
    console.log('Unique Device Types:', this.language.uniqueDeviceTypes);

    // Request an update to refresh the UI
    this.requestUpdate();

    // Dispatch events to update child components
    this.dispatchGraphicalEditorProgramUpdatedEvent();
    this.dispatchTextEditorProgramUpdatedEvent();

    console.log('Devices update complete');
  }

  /**
   * Updates the program and dispatches a change event
   * @param newProgram The new program to set (Program object or JSON string/object)
   */
  setVplProgram(newProgram: Program | string | object): void {
    console.log('Updating program in VPL editor');

    let importedProgram: any = null;

    // Handle different input types
    if (newProgram instanceof Program) {
      // If it's already a Program instance, use it directly
      importedProgram = newProgram.exportProgram();
      console.log('Program instance provided:', importedProgram);
    } else if (typeof newProgram === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        importedProgram = JSON.parse(newProgram);
        console.log('String program parsed:', importedProgram);
      } catch (error) {
        console.error('Failed to parse program string as JSON:', error);
        return; // Exit early if parsing fails
      }
    } else if (typeof newProgram === 'object' && newProgram !== null) {
      // If it's an object (but not a Program), treat it as program data
      importedProgram = newProgram;
      console.log('Object program provided:', importedProgram);
    } else {
      // Invalid input type
      console.error('Invalid program type. Expected Program instance, JSON string, or object.');
      return; // Exit early
    }

    // Validate the program structure
    if (!importedProgram.header || !importedProgram.block) {
      console.error("The program does not contain a valid structure (missing header or block).");
      return;
    }

    // Use the same logic as the import program button
    this.program.loadProgram(importedProgram);

    // Register user procedures in the language context
    for (let proc of Object.keys(importedProgram.header.userProcedures || {})) {
      this.language.statements[proc] = {
        type: 'unit',
        group: 'misc',
        label: proc,
        icon: 'lightningChargeFill',
        foregroundColor: importedProgram.header.userProcedures[proc].foregroundColor || '#ffffff',
        backgroundColor: importedProgram.header.userProcedures[proc].backgroundColor || '#d946ef',
        isUserProcedure: true,
      };
    }

    // Request an update to refresh the UI
    this.requestUpdate();

    // Dispatch events to update child components
    this.dispatchGraphicalEditorProgramUpdatedEvent();
    this.dispatchTextEditorProgramUpdatedEvent();

    // Dispatch a change event to notify listeners
    this.dispatchEvent(new CustomEvent('change', {
      detail: this.program,
      bubbles: true,
      composed: true
    }));

    console.log('Program update complete');
  }

  //#region Lifecycle
  constructor() {
    super();
    this.addEventListener(textEditorCustomEvent.PROGRAM_UPDATED, (_: CustomEvent) => {
      this.handleTextEditorProgramUpdated();
    });
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, (_: CustomEvent) => {
      this.handleGraphicalEditorProgramUpdated();
    });
    this.addEventListener(editorControlsCustomEvent.EDITOR_VIEW_CHANGED, (e: CustomEvent) => {
      this.handleChangeEditorView(e.detail.newView);
      this.viewMode = e.detail.newView;
      this.requestUpdate();
    });

    window.addEventListener('resize', () => {
      if (document.body.clientWidth < 800) {
        this.isSmallScreen = true;
      } else {
        this.isSmallScreen = false;
      }
    });

    window.onbeforeunload = function () {
      return 'Changes may be lost!';
    };
  }

  connectedCallback() {
    super.connectedCallback();

    // Expose the program update method on the element itself for external access
    // This makes it accessible from outside the shadow DOM
    const host = this.shadowRoot.host as any;

    // This is the method that external code will call: typedEditor.updateProgram(currentProgramData)
    host.updateProgram = this.setVplProgram.bind(this);

    // This is the method that external code will call: typedEditor.updateDevices(customDevices)
    host.updateDevices = this.setVplDevices.bind(this);

    // Set the style based on width and height properties
    (this.shadowRoot.host as HTMLElement).setAttribute(
      'style',
      this.width && this.height ? `width: ${this.width}px; height: ${this.height}px;` : ''
    );

    this.addEventListener('skeletonize-mode-changed', this.handleSkeletonizeModeChanged);

    // Initialize ESC key prevention
    initPreventEscClose();
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    // If the program property was changed externally, update the internal state
    if (changedProperties.has('program') && this.program) {
      console.log('Program property changed externally, syncing editors');

      try {
        // Analyze the program to ensure it's properly initialized
        analyzeBlock(this.program.block, this.language.statements, null);
        for (let userProcId of Object.keys(this.program.header.userProcedures)) {
          analyzeBlock(this.program.header.userProcedures[userProcId], this.language.statements, null);
        }
      } catch (error) {
        console.error('Error analyzing editors after program property change:', error);
      }
    }
  }
  //#endregion

  //#region Handlers
  handleTextEditorProgramUpdated() {
    this.graphicalEditorRef.value.requestUpdate();
  }

  handleGraphicalEditorProgramUpdated() {
    // Source for deepQuerySelectorAll function: https://gist.github.com/Haprog/848fc451c25da00b540e6d34c301e96a#file-deepqueryselectorall-js-L7
    function deepQuerySelectorAll(selector: string, root: ParentNode | null = null): Element[] {
      root = root || document;
      const results = Array.from(root.querySelectorAll(selector));
      const pushNestedResults = function (nestedRoot: ParentNode) {
        deepQuerySelectorAll(selector, nestedRoot).forEach((elem) => {
          if (!results.includes(elem)) {
            results.push(elem);
          }
        });
      };
      if ((root as Element).shadowRoot) {
        pushNestedResults((root as Element).shadowRoot as ShadowRoot);
      }
      for (const elem of root.querySelectorAll('*')) {
        if ((elem as Element).shadowRoot) {
          pushNestedResults((elem as Element).shadowRoot as ShadowRoot);
        }
      }
      return results;
    }

    analyzeBlock(this.program.block, this.language.statements, null);
    for (let userProcId of Object.keys(this.program.header.userProcedures)) {
      analyzeBlock(this.program.header.userProcedures[userProcId], this.language.statements, null);
    }

    deepQuerySelectorAll(
      'editor-button, editor-controls, editor-icon, editor-modal, ge-block, graphical-editor, text-editor, vpl-editor, editor-expression-modal, ge-statement-argument, editor-expression, editor-variables-modal, editor-expression-operand, editor-user-procedures-modal, editor-user-procedure-modal, editor-user-var-expr-modal, editor-expression-operand-list',
      this.shadowRoot
    ).forEach((elem: LitElement) => {
      elem.requestUpdate();
    });

    this.textEditorRef.value.textEditorValue = JSON.stringify(
      this.program.exportProgramBlock(this.program.block),
      null,
      '  '
    );
  }

  handleChangeEditorView(newView: 'ge' | 'te' | 'split') {
    switch (newView) {
      case 'ge':
        this.graphicalEditorRef.value.classList.remove('hidden');
        this.graphicalEditorRef.value.classList.add('flex');

        this.textEditorRef.value.classList.remove('block');
        this.textEditorRef.value.classList.add('hidden');
        break;
      case 'te':
        this.textEditorRef.value.classList.remove('hidden');
        this.textEditorRef.value.classList.add('block');

        this.graphicalEditorRef.value.classList.add('hidden');
        this.graphicalEditorRef.value.classList.remove('flex');
        break;
      case 'split':
        this.graphicalEditorRef.value.classList.remove('hidden');
        this.graphicalEditorRef.value.classList.add('flex');

        this.textEditorRef.value.classList.remove('hidden');
        this.textEditorRef.value.classList.add('block');
        break;
    }
  }

  handleSkeletonizeModeChanged(e: CustomEvent) {
    this.skeletonizeMode = e.detail.active;
    this.requestUpdate();
  }
  //#endregion

  //#region Render
  render() {
    return html`
      <editor-controls .skeletonizeMode="${this.skeletonizeMode}"></editor-controls>
      <div class="editor-view-wrapper">
        <graphical-editor .skeletonizeMode="${this.skeletonizeMode}" ${ref(this.graphicalEditorRef)}></graphical-editor>
        <text-editor
          ${ref(this.textEditorRef)}
          style="${this.isSmallScreen && this.viewMode !== 'te' ? 'display: none;' : ''}"></text-editor>
      </div>
    `;
  }
  //#endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'vpl-editor': VplEditor;
  }

  // Extend HTMLElement interface to include our custom methods
  interface HTMLElement {
    updateProgram?: (newProgram: any) => void;
    updateDevices?: (newDevices: any) => void;
    initialProgram?: any;
    devices?: any;
  }
}
