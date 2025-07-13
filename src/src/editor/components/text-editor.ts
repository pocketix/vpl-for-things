import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { Program, analyzeBlock } from '@/vpl/program';
import { consume, provide } from '@lit/context';
import { textEditorCustomEvent } from '@/editor/editor-custom-events';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { globalStyles } from '../global-styles';
import { Language } from '@/index';

@customElement('text-editor')
export class TextEditor extends LitElement {
  //#region Styles
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      #text-editor-content {
        resize: none;
        border: 1px solid var(--gray-300);
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        font-family: var(--mono-font);
      }

      #text-editor-content:focus {
        outline: none !important;
        border: 1px solid var(--gray-500);
      }
    `,
  ];
  //#endregion

  //#region Props
  @property() textEditorValue: string = '';
  @property() textEditorValueIsInvalid: boolean = false;
  //#endregion

  //#region Refs
  textEditorContainerRef: Ref<HTMLElement> = createRef();
  textAreaRef: Ref<HTMLElement> = createRef();
  //#endregion

  //#region Context
  @consume({ context: programContext })
  @property()
  program?: Program;

  @consume({ context: languageContext })
  @property()
  language?: Language;
  //#endregion

  //#region Lifecycle
  connectedCallback() {
    super.connectedCallback();
    this.textEditorValue = JSON.stringify(this.program.exportProgramBlock(this.program.block), null, ' ');
  }

  firstUpdated() {}
  //#endregion

  handleTextEditorValueChange(e: Event) {
    this.textEditorValueIsInvalid = false;
    this.textEditorValue = (e.currentTarget as HTMLTextAreaElement).value;

    try {
      this.program.loadProgramBody(JSON.parse(this.textEditorValue));
      analyzeBlock(this.program.block, this.language.statements, null);
    } catch (error) {
      this.textEditorValueIsInvalid = true;
    }

    const event = new CustomEvent(textEditorCustomEvent.PROGRAM_UPDATED, { bubbles: true, composed: true });
    this.dispatchEvent(event);
    this.requestUpdate();
  }

  //#region Render
  render() {
    return html`
      <div ${ref(this.textEditorContainerRef)} class="text-editor-container">
        <textarea
          ${ref(this.textAreaRef)}
          style="${this.textEditorValueIsInvalid ? 'color: var(--red-600);' : ''}"
          name="text-editor-content"
          id="text-editor-content"
          cols="50"
          rows="30"
          .value="${this.textEditorValue}"
          @input="${this.handleTextEditorValueChange}"></textarea>
      </div>
    `;
  }
  //#endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'text-editor': TextEditor;
  }
}
