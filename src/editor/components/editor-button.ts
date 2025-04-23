import { LitElement, html, css, PropertyDeclarations } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';

@customElement('editor-button')
export class EditorButton extends LitElement {
  //#region Styles
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      :host > button:first-of-type {
        font-size: 1rem;
        gap: 0.25rem;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
        padding: 0.5rem;
        border: 1px solid;
        border-radius: 0.5rem;
        background-color: white;
        border-color: var(--gray-300);
        transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        color: black;
      }

      :host > button:first-of-type:hover {
        background-color: var(--gray-50);
        border-color: var(--gray-400);
        transition-duration: 0.1s;
      }

      :host > button:first-of-type:focus {
        background-color: var(--gray-100);
      }

      :host > button:first-of-type:active {
        border-color: var(--blue-500);
      }

      :host > button:first-of-type[disabled] {
        pointer-events: none;
        opacity: 50%;
      }
    `,
  ];
  //#endregion

  //#region Props
  @property() value: any;
  @property() btnStyle: string|null = null;
  @property({type: Boolean}) disabled: boolean = false;
  @property({type: Boolean}) autofocus: boolean = false;
  //#endregion

  //#region Render
  render() {
    return html`<button ?disabled=${this.disabled} ?autofocus=${this.autofocus} part="btn" class="btn" style="${this.btnStyle}"> <slot></slot> </button>`;
  }
  //#endregion
}
