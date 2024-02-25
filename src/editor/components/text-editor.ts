import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker&inline';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker&inline';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker&inline';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker&inline';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker&inline';
import { programContext } from '../context/editor-context';
import { Program } from '@/vpl/program';
import { consume, provide } from '@lit/context';
import { exampleProgram } from '@/vpl/example.program';
import monacoEditorStyles from '../../../node_modules/monaco-editor/dev/vs/editor/editor.main.css?inline';

@customElement('text-editor')
export class TextEditor extends LitElement {
  @consume({ context: programContext })
  _program?: Program;

  @property()
  public monacoInstance;

  static styles = [
    css`
      :host {
        display: block;
      }
      .text-editor-wrapper {
        width: 500px;
        height: 300px;
      }
    `,
    css`
      ${unsafeCSS(monacoEditorStyles)}
    `,
  ];

  connectedCallback() {
    super.connectedCallback();

    this._program.block = exampleProgram;

    console.log(this._program);
  }

  firstUpdated() {
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

    this.monacoInstance = monaco.editor.create(this.shadowRoot.querySelector('#container'), {
      value: `${JSON.stringify(this._program.block, null, ' ')}`,
      language: 'javascript',
      minimap: { enabled: false },
      // automaticLayout: true,
    });

    console.log(this.monacoInstance.getModel());

    this.monacoInstance.getModel().onDidChangeContent(() => {
      this._program.block = JSON.parse(this.monacoInstance.getValue());

      console.log(this._program.block);

      const event = new CustomEvent('programchanged', { bubbles: true, composed: true });
      console.log(event);
      this.dispatchEvent(event);
      this.requestUpdate();
    });
  }

  render() {
    return html`
      <div style="display:flex; flex-grow: 1; width: 100%; height: 100%">
        <div id="container" style="width: 500px; height: 500px; border: 1px solid grey"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'text-editor': TextEditor;
  }
}
