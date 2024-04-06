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
        padding: 0.75rem;
        border: 1px solid var(--gray-300);
        border-radius: 0.5rem;
        outline: none;
        z-index: 10000;
      }

      .dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
      }

      .close-btn {
        margin-left: auto;
        background-color: white;
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
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        overflow: auto;
        max-height: 500px;
      }

      .dialog-form-wrapper {
        display: flex;
        flex-direction: column;
      }

      .dialog-title {
        font-size: 1.125rem;
      }

      .spacer {
        margin-top: 0.25rem;
        margin-bottom: 0.5rem;
        border-bottom: 1px solid var(--gray-300);
      }
    `,
  ];
  //#endregion CSS

  //#region Props
  @property() modalTitle: string = 'Default title';
  @property() displayType: DisplayType = 'modal';
  @property() isVisible: boolean = false;
  @property() titleIsVisible: boolean = true;
  @property() closeButtonIsVisible: boolean = true;
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
    return html`
      <dialog ${ref(this.dialogRef)} class="dialog" part="dialog">
        <form method="dialog" class="dialog-form-wrapper">
          <div class="dialog-header">
            ${this.titleIsVisible ? html` <div class="dialog-title">${this.modalTitle}</div> ` : nothing}
            ${this.closeButtonIsVisible
              ? html`
                  <editor-button @click="${this.hideModal}" type="reset" class="close-btn">
                    <editor-icon .icon="${xLg}"></editor-icon>
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
  //#endregion Render
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-modal': EditorModal;
  }
}
