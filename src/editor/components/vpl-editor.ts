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

  // Allow passing an initial program as a string, object, or Program instance
  @property({ attribute: false })
  private _initialProgram: Program | string | object | null = null;

  get initialProgram(): Program | string | object | null {
    return this._initialProgram;
  }

  set initialProgram(value: Program | string | object | null) {
    if (value) {
      console.log('Initial program set:', value);
      this._initialProgram = value;
      this.setVplProgram(value);
    }
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
  program: Program = new Program();
  //#endregion

  setVplProgram(newProgram: Program | string | object) {
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
        console.log('program to use:', programToUse);
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

    this.dispatchEvent(new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      detail: { programBodyUpdated: true},
      bubbles: true,
      composed: true
    }));

    // We don't need to dispatch text editor events here as they can cause loops
    // The text editor will be updated directly in the final sync step below

    console.log('Program update complete');


  }

  /**
   * Expose updateProgram method to be accessible from outside the shadow DOM
   * This allows direct method calls on the element reference
   */
  static get formAssociated() { return true; }

  //#region Lifecycle
  constructor() {
    super();
    this.addEventListener(textEditorCustomEvent.PROGRAM_UPDATED, (e: CustomEvent) => {
      console.log('Text editor program updated event received', e.detail);

      // Only process the event if it came from user input
      if (e.detail && e.detail.source === 'user-input') {
        this.handleTextEditorProgramUpdated();

        // Notify parent component about program changes
        if (this.onProgramChange) {
          this.onProgramChange(this.program);
        }
        // Dispatch change event is handled in handleTextEditorProgramUpdated()
      } else {
        console.log('Ignoring non-user text editor update event to prevent loops');
      }
    });
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, (e: CustomEvent) => {
      console.log('Graphical editor program updated event received', e.detail);

      // Skip programmatic updates to prevent loops
      if (e.detail && e.detail.source === 'programmatic') {
        console.log('Ignoring programmatic graphical editor update to prevent loops');
        return;
      }

      // First update the text editor with the graphical editor changes
      this.handleGraphicalEditorProgramUpdated();

      // Notify parent component about program changes
      if (this.onProgramChange) {
        this.onProgramChange(this.program);
      }
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

    // Expose the initialProgram getter/setter for direct attribute setting
    Object.defineProperty(host, 'initialProgram', {
      get: () => {
        return this._initialProgram;
      },
      set: (value: any) => {
        if (value) {
          console.log('initialProgram set from outside:', value);
          // Avoid circular reference by calling setVplProgram directly
          this._initialProgram = value;
          this.setVplProgram(value);
        }
      },
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

          // Force a complete refresh of all components
          setTimeout(() => {
            // First update the text editor directly without triggering events
            if (this.textEditorRef.value && this.program && this.program.block) {
              try {
                const programJson = JSON.stringify(
                  this.program.exportProgramBlock(this.program.block),
                  null,
                  '  '
                );
                this.textEditorRef.value.textEditorValue = programJson;
                console.log('Text editor updated directly from program property change');
              } catch (error) {
                console.error('Error updating text editor directly:', error);
              }
            }

            // Then dispatch events to ensure the graphical editor updates
            this.dispatchEvent(new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
              detail: { programBodyUpdated: true },
              bubbles: true,
              composed: true
            }));

            // Force a thorough update after a delay
            setTimeout(() => {
              this.handleGraphicalEditorProgramUpdated();
            }, 100);
          }, 0);
        }

        this.requestUpdate();
      } catch (error) {
        console.error('Error updating editors after program property change:', error);
      }
    }
  }
  //#endregion

  //#region Handlers
  handleTextEditorProgramUpdated() {
    console.log('Text editor program updated, syncing with graphical editor');

    // First, make sure the program is properly analyzed
    analyzeBlock(this.program.block, this.language.statements, null);
    for (let userProcId of Object.keys(this.program.header.userProcedures)) {
      analyzeBlock(this.program.header.userProcedures[userProcId], this.language.statements, null);
    }

    // Then update the graphical editor
    if (this.graphicalEditorRef.value) {
      this.graphicalEditorRef.value.requestUpdate();

      // Force a thorough update of all components in the graphical editor
      setTimeout(() => {
        try {
          // Update all components in the shadow DOM
          const deepQuerySelectorAll = (selector: string, root: Element | Document | ShadowRoot) => {
            root = root || document;
            const results = Array.from(root.querySelectorAll(selector));
            const pushNestedResults = (root: Element | Document | ShadowRoot) => {
              deepQuerySelectorAll(selector, root).forEach((elem) => {
                if (!results.includes(elem)) {
                  results.push(elem);
                }
              });
            };

            if ('shadowRoot' in root && root.shadowRoot) {
              pushNestedResults(root.shadowRoot);
            }

            for (const elem of root.querySelectorAll('*')) {
              if (elem.shadowRoot) {
                pushNestedResults(elem.shadowRoot);
              }
            }
            return results;
          };

          // Update all components in the shadow DOM
          deepQuerySelectorAll(
            'editor-button, editor-controls, editor-icon, editor-modal, ge-block, graphical-editor, text-editor, vpl-editor, editor-expression-modal, ge-statement-argument, editor-expression, editor-variables-modal, editor-expression-operand, editor-user-procedures-modal, editor-user-procedure-modal, editor-user-var-expr-modal, editor-expression-operand-list',
            this.shadowRoot
          ).forEach((elem: any) => {
            if (elem.requestUpdate) {
              elem.requestUpdate();
            }
          });

          console.log('Graphical editor updated from text editor changes');
        } catch (error) {
          console.error('Error updating graphical editor from text editor:', error);
        }
      }, 50);
    }

    // Dispatch change event
    this.dispatchEvent(new CustomEvent('change', {
      detail: this.program,
      bubbles: true,
      composed: true
    }));
  }

  handleGraphicalEditorProgramUpdated() {
    console.log('Graphical editor program updated, syncing with text editor');

    // First, make sure the program is properly analyzed
    analyzeBlock(this.program.block, this.language.statements, null);
    for (let userProcId of Object.keys(this.program.header.userProcedures)) {
      analyzeBlock(this.program.header.userProcedures[userProcId], this.language.statements, null);
    }

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

    // Update all components in the shadow DOM
    deepQuerySelectorAll(
      'editor-button, editor-controls, editor-icon, editor-modal, ge-block, graphical-editor, text-editor, vpl-editor, editor-expression-modal, ge-statement-argument, editor-expression, editor-variables-modal, editor-expression-operand, editor-user-procedures-modal, editor-user-procedure-modal, editor-user-var-expr-modal, editor-expression-operand-list',
      this.shadowRoot
    ).forEach((elem: LitElement) => {
      elem.requestUpdate();
    });

    // Update the text editor with the current program
    if (this.textEditorRef.value) {
      try {
        console.log('Updating text editor from graphical editor changes');
        // Make sure we're getting the full program data, not just an empty array
        if (this.program && this.program.block && this.program.block.length > 0) {
          const programJson = JSON.stringify(
            this.program.exportProgramBlock(this.program.block),
            null,
            '  '
          );
          console.log('Program data to update text editor:', programJson);
          this.textEditorRef.value.textEditorValue = programJson;
          console.log('Text editor updated with program:', programJson);
        } else {
          console.warn('Program block is empty or invalid, not updating text editor');
        }
      } catch (error) {
        console.error('Error updating text editor from graphical editor:', error);
      }
    }

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

    // Request an update to refresh the UI
    this.requestUpdate();
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
    initialProgram?: any;
  }
}
