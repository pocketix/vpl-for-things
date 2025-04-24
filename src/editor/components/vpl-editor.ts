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
  set initialProgram(value: Program | string | object | null) {
    if (value) {
      console.log('Initial program set:', value);
      this._initialProgram = value;
      this.setVplProgram(value);
    }
  }

  get initialProgram() {
    return this._initialProgram;
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
      detail: { programBodyUpdated: true, source: 'programmatic' },
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
   * Updates the program and dispatches a change event
   * @param newProgram The new program to set (Program object or JSON string/object)
   */
  setVplProgram(newProgram: Program | string | object): void {
    console.log('Updating program in VPL editor');

    let programToUse: Program;
    let programData: any = null;

    // Handle different input types
    if (newProgram instanceof Program) {
      // If it's already a Program instance, use it directly
      programToUse = newProgram as Program;
      programData = programToUse.exportProgram();
      console.log('Program instance provided:', programData);
    } else if (typeof newProgram === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        programData = JSON.parse(newProgram);
        programToUse = new Program();
        programToUse.loadProgram(programData);
        console.log('String program parsed:', programData);
      } catch (error) {
        console.error('Failed to parse program string as JSON:', error);
        return; // Exit early if parsing fails
      }
    } else if (typeof newProgram === 'object' && newProgram !== null) {
      // If it's an object (but not a Program), treat it as program data
      try {
        programData = newProgram;
        programToUse = new Program();
        programToUse.loadProgram(programData);
        console.log('Object program loaded:', programData);
      } catch (error) {
        console.error('Failed to load program from object:', error);
        return; // Exit early if loading fails
      }
    } else {
      // Invalid input type
      console.error('Invalid program type. Expected Program instance, JSON string, or object.');
      return; // Exit early
    }

    // Update the internal program property
    this.program = programToUse;
    console.log('Program set:', this.program);

    // Analyze the program to ensure it's properly initialized
    try {
      console.log('Analyzing program blocks');
      analyzeBlock(this.program.block, this.language.statements, null);
      for (let userProcId of Object.keys(this.program.header.userProcedures)) {
        analyzeBlock(this.program.header.userProcedures[userProcId], this.language.statements, null);
      }
    } catch (error) {
      console.error('Error analyzing program blocks:', error);
    }

    // Request an update to refresh the UI
    this.requestUpdate();

    // Dispatch a change event to notify listeners
    this.dispatchEvent(new CustomEvent('change', {
      detail: this.program,
      bubbles: true,
      composed: true
    }));

    // Dispatch events to update child components
    this.dispatchGraphicalEditorProgramUpdatedEvent();
    this.dispatchTextEditorProgramUpdatedEvent();

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
    host.updateProgram = this.setVplProgram.bind(this);

    // Also expose a direct setter for the program property that will call setVplProgram
    // This provides a more React-friendly way to update the program
    Object.defineProperty(host, 'setProgram', {
      value: (newProgram: any) => {
        console.log('setProgram called with:', newProgram);
        this.setVplProgram(newProgram);
      },
      writable: false,
      configurable: true
    });

    // Expose the initialProgram setter for direct attribute setting
    Object.defineProperty(host, 'initialProgram', {
      set: (value: any) => {
        if (value) {
          console.log('initialProgram set from outside:', value);
          this.initialProgram = value;
        }
      },
      configurable: true
    });

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

        // Update the text editor if it's initialized
        if (this.textEditorRef.value) {
          console.log('Updating text editor from program property change');
          this.textEditorRef.value.textEditorValue = JSON.stringify(
            this.program.exportProgramBlock(this.program.block),
            null,
            '  '
          );
        }

        // Update the graphical editor if it's initialized
        if (this.graphicalEditorRef.value) {
          console.log('Updating graphical editor from program property change');
          this.graphicalEditorRef.value.requestUpdate();
        }
      } catch (error) {
        console.error('Error updating editors after program property change:', error);
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
    setProgram?: (newProgram: any) => void;
    initialProgram?: any;
  }
}
