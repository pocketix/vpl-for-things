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
        max-width: 1600px;
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
  @property({ attribute: false }) onProgramChange?: (program: Program) => void;
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
  program: Program = new Program();
  //#endregion

  /**
   * Updates the program and dispatches a change event
   * @param newProgram The new program to set (Program object or JSON string/object)
   */
  // Use a different method name to avoid conflict with LitElement properties
  setVplProgram(newProgram: Program | string | object) {
    console.log('Updating program in VPL editor');

    let programToUse: Program;

    // Handle different input types
    if (newProgram instanceof Program) {
      // If it's already a Program instance, use it directly
      programToUse = newProgram as Program;
    } else if (typeof newProgram === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        const parsedData = JSON.parse(newProgram);
        programToUse = new Program();
        programToUse.loadProgram(parsedData);
      } catch (error) {
        console.error('Failed to parse program string as JSON:', error);
        return; // Exit early if parsing fails
      }
    } else if (typeof newProgram === 'object' && newProgram !== null) {
      // If it's an object (but not a Program), treat it as program data
      try {
        programToUse = new Program();
        programToUse.loadProgram(newProgram);
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

    // Analyze the program to ensure it's properly initialized
    analyzeBlock(this.program.block, this.language.statements, null);
    for (let userProcId of Object.keys(this.program.header.userProcedures)) {
      analyzeBlock(this.program.header.userProcedures[userProcId], this.language.statements, null);
    }

    // Update the text editor if it's initialized
    if (this.textEditorRef.value) {
      this.textEditorRef.value.textEditorValue = JSON.stringify(
        this.program.exportProgramBlock(this.program.block),
        null,
        '  '
      );
    }

    // Update the graphical editor if it's initialized
    if (this.graphicalEditorRef.value) {
      this.graphicalEditorRef.value.requestUpdate();
    }

    // Request an update to refresh the UI
    this.requestUpdate();

    // Dispatch a change event to notify listeners
    this.dispatchEvent(new CustomEvent('change', {
      detail: programToUse,
      bubbles: true,
      composed: true
    }));

    // Dispatch PROGRAM_UPDATED events for compatibility with existing code
    this.dispatchEvent(new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      detail: { programBodyUpdated: true },
      bubbles: true,
      composed: true
    }));

    // Also dispatch the text editor program updated event for full compatibility
    this.dispatchEvent(new CustomEvent(textEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Expose updateProgram method to be accessible from outside the shadow DOM
   * This allows direct method calls on the element reference
   */
  static get formAssociated() { return true; }

  //#region Lifecycle
  constructor() {
    super();
    this.addEventListener(textEditorCustomEvent.PROGRAM_UPDATED, (_e: CustomEvent) => {
      this.handleTextEditorProgramUpdated();
      // Notify parent component about program changes
      if (this.onProgramChange) {
        this.onProgramChange(this.program);
      }
      // Dispatch change event is handled in handleTextEditorProgramUpdated()
    });
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, (_e: CustomEvent) => {
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

    // window.onbeforeunload = function () {
    //   return 'Changes may be lost!';
    // };
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

    (this.shadowRoot.host as HTMLElement).setAttribute(
      'style',
      this.width && this.height ? `width: ${this.width}px; height: ${this.height}px;` : ''
    );
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    // If the program property was changed externally, update the internal state
    if (changedProperties.has('program') && this.program) {
      // Analyze the program to ensure it's properly initialized
      analyzeBlock(this.program.block, this.language.statements, null);
      for (let userProcId of Object.keys(this.program.header.userProcedures)) {
        analyzeBlock(this.program.header.userProcedures[userProcId], this.language.statements, null);
      }

      // Update the text editor if it's initialized
      if (this.textEditorRef.value) {
        this.textEditorRef.value.textEditorValue = JSON.stringify(
          this.program.exportProgramBlock(this.program.block),
          null,
          '  '
        );
      }

      this.requestUpdate();
    }
  }
  //#endregion

  //#region Handlers
  handleTextEditorProgramUpdated() {
    this.graphicalEditorRef.value.requestUpdate();
    this.dispatchEvent(new CustomEvent('change', {
      detail: this.program,
      bubbles: true,
      composed: true
    }));
  }

  handleGraphicalEditorProgramUpdated() {
    // Source for deepQuerySelectorAll function: https://gist.github.com/Haprog/848fc451c25da00b540e6d34c301e96a#file-deepqueryselectorall-js-L7
    function deepQuerySelectorAll(selector: string, root: Element | Document | ShadowRoot) {
      root = root || document;
      const results = Array.from(root.querySelectorAll(selector));
      const pushNestedResults = function (root: Element | Document | ShadowRoot) {
        deepQuerySelectorAll(selector, root).forEach((elem) => {
          if (!results.includes(elem)) {
            results.push(elem);
          }
        });
      };

      // Check if root is an Element with shadowRoot
      if ('shadowRoot' in root && root.shadowRoot) {
        pushNestedResults(root.shadowRoot);
      }

      for (const elem of root.querySelectorAll('*')) {
        if (elem.shadowRoot) {
          pushNestedResults(elem.shadowRoot);
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

    // Notify parent component about program changes
    if (this.onProgramChange) {
      this.onProgramChange(this.program);
    }

    // Dispatch change event
    this.dispatchEvent(new CustomEvent('change', {
      detail: this.program,
      bubbles: true,
      composed: true
    }));
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
  //#endregion

  //#region Render
  render() {
    return html`
      <editor-controls></editor-controls>
      <div class="editor-view-wrapper">
        <graphical-editor ${ref(this.graphicalEditorRef)}></graphical-editor>
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
  }
}
