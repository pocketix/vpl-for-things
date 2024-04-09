import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Language } from '@/vpl/language';
import { Program } from '@/vpl/program';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { exampleExprProgram, exampleNumExprProgram } from '@/vpl/example.program';
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
import { EditorModal } from './editor-modal';

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
        max-width: 1000px;
      }

      .editor-view-wrapper {
        display: flex;
        flex-direction: column;
      }
    `,
  ];
  //#endregion

  //#region Props
  @property() width?: number;
  @property() height?: number;
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

  //#region Lifecycle
  constructor() {
    super();
    this.addEventListener(textEditorCustomEvent.PROGRAM_UPDATED, (e: CustomEvent) => {
      console.log('program was updated');
      this.handleTextEditorProgramUpdated();
    });
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, (e: CustomEvent) => {
      this.handleGraphicalEditorProgramUpdated();
    });
    this.addEventListener(editorControlsCustomEvent.EDITOR_VIEW_CHANGED, (e: CustomEvent) => {
      this.handleChangeEditorView(e.detail.newView);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.program.loadProgramBody(exampleExprProgram);
    console.log(this.language);
    console.log(this.program);

    this.shadowRoot.host.style = this.width && this.height ? `width: ${this.width}px; height: ${this.height}px;` : '';
  }
  //#endregion

  //#region Handlers
  handleTextEditorProgramUpdated() {
    this.graphicalEditorRef.value.requestUpdate();
  }

  handleGraphicalEditorProgramUpdated() {
    function deepQuerySelectorAll(selector, root) {
      root = root || document;
      const results = Array.from(root.querySelectorAll(selector));
      const pushNestedResults = function (root) {
        deepQuerySelectorAll(selector, root).forEach((elem) => {
          if (!results.includes(elem)) {
            results.push(elem);
          }
        });
      };
      if (root.shadowRoot) {
        pushNestedResults(root.shadowRoot);
      }
      for (const elem of root.querySelectorAll('*')) {
        if (elem.shadowRoot) {
          pushNestedResults(elem.shadowRoot);
        }
      }
      return results;
    }

    deepQuerySelectorAll(
      'editor-button, editor-controls, editor-expression-list, editor-icon, editor-modal, ge-block, graphical-editor, text-editor, vpl-editor, editor-expression-modal, ge-statement-argument, editor-expression, editor-variables-modal, editor-expression-operand',
      this.shadowRoot
    ).forEach((elem: LitElement) => {
      elem.requestUpdate();
    });

    // TODO Only for Monaco, modify for textarea.
    this.textEditorRef.value.monacoInstance.getModel().setValue(JSON.stringify(this.program.block, null, '  '));
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
        <text-editor ${ref(this.textEditorRef)}></text-editor>
      </div>
      <editor-button @click="${() => console.log(JSON.stringify(this.program.block, null, ' '))}">
        Log Program
      </editor-button>
    `;
  }
  //#endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'vpl-editor': VplEditor;
  }
}
