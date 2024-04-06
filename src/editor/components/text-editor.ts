import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker&inline';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker&inline';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker&inline';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker&inline';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker&inline';
import monacoEditorStyles from '../../../node_modules/monaco-editor/dev/vs/editor/editor.main.css?inline';
import { programContext } from '@/editor/context/editor-context';
import { Program } from '@/vpl/program';
import { consume, provide } from '@lit/context';
import { exampleProgram } from '@/vpl/example.program';
import { textEditorCustomEvent } from '@/editor/editor-custom-events';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { globalStyles } from '../global-styles';

@customElement('text-editor')
export class TextEditor extends LitElement {
  //#region Styles
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }
      .text-editor-container {
        width: 1000px;
        height: 500px;
        border: 1px solid gray;
      }
    `,
    css`
      ${unsafeCSS(monacoEditorStyles)}
    `,
  ];
  //#endregion

  //#region Props
  @property() monacoInstance;
  //#endregion

  //#region Refs
  textEditorContainerRef: Ref<HTMLElement> = createRef();
  //#endregion

  //#region Context
  @consume({ context: programContext })
  @property()
  program?: Program;
  //#endregion

  //#region Lifecycle
  connectedCallback() {
    super.connectedCallback();
  }

  firstUpdated() {
    this.initMonacoEditor();
  }
  //#endregion

  //#region Methods
  initMonacoEditor() {
    // Register workers
    self.MonacoEnvironment = {
      getWorker(_, label) {
        if (label === 'json') {
          return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
          return new tsWorker();
        }
        return new editorWorker();
      },
    };

    // Create monaco editor instance
    this.monacoInstance = monaco.editor.create(this.textEditorContainerRef.value, {
      value: `${JSON.stringify(this.program.block, null, ' ')}`,
      language: 'javascript',
      minimap: { enabled: false },
      // automaticLayout: true,
    });

    // Emit changes to graphical editor
    this.monacoInstance.getModel().onDidChangeContent(() => {
      this.program.block = JSON.parse(this.monacoInstance.getValue());

      const event = new CustomEvent(textEditorCustomEvent.PROGRAM_UPDATED, { bubbles: true, composed: true });
      this.dispatchEvent(event);
      this.requestUpdate();
    });
  }
  //#endregion

  //#region Render
  render() {
    return html` <div ${ref(this.textEditorContainerRef)} class="text-editor-container"></div> `;
  }
  //#endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'text-editor': TextEditor;
  }
}
