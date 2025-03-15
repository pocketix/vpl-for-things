import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { EditorModal } from './editor-modal';

@customElement('editor-programs-modal')
export class EditorProgramsModal extends LitElement {
  static styles = css`
    /* Add any styles for the modal here */
  `;

  @property({ type: Boolean }) open = false;

  showModal() {
    this.open = true;
  }

  hideModal() {
    this.open = false;
  }

  render() {
    return html`
      <editor-modal .open="${this.open}" .modalTitle="${'Programs'}">
        <div>
          <!-- Add content for the programs modal here -->
          <p>Programs modal content goes here.</p>
        </div>
      </editor-modal>
    `;
  }
}
