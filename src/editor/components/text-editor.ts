import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { Program, analyzeBlock } from '@/vpl/program';
import { consume } from '@lit/context';
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
    if (this.program && this.program.block) {
      this.textEditorValue = JSON.stringify(this.program.exportProgramBlock(this.program.block), null, '  ');
    }
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    // If the textEditorValue property was changed externally, update the program
    if (changedProperties.has('textEditorValue') && !this.textEditorValueIsInvalid) {
      try {
        console.log('Text editor value changed externally, updating program');
        // Only update the program if the value is valid JSON and different from current program
        const newValue = JSON.parse(this.textEditorValue);
        const currentValue = this.program.exportProgramBlock(this.program.block);

        // Check if the new value is different from the current program
        if (JSON.stringify(newValue) !== JSON.stringify(currentValue)) {
          this.program.loadProgramBody(newValue);
          analyzeBlock(this.program.block, this.language.statements, null);
          console.log('Program updated from text editor value change');
        }
      } catch (error) {
        console.error('Error updating program from text editor value:', error);
        this.textEditorValueIsInvalid = true;
      }
    }
  }
  //#endregion

  handleTextEditorValueChange(e: Event) {
    this.textEditorValueIsInvalid = false;
    const newValue = (e.currentTarget as HTMLTextAreaElement).value;

    // Only update if the value has actually changed
    if (newValue !== this.textEditorValue) {
      this.textEditorValue = newValue;

      try {
        // Parse the new value and check if it's different from the current program
        const parsedValue = JSON.parse(this.textEditorValue);
        const currentValue = this.program.exportProgramBlock(this.program.block);

        // Only update the program if the content has actually changed
        if (JSON.stringify(parsedValue) !== JSON.stringify(currentValue)) {
          console.log('Text editor value changed by user, updating program');
          this.program.loadProgramBody(parsedValue);
          analyzeBlock(this.program.block, this.language.statements, null);

          // Dispatch the update event
          const event = new CustomEvent(textEditorCustomEvent.PROGRAM_UPDATED, {
            bubbles: true,
            composed: true,
            detail: { source: 'user-input' }
          });
          this.dispatchEvent(event);
        }
      } catch (error) {
        console.error('Error parsing text editor value:', error);
        this.textEditorValueIsInvalid = true;
      }

      this.requestUpdate();
    }
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
