import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Language } from '@/vpl/language';
import { Program } from '@/vpl/program';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { exampleProgram } from '@/vpl/example.program';

@customElement('vpl-editor')
export class VplEditor extends LitElement {
  static styles = [
    css`
      :host {
        font-family: var(--main-font);
        display: flex;
        flex-direction: column;
        width: 100%;
      }
    `,
  ];

  @provide({ context: languageContext })
  @state()
  private _language = new Language();

  @provide({ context: programContext })
  @state()
  private _program = new Program();

  connectedCallback() {
    super.connectedCallback();

    this._program.block = exampleProgram;

    console.log(this._language);
    console.log(this._program);
  }

  // firstUpdated() {
  //   this.shadowRoot.querySelector('#adost').addEventListener('programchanged', () => {
  //     console.log('uhbvfdbhivfdibhdfvdfibvhdfbhu');
  //   });
  // }

  handleProgramChange() {
    console.log('updatni dom');
    this.shadowRoot.querySelector('graphical-editor').requestUpdate();
  }

  handleProgramChange2() {
    this.shadowRoot
      .querySelector('text-editor')
      .monacoInstance.getModel()
      .setValue(JSON.stringify(this._program.block, null, ' '));
  }

  render() {
    return html`
      <editor-controls></editor-controls>
      <div
        @programchanged=${this.handleProgramChange}
        @programchanged2=${this.handleProgramChange2}
        style="display: flex; flex-wrap: wrap;">
        <graphical-editor></graphical-editor>
        <text-editor></text-editor>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vpl-editor': VplEditor;
  }
}
