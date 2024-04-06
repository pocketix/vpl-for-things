import { BoolOperators, EditorModal, Expression, GroupedExpressions, Program, compareOperators } from '@/index';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import {
  editorExpressionCustomEvent,
  expressionListCustomEvent,
  graphicalEditorCustomEvent,
} from '../editor-custom-events';
import { repeat } from 'lit/directives/repeat.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { consume, provide } from '@lit/context';
import { programContext } from '../context/editor-context';
import { v4 as uuidv4 } from 'uuid';
import { plusLg, threeDots, trash } from '../icons';

@customElement('editor-expression-list')
export class EditorExpressionList extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        border-radius: 0.5rem;
      }

      .group-relation {
        display: flex;
        justify-content: end;
        font-weight: 500;
        font-family: var(--mono-font);
      }

      .expr-controls-wrapper {
        display: flex;
        position: sticky;
        z-index: 3000;
        width: fit-content;
        margin-top: -50px;
        margin-bottom: 0.5rem;
      }

      .expr-group-buttons-wrapper {
        display: flex;
        flex-direction: column;
        border-top: 3px solid var(--gray-300);
      }

      .expr-controls-buttons-wrapper editor-button {
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

      .expr-controls-buttons-wrapper editor-button:last-child {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        border-bottom: none;
      }

      .expr-controls-modal {
        position: absolute;
        top: 34px;
      }

      .expr-controls-modal::part(dialog) {
        padding: 0;
        border: none;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      }

      .expr-group-button-relation {
        font-family: var(--mono-font);
        font-weight: 600;
      }

      .expr-group-button-relation-or {
        color: #f97316;
      }

      .expr-group-button-relation-and {
        color: #3b82f6;
      }
    `,
  ];

  @property() exprList: (Expression | GroupedExpressions)[];
  @property() selectedAddExpression: any;
  @property() groupedBy;
  @property() nestedLevel = 0;
  @property() selectedExpressions = [];
  @property() exprGroup: any;
  @property() highlightedExpr: HTMLElement;
  @property() exprIsSelected: boolean;
  @property() groupButtonsAreDisabled: boolean = true;
  @property() deleteSelectedButtonIsDisabled: boolean = true;

  @consume({ context: programContext })
  @property()
  program?: Program;

  groupByButtonsWrapperRef: Ref<HTMLElement> = createRef();
  exprControlsModalRef: Ref<EditorModal> = createRef();

  constructor() {
    super();
    this.addEventListener(editorExpressionCustomEvent.EXPRESSION_SELECTED, (e: CustomEvent) => {
      this.handleSelectExpression(e.detail.index, e.detail.selectedExpr);
      e.stopPropagation();
    });
  }

  handleAddExpression() {
    this.exprList.unshift({ opd1: null, opr: '>', opd2: null, _uuid: uuidv4() });

    this.handleHideExpressionControlsModal();

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleSelectExpression(i, selectedExpr) {
    if (this.selectedExpressions.some((expr) => expr['_uuid'] === selectedExpr['_uuid'])) {
      this.selectedExpressions.splice(
        this.selectedExpressions.findIndex((expr) => expr['_uuid'] === selectedExpr['_uuid']),
        1
      );
    } else {
      this.selectedExpressions.push(selectedExpr);
    }

    if (this.selectedExpressions.length > 0) {
      this.handleEnableRemoveSelectedButton();
    } else {
      this.handleDisableRemoveSelectedButton();
    }

    if (this.selectedExpressions.length > 1) {
      this.handleEnableGroupButtons();
    } else {
      this.handleDisableGroupButtons();
    }
    console.log(this.selectedExpressions, 'to group');
  }

  handleEnableGroupButtons() {
    this.groupButtonsAreDisabled = false;
  }

  handleDisableGroupButtons() {
    this.groupButtonsAreDisabled = true;
  }

  handleGroupExpressions(groupOpr) {
    if (this.selectedExpressions.length < 1) {
      return;
    }

    let newExprGroup = {
      exprList: [...this.selectedExpressions],
      opr: groupOpr,
      _uuid: uuidv4(),
    };

    for (let i = this.exprList.length - 1; i >= 0; i--) {
      const expr = this.exprList[i];
      if (this.selectedExpressions.some((ex) => ex['_uuid'] === expr['_uuid'])) {
        this.exprList.splice(i, 1);
      }
    }

    this.exprList.unshift(newExprGroup);

    this.selectedExpressions = [];
    this.handleDisableGroupButtons();
    this.handleDisableRemoveSelectedButton();
    this.handleHideExpressionControlsModal();

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleEnableRemoveSelectedButton() {
    this.deleteSelectedButtonIsDisabled = false;
  }
  handleDisableRemoveSelectedButton() {
    this.deleteSelectedButtonIsDisabled = true;
  }

  handleDeleteSelectedExpressions() {
    for (let i = this.exprList.length - 1; i >= 0; i--) {
      const expr = this.exprList[i];
      console.log(expr);
      if (this.selectedExpressions.some((ex) => ex['_uuid'] === expr['_uuid'])) {
        this.exprList.splice(i, 1);
      }
    }

    this.selectedExpressions = [];
    this.handleDisableRemoveSelectedButton();
    this.handleDisableGroupButtons();

    this.handleHideExpressionControlsModal();

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleExpressionControlsModalToggle() {
    this.exprControlsModalRef.value.toggleModal();
  }

  handleHideExpressionControlsModal() {
    this.exprControlsModalRef.value.hideModal();
  }

  render() {
    return html`
      ${this.exprIsSelected || this.nestedLevel === 1
        ? html`
            <div
              class="expr-controls-wrapper"
              style="top: ${(this.nestedLevel - 1) * 50}px; z-index: ${2000 - this.nestedLevel * 2 + 10};">
              <editor-button @click="${this.handleExpressionControlsModalToggle}">
                <editor-icon .icon="${threeDots}"></editor-icon>
              </editor-button>
              <editor-modal
                class="expr-controls-modal"
                .displayType="${'dialog'}"
                .titleIsVisible="${false}"
                .closeButtonIsVisible="${false}"
                ${ref(this.exprControlsModalRef)}>
                <div class="expr-controls-buttons-wrapper">
                  <editor-button class="add-expr-button" @click="${this.handleAddExpression}">
                    <editor-icon .icon="${plusLg}" .color="${'var(--green-600)'}"></editor-icon>
                    <span>Add Expression</span>
                  </editor-button>
                  <editor-button
                    class="add-expr-button"
                    @click="${this.handleDeleteSelectedExpressions}"
                    ?disabled="${this.deleteSelectedButtonIsDisabled}">
                    <editor-icon .icon="${trash}" .color="${'var(--red-600)'}"></editor-icon>
                    <span>Remove Selected</span>
                  </editor-button>
                  <div ${ref(this.groupByButtonsWrapperRef)} class="expr-group-buttons-wrapper">
                    <editor-button
                      @click="${() => this.handleGroupExpressions('&&')}"
                      ?disabled="${this.groupButtonsAreDisabled}">
                      <span>Group By</span>
                      <span class="expr-group-button-relation expr-group-button-relation-and">&&</span>
                    </editor-button>
                    <editor-button
                      @click="${() => this.handleGroupExpressions('||')}"
                      ?disabled="${this.groupButtonsAreDisabled}">
                      <span>Group By</span>
                      <span class="expr-group-button-relation expr-group-button-relation-or">||</span>
                    </editor-button>
                  </div>
                </div>
              </editor-modal>
            </div>
          `
        : nothing}
      ${repeat(
        this.exprList,
        (expr) => expr['_uuid'],
        (expr, i) => {
          return html`
            <editor-expression
              .expr="${expr}"
              .index="${i}"
              .nestedLevel="${this.nestedLevel}"
              .highlightedExpr="${this.highlightedExpr}"
              .exprListIsSelected="${this.exprIsSelected}">
            </editor-expression>
          `;
        }
      )}
    `;
  }
}
