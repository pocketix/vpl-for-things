import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { EditorModal } from './editor-modal';

@customElement('editor-programs-modal')
export class EditorProgramsModal extends LitElement {
  static styles = css`
    .programs-modal-header {
      border-bottom: 2px solid black;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }

    .programs-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .program-item {
      padding: 0.5rem;
      border: 1px solid var(--gray-300);
      border-radius: 0.25rem;
      cursor: pointer;
    }

    .program-item:hover {
      background-color: var(--gray-100);
    }
  `;

  programsModalRef: Ref<EditorModal> = createRef();

  showModal() {
    this.programsModalRef.value.showModal();
  }

  render() {
    return html`
      <editor-modal ${ref(this.programsModalRef)} .modalTitle="${'Programs'}">
        <div class="programs-modal-header">
          <h2>Programs</h2>
        </div>
        <div class="programs-list">
          <!-- Placeholder for programs list -->
          <div class="program-item">Program 1</div>
          <div class="program-item">Program 2</div>
          <div class="program-item">Program 3</div>
        </div>
      </editor-modal>
    `;
  }
}
