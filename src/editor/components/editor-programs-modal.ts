import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { EditorModal } from './editor-modal';
import { Ref, createRef, ref } from 'lit/directives/ref.js';

@customElement('editor-programs-modal')
export class EditorProgramsModal extends LitElement {
    static styles = css`
    /* Add any styles for the modal here */
    `;

    @property({ type: Boolean }) open = false;

    modalRef: Ref<EditorModal> = createRef();

    showModal() {
        this.modalRef.value.showModal();
    }

    hideModal() {
        this.modalRef.value.hideModal();
    }

    render() {
        return html`
        <editor-modal ${ref(this.modalRef)} .modalTitle="${'Programs'}">
            <div>
            <!-- Add content for the programs modal here -->
            <p>Programs modal content goes here.</p>
            </div>
        </editor-modal>
        `;
    }
}
