import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import { consume } from '@lit/context';
import { languageContext, programContext } from '../context/editor-context';
import { EditorModal, Language, Program } from '@/index';
import * as icons from '@/editor/icons';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { graphicalEditorCustomEvent, procedureEditorCustomEvent } from '../editor-custom-events';

@customElement('editor-user-procedure-init-modal')
export class EditorUserProcedureInitModal extends LitElement {
    static styles = [
        globalStyles,
        css`
        :host {
            display: block;
        }

        .procedure-init-button {
            gap: 0.25rem;
        }

        .procedure-init-modal::part(dialog-title) {
            margin-left: 34px;
        }

        .delete-proc-button {
            position: absolute;
            top: 3px;
            left: 6px;
        }
        `,
    ];

    @consume({ context: languageContext })
    @property()
    language?: Language;

    @consume({ context: programContext })
    @property()
    program?: Program;

    @property() stmtKey: string;

    procedureInitModalRef: Ref<EditorModal> = createRef();

    connectedCallback() {
        super.connectedCallback();

        // Add event listener for modal close event
        this.addEventListener('modal-close', this.handleProcedureModalClose);
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        // Remove event listener when component is disconnected
        this.removeEventListener('modal-close', this.handleProcedureModalClose);
    }

    // Handle procedure modal close event
    handleProcedureModalClose = () => {
        // Dispatch custom event to turn off skeletonize mode
        const event = new CustomEvent(procedureEditorCustomEvent.PROCEDURE_MODAL_CLOSED, {
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    handleOpenProcedureInitModal() {
        // Wait for next render cycle to ensure modal is ready
        this.updateComplete.then(() => {
        console.log('Opening initialization modal for procedure:', this.stmtKey);
        console.log('Modal reference:', this.procedureInitModalRef.value);

        if (this.procedureInitModalRef.value) {
            this.procedureInitModalRef.value.showModal();
        } else {
            console.error('Modal reference not found');
        }
        });
    }

    handleDeleteProcedure() {
        if (
        confirm(`Procedure ${this.language.statements[this.stmtKey].label} will be permanently deleted. Are you sure?`)
        ) {
        delete this.language.statements[this.stmtKey];
        delete this.program.header.userProcedures[this.stmtKey];

        this.procedureInitModalRef.value.hideModal();

        const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
        }
    }

    render() {
        // Early return if language or statement is not ready
        if (!this.language?.statements || !this.language.statements[this.stmtKey]) {
        return html``;
        }

        const statement = this.language.statements[this.stmtKey];

        return html`
        <editor-button
            class="procedure-init-button"
            @click="${() => this.handleOpenProcedureInitModal()}"
            style="${`color: ${statement.foregroundColor}; background-color: ${statement.backgroundColor}`}">
            <editor-icon .icon="${icons[statement.icon]}"></editor-icon>
            <span>${statement.label}</span>
        </editor-button>
        <editor-modal
            class="procedure-init-modal"
            ${ref(this.procedureInitModalRef)}
            .modalTitle="${statement.label}"
            .modalIcon="${icons[statement.icon]}"
            .backgroundColor="${statement.backgroundColor}"
            .foregroundColor="${statement.foregroundColor}"
            .isFullWidth="${true}"
            .isFullHeight="${true}">
            <editor-button class="delete-proc-button" @click="${this.handleDeleteProcedure}">
            <editor-icon .icon="${icons['trash']}" .color="${'var(--red-600)'}"></editor-icon>
            </editor-button>
            <ge-block .isProcBody="${true}" .block="${this.program.header.userProcedures[this.stmtKey]}" .editorMode="${'initialize'}" .restrainedMode="${true}"></ge-block>
        </editor-modal>
        `;
    }
}
