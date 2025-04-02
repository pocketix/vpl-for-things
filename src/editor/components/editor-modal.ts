import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { modalCustomEvent } from '@/editor/editor-custom-events';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { globalStyles } from '../global-styles';
import { xLg } from '../icons';

type DisplayType = 'modal' | 'dialog';

@customElement('editor-modal')
export class EditorModal extends LitElement {
  //#region CSS
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
        position: absolute;
      }

      .dialog {
        /* padding: 0.75rem; */
        padding: 0;
        border: 1px solid var(--gray-300);
        border-radius: 0.5rem;
        outline: none;
        z-index: 10000;
        width: 100%;
        max-width: 100vw;
      }

      .dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
      }

      .close-btn {
        margin-left: auto;
        background-color: rgba(255, 255, 255, 0.8);
        border: none;
        box-shadow: none;
        padding: 0.25rem;
      }

      .close-btn:hover {
        background-color: var(--gray-100);
      }

      .dialog-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        overflow: auto;
        /* max-height: 500px; */
        padding: 0.75rem;
        padding-top: 0;
        height: 100%;
        /* align-items: center; */
      }

      .dialog-form-wrapper {
        display: flex;
        flex-direction: column;
        border-radius: 0.5rem;
      }

      .dialog-title {
        font-size: 1.125rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .spacer {
        margin-bottom: 0.5rem;
        border-bottom: 1px solid var(--gray-300);
      }

      @media (min-width: 450px) {
        .dialog {
          width: fit-content;
        }
      }
    `,
  ];
  //#endregion CSS

  //#region Props
  @property() modalTitle: string = 'Default title';
  @property() modalIcon?: string;
  @property() displayType: DisplayType = 'modal';
  @property() isVisible: boolean = false;
  @property() titleIsVisible: boolean = true;
  @property() closeButtonIsVisible: boolean = true;
  @property() backgroundColor: string;
  @property() foregroundColor: string;
  @property() isFullWidth?: boolean = false;
  @property() isFullHeight?: boolean = false;
  @property() isFromBody?: boolean = false;
  //#endregion Props

  //#region Refs
  dialogRef: Ref<HTMLDialogElement> = createRef();
  //#endregion Refs

  //#region Lifecycle
  constructor() {
    super();
    window.addEventListener('click', this.onOutsideClickCallback);
  }

  connectedCallback() {
    super.connectedCallback();
  }

  updated() {
    if (this.isVisible) {
      this.showModal();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('click', this.onOutsideClickCallback);
  }
  //#endregion Lifecycle

  //#region Methods
  onOutsideClickCallback = (event) => {
    if (
      !event.composedPath().some((e) => e.tagName === 'EDITOR-BUTTON') &&
      !event.composedPath().some((e) => e.tagName === 'EDITOR-MODAL')
    ) {
      this.hideModal();
    }
  };

  showModal() {
    if (this.displayType === 'modal') {
      this.dialogRef.value.showModal();
    } else if (this.displayType === 'dialog') {
      this.dialogRef.value.show();
    } else {
      return;
    }
    this.isVisible = true;
  }

  hideModal() {
    this.dialogRef.value.close();
    const event = new CustomEvent(modalCustomEvent.CLOSE, {
      bubbles: false,
      composed: true,
    });
    this.dispatchEvent(event);
    this.isVisible = false;
  }

  toggleModal() {
    if (this.isVisible) {
      this.hideModal();
    } else {
      this.showModal();
    }
  }
  //#endregion Methods

  //#region Templates
  //#endregion Templates

  //#region Render
  render() {
    if (this.isFromBody) {
      return html`
        <dialog
          ${ref(this.dialogRef)}
          class="dialog"
          part="dialog"
          style="background-color: green;
            ${this.isFullWidth ? 'width: 100%; max-width: 100vw;' : ''} 
            ${this.isFullHeight ? 'height: 100%;' : ''} 
            ${this.displayType === 'dialog' ? 'width: fit-content;' : ''}">
          <form method="dialog" class="dialog-form-wrapper">
            <div class="dialog-header">
              ${this.titleIsVisible
                ? html`
                    <div class="dialog-title" part="dialog-title">
                      ${this.modalIcon
                        ? html`<editor-icon .icon="${this.modalIcon}" .width="${18}" .height="${18}"></editor-icon>`
                        : nothing}
                      <span>${this.modalTitle}</span>
                    </div>
                  `
                : nothing}
              ${this.closeButtonIsVisible
                ? html`
                    <editor-button @click="${this.hideModal}" type="reset" class="close-btn">
                      <editor-icon .icon="${xLg}" .width="${18}" .height="${18}"></editor-icon>
                    </editor-button>
                  `
                : nothing}
            </div>
            ${this.titleIsVisible ? html`<div class="spacer"></div>` : nothing}
            <div class="dialog-content">
              <slot></slot>
            </div>
          </form>
        </dialog>
      `;
    }
  
    // Original dialog rendering
    return html`
      <dialog
        ${ref(this.dialogRef)}
        class="dialog"
        part="dialog"
        style="${this.backgroundColor ? `border: 2px solid ${this.backgroundColor};` : ''} 
          ${this.isFullWidth ? 'width: 100%; max-width: 100vw;' : ''} 
          ${this.isFullHeight ? 'height: 100%;' : ''} 
          ${this.displayType === 'dialog' ? 'width: fit-content;' : ''}">
        <form method="dialog" class="dialog-form-wrapper">
          <div class="dialog-header"
            style="${this.backgroundColor
              ? `background-color: ${this.backgroundColor}; color: ${this.foregroundColor};`
              : this.displayType === 'dialog'
              ? 'padding: 0;'
              : ''}">
            ${this.titleIsVisible
              ? html`
                  <div class="dialog-title" part="dialog-title">
                    ${this.modalIcon
                      ? html`<editor-icon .icon="${this.modalIcon}" .width="${18}" .height="${18}"></editor-icon>`
                      : nothing}
                    <span>${this.modalTitle}</span>
                  </div>
                `
              : nothing}
            ${this.closeButtonIsVisible
              ? html`
                  <editor-button @click="${this.hideModal}" type="reset" class="close-btn">
                    <editor-icon .icon="${xLg}" .width="${18}" .height="${18}"></editor-icon>
                  </editor-button>
                `
              : nothing}
          </div>
          ${this.titleIsVisible ? html`<div class="spacer"></div>` : nothing}
          <div class="dialog-content" style="${this.displayType === 'dialog' ? 'padding: 0;' : ''}">
            <slot></slot>
          </div>
        </form>
      </dialog>
    `;
  }
  
  //#endregion Render
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-modal': EditorModal;
  }
}
