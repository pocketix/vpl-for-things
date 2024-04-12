import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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
  //#endregion

  //#region Lifecycle
  connectedCallback() {
    super.connectedCallback();
    this.textEditorValue = JSON.stringify(this.program.block, null, ' ');
  }

  firstUpdated() {}
  //#endregion

  //#region Methods
  debounce(callback, delay) {
    let timer;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        callback();
      }, delay);
    };
  }
  //#endregion

  handleTextEditorValueChange(e: Event) {
    this.textEditorValueIsInvalid = false;
    this.textEditorValue = (e.currentTarget as HTMLTextAreaElement).value;

    try {
      this.program.block = JSON.parse(this.textEditorValue);
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
