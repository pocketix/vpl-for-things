import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  AbstractStatementWithArgs,
  CompoundStatement,
  CompoundStatementWithArgs,
  Program,
  ProgramStatement,
  initDefaultArgumentType,
} from '@vpl/program';
import { Argument, Language } from '@vpl/language';
import { consume } from '@lit/context';
import { languageContext, programContext } from '@/editor/context/editor-context';
import {
  editorVariablesModalCustomEvent,
  graphicalEditorCustomEvent,
  statementCustomEvent,
} from '@/editor/editor-custom-events';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { globalStyles } from '../global-styles';
import * as icons from '../icons';
import { EditorModal } from './editor-modal';

@customElement('ge-statement')
export class GEStatement extends LitElement {
  //#region Styles
  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
      }

      .expr-arg {
        white-space: nowrap;
        overflow-x: auto;
        width: 100%;
      }

      .statement-controls {
        display: flex;
        gap: 0.35rem;
        margin-left: auto;
      }

      .statement-label {
        white-space: nowrap;
      }

      .statement-label-wrapper {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        /* width: 100%; */
      }

      .statement-header {
        display: flex;
        flex-direction: row;
        /* justify-content: space-between; */
        gap: 0.35rem;
        padding: 0.5rem;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
      }

      .nested {
        padding: 1rem 1rem 1rem 1rem;
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
      }

      .hidden {
        display: none;
      }

      .bottom-radius {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
      }

      .statement-controls-modal-wrapper {
        display: flex;
        position: relative;
      }

      .statement-controls-modal {
        bottom: 0;
        left: -94px;
      }

      .statement-controls-modal::part(dialog) {
        padding: 0;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      }

      .statement-controls-buttons {
        display: flex;
        flex-direction: column;
      }

      .statement-controls-buttons editor-button {
        display: flex;
        justify-items: center;
        gap: 0.25rem;
        white-space: nowrap;
        box-shadow: none;
        border: none;
        border-bottom: 1px solid var(--gray-300);
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .statement-controls-buttons editor-button:last-child {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        border-bottom: none;
      }

      .remove-statement-button {
        color: var(--red-600);
      }

      .statement-controls-expand-button {
      }

      .expand-nested-block-button {
        display: flex;
        align-items: center;
      }

      .statement-arguments-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
    `,
  ];
  //#endregion

  //#region Props
  @property() statement: ProgramStatement;
  @property() index: number;
  @property() nestedBlockVisible: boolean = false;
  //#endregion

  //#region Context
  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;
  //#endregion

  //#region Refs
  statementHeaderRef: Ref<HTMLElement> = createRef();
  statementNestedBlockRef: Ref<HTMLElement> = createRef();
  statementControlsModalRef: Ref<EditorModal> = createRef();
  multipleArgsModalRef: Ref<EditorModal> = createRef();
  //#endregion

  //#region Lifecycles

  constructor() {
    super();
    this.addEventListener(editorVariablesModalCustomEvent.VARIABLE_SELECTED, (e: CustomEvent) => {
      if (this.statement.id === 'setvar') {
        (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args[1].type = this.program.header
          .userVariables[
          (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args[0].value as string
        ]
          ? this.program.header.userVariables[
              (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args[0].value as string
            ].type
          : this.language.variables[
              (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args[0].value as string
            ]
          ? 'device'
          : 'invalid';
        (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args[1].value =
          (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args[1].type === 'bool_expr'
            ? initDefaultArgumentType('bool_expr')
            : null;

        const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(event);
      }
    });
  }

  updated() {
    this.statementHeaderRef.value.setAttribute(
      'style',
      `background-color: ${this.language.statements[this.statement.id].backgroundColor}; color: ${
        this.language.statements[this.statement.id].foregroundColor
      };`
    );

    if (this.statementNestedBlockRef.value) {
      this.statementNestedBlockRef.value.setAttribute(
        'style',
        `background-color: ${this.language.statements[this.statement.id].backgroundColor}3a; color: ${
          this.language.statements[this.statement.id].foregroundColor
        };`
      );
    }
  }
  //#endregion

  //#region Handlers

  handleToggleNestedBlockVisibility() {
    this.nestedBlockVisible = !this.nestedBlockVisible;
  }

  handleRemoveStatement() {
    const event = new CustomEvent(statementCustomEvent.REMOVE, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
  }

  handleMoveStatementUp() {
    const event = new CustomEvent(statementCustomEvent.MOVE_UP, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
  }

  handleMoveStatementDown() {
    const event = new CustomEvent(statementCustomEvent.MOVE_DOWN, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
  }

  handleToggleStatementControlsModal() {
    this.statementControlsModalRef.value.toggleModal();
  }

  handleHideStatementControlsModal() {
    this.statementControlsModalRef.value.hideModal();
  }
  //#endregion

  //#region Templates
  multipleArgumentTemplate(args: Argument[]) {
    return html`
      <editor-button class="expr-arg" @click="${() => this.multipleArgsModalRef.value.showModal()}">
        <div style="display: flex; gap: 4px; align-items: center;">
          <editor-icon .icon="${icons.threeDots}"></editor-icon>
          <div>Arguments</div>
        </div>
      </editor-button>
      <editor-modal ${ref(this.multipleArgsModalRef)} .modalTitle="${'Set Arguments'}">
        <div class="statement-arguments-wrapper">
          ${args.map(
            (arg, i) =>
              html`
                <ge-statement-argument
                  .argument="${arg}"
                  .argPosition="${i}"
                  .stmtId="${this.statement.id}"
                  .showLabel="${true}"
                  .variableKey="${this.statement.id === 'setvar' && arg.type === 'unknown'
                    ? (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args[0].value
                    : null}">
                </ge-statement-argument>
              `
          )}
        </div>
      </editor-modal>
    `;
  }

  statementTemplate(hasNestedBlock: boolean) {
    return html`
      <div
        ${ref(this.statementHeaderRef)}
        class="statement-header ${!hasNestedBlock || !this.nestedBlockVisible ? 'bottom-radius' : ''}">
        <div class="statement-label-wrapper">
          ${this.language.statements[this.statement.id].icon
            ? html`
                <editor-icon
                  .icon="${icons[this.language.statements[this.statement.id].icon]}"
                  .color="${this.language.statements[this.statement.id].foregroundColor}"
                  .width="${24}"
                  .height="${24}">
                </editor-icon>
              `
            : nothing}
          <div class="statement-label">${this.language.statements[this.statement.id].label}</div>
        </div>
        ${(this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args
          ? (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args.length === 1
            ? html`
                <ge-statement-argument
                  .argument="${(this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args[0]}"
                  .argPosition="${0}"
                  .stmtId="${this.statement.id}">
                </ge-statement-argument>
              `
            : this.multipleArgumentTemplate((this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).args)
          : nothing}
        <div class="statement-controls">
          <div class="statement-controls-modal-wrapper">
            <editor-button
              @click="${this.handleToggleStatementControlsModal}"
              title="Statement Controls"
              class="statement-controls-expand-button">
              <editor-icon .icon="${icons.list}"></editor-icon>
            </editor-button>
            <editor-modal
              class="statement-controls-modal"
              .displayType="${'dialog'}"
              .titleIsVisible="${false}"
              .closeButtonIsVisible="${false}"
              ${ref(this.statementControlsModalRef)}>
              <div class="statement-controls-buttons">
                <editor-button @click="${this.handleMoveStatementUp}" title="Move statement up">
                  <editor-icon .icon="${icons.arrowUp}"></editor-icon>
                  Move Up
                </editor-button>
                <editor-button @click="${this.handleMoveStatementDown}" title="Move statement down">
                  <editor-icon .icon="${icons.arrowDown}"></editor-icon>
                  Move Down
                </editor-button>
                <editor-button
                  @click="${this.handleRemoveStatement}"
                  title="Remove Statement"
                  class="remove-statement-button">
                  <editor-icon .icon="${icons.trash}"></editor-icon>
                  Delete
                </editor-button>
              </div>
            </editor-modal>
          </div>
          ${(this.statement as CompoundStatement).block
            ? html`
                <div @click="${this.handleToggleNestedBlockVisibility}" class="expand-nested-block-button">
                  <editor-icon
                    .icon="${this.nestedBlockVisible ? icons.chevronDown : icons.chevronRight}"
                    .width="${18}"
                    .height="${18}"
                    title="Show Block"></editor-icon>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }
  //#endregion

  //#region Render
  render() {
    return html`
      ${(this.statement as CompoundStatement).block
        ? html`
            ${this.statementTemplate(true)}
            <ge-block
              ${ref(this.statementNestedBlockRef)}
              style="background-color: ${this.language.statements[this.statement.id].backgroundColor}aa;"
              class="nested ${this.nestedBlockVisible ? '' : 'hidden'}"
              .block="${(this.statement as CompoundStatement).block}"
              .parentStmt="${this.statement}"></ge-block>
          `
        : this.statementTemplate(false)}
    `;
  }
  //#endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'ge-statement': GEStatement;
  }
}
