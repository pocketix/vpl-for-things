import { LitElement, html, css, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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
import { breakpointsContext, isRunningContext, languageContext, parseErrorsContext, parseWarningsContext, programContext, runninBlockContext } from '@/editor/context/editor-context';
import {
  editorVariablesModalCustomEvent,
  graphicalEditorCustomEvent,
  statementCustomEvent,
} from '@/editor/editor-custom-events';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { globalStyles } from '../global-styles';
import * as icons from '../icons';
import { EditorModal } from './editor-modal';
import { BreakpointMap, ParseErrorMap, ParseWarningMap, PositionalBreakpoint } from './vpl-editor';
import Types from '@vpl/types.ts';

@customElement('ge-statement')
export class GEStatement extends LitElement {
  //#region Styles
  static styles = [//{{{
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
        height: 100%;
      }

      .statement-label-wrapper {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        position: relative;
        /* width: 100%; */
      }

      .parse-error-container {
        display: flex;
        column-gap: 0.1rem;
        position: absolute;
        top: 0;
        right: 0;
        border-radius: 0.25rem;
        transform: translateX(0.15rem) translateY(-0.15rem);
        --error-color: #c07181;
        // --warning-color: #efd0a0;
        // --warning-color: #FFD046;
        // --warning-color: #FFC20A;
        --warning-color: #ED9831;
        --warning-color-bg: #FDF5BF;


        color: var(--error-color);
        overflow-x: hidden;
        overflow-y: hidden;
        transition: height 25ms ease-out, width 35ms ease-out, overflow 20ms 35ms;
        --error-icon-width: 1rem;
        --error-icon-height: 1rem;
        z-index: 1002;
      }

      .parse-error-container[error]:not([open]),
      .parse-error-container[warning]:not([open]) {
        --num-error-badges: 1;
      }

      .parse-error-container[error][warning]:not([open]) {
        --num-error-badges: 2;
      }

      .parse-error-container:not([open]) {
        width: calc((var(--error-icon-width) * 2 + 0.3rem) * var(--num-error-badges, 1));
        // width: calc((var(--error-icon-width) * 2 + 0.2rem) * 2);

        height: calc(var(--error-icon-height) + 0.45rem);
        user-select: none;
        -webkit-user-select: none;
      }

      .parse-error-container[open] {
        background-color: color-mix(in srgb, white, var(--error-color) 50%);
        border-radius: 0.25rem;
        overflow-x: auto;
        overflow-y: auto;
        min-width: 420px;
        width: 40%;
        height: 110%;
        border: solid 1px var(--error-color);
      }

      .parse-error-container[open] .icon {
        flex: 1 0 auto;
      }

      .parse-error-container:not([open]) > .parse-error-overview {
        display: flex;
        background-color: color-mix(in srgb, white, var(--error-color) 50%);
        flex: 1 0 auto;
      }

      .parse-error-container:not([open]) > .parse-error-overview[warning] {
        background-color: var(--warning-color-bg);
        color: var(--warning-color);
      }

      .parse-error-container[open] > .parse-error-overview {
        display: none;
      }

      .parse-error-container:not([open]) > .parse-error-details {
        display: none;
      }

      .parse-error-container[open] > .parse-error-details {
        display: flex;
        background-color: color-mix(in srgb, white, var(--error-color) 50%);
      }

      .parse-error-container[open] > .parse-error-details > div[warning] {
        color: var(--warning-color);
        background-color: var(--warning-color-bg);
      }

      .parse-error-container > .parse-error-overview {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        align-items: center;
        color: var(--error-color);
        cursor: pointer;
      }

      .parse-error-container .icon {
        width: var(--error-icon-width);
        height: var(--error-icon-height);
      }

      .parse-error-container > .parse-error-overview > .num {
        margin-right: 0.1rem;
      }

      .parse-error-container > .parse-error-details {
        padding-top: 0.5rem;
        flex-direction: column;
        row-gap: 0.2rem;
      }

      .parse-error-container > .parse-error-details > .parse-error {
        padding: 0 0.5rem;
        padding-right: 1rem;
        align-items: center;
      }

      .parse-error-container > .parse-error-details > .close {
        position: absolute;
        top: 0.15rem;
        right: 0.3rem;
        height: 0.8rem;
        width: 0.8rem;
        cursor: pointer;
      }

      .parse-error-container > .parse-error-details > .close:hover {
        color: color-mix(in srgb, black, var(--error-color) 90%);
      }

      .parse-error-container > .parse-error-details > div {
        display: flex;
        flex-direction: row;
        column-gap: 0.2rem;
      }

      .breakpoint-marker,
      .breakpoint-threshold {
        --breakpoint-width: 20px;
        --breakpoint-height: 20px;
        touch-action: none;
        position: absolute;
        top: 0;
        left: 0;
      }

      .breakpoint-marker {
        transform: translateX(-20%) translateY(-20%);
        width: var(--breakpoint-width);
        height: var(--breakpoint-height);
        z-index: 1000;
        transition: opacity 0.15s ease;
      }
      .statement-header:not([running]) .breakpoint-marker {
        cursor: pointer;
      }

      .statement-header > .context-menu {
        --context-menu-border-radius: 8px;
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1001;
        background-color: #ffffff;
        border: 1px solid #ccc;
        border-radius: var(--context-menu-border-radius);
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        color: #1f194c;
        width: 200px;
        font-size: 0.9rem;
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .context-menu li {
        padding: 10px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
      }

      .context-menu li:first-child {
        border-top-right-radius: var(--context-menu-border-radius);
        border-top-left-radius: var(--context-menu-border-radius);
      }

      .context-menu li:last-child {
        border-bottom: none;
        border-bottom-right-radius: var(--context-menu-border-radius);
        border-bottom-left-radius: var(--context-menu-border-radius);
      }

      .context-menu li:hover {
        background-color: #f5f5f5;
      }


      .breakpoint-marker > .marker {
        width: 100%;
        height: 100%;
        --breakpoint-color-light: #e55765;
        --breakpoint-color-dark: #db5c5c;
        --breakpoint-color: var(--breakpoint-color-light);
        background-color: var(--breakpoint-color);
        border-radius: calc(infinity * 1px);
        border-width: 3px;
        border-color: var(--breakpoint-color);
        border-style: solid;
      }

      .breakpoint-marker[to-be-removed] {
        opacity: 50%;
      }

      .statement-header {
        position: relative;
        display: flex;
        flex-direction: row;
        /* justify-content: space-between; */
        align-items: center;
        gap: 0.35rem;
        padding: 0.5rem;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
        height: 55px;
      }

      .statement-header[breakpoint-dragging] {
        user-select: none;
      }

      .statement-header[breakpoint-dragging] > .breakpoint-threshold[dragging] {
        width: calc(var(--breakpoint-width) + 35px);
        height: calc(var(--breakpoint-height) + 35px);
        transform: translateX(-40%) translateY(-40%);
        transition: background-color 0.15s ease;
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 100%;
      }

      .statement-header[breakpoint-dragging] > .breakpoint-marker {
        cursor: grabbing;
      }

      .statement-header[breakpoint-dragging] > .breakpoint-marker > span {
        position: absolute;
        width: 100px;
        transform: translateX(-30%) translateY(-30%);
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        // border: solid 1px blue;
      }


      .statement-header[breakpoint-dragging] > .breakpoint-marker > .marker {
        width: var(--breakpoint-width);
        height: var(--breakpoint-height);
      }

      .statement-header:not([breakpoints-enabled]) > .breakpoint-marker {
        display: none;
      }

      .statement-header > .breakpoint-marker > .marker {
        visibility: hidden;
      }

      .statement-header[breakpoints-enabled]:not([running]) > .breakpoint-marker:not([visible]):hover > .marker {
        visibility: visible;
        opacity: 90%;
        // border-color: color-mix(in srgb, black, var(--breakpoint-color) 90%);
        // background-color: color-mix(in srgb, white, var(--breakpoint-color) 80%);
      }

      .statement-header[breakpoints-enabled]:not([running]) > .breakpoint-marker[visible]:hover > .marker {
        border-style: dashed;
        border-color: color-mix(in srgb, black, var(--breakpoint-color) 90%);
        background-color: color-mix(in srgb, white, var(--breakpoint-color) 80%);
      }

      .statement-header[breakpoints-enabled] > .breakpoint-marker[visible] > .marker {
        visibility: visible;
      }

      .statement-header[breakpoints-enabled] > .breakpoint-marker[visible][disabled] > .marker {
        // opacity: 45%;
        background-color: color-mix(in oklab, var(--breakpoint-color) 50%, white);
      }

      .nested {
        padding: 0.75rem;
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
        left: -110px;
      }

      .statement-controls-modal::part(dialog) {
        padding: 0;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      }

      .statement-controls-buttons {
        display: flex;
        flex-direction: column;
      }

      .statement-controls-buttons editor-button::part(btn) {
        display: flex;
        justify-items: center;
        white-space: nowrap;
        box-shadow: none;
        border: none;
        border-radius: 0;
        border-bottom: 1px solid var(--gray-300);
      }

      .statement-controls-buttons editor-button:first-child::part(btn) {
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
      }

      .statement-controls-buttons editor-button:last-child::part(btn) {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        border-bottom: none;
      }

      .remove-statement-button::part(btn) {
        color: var(--red-600);
      }

      .expand-nested-block-button {
        display: flex;
        align-items: center;
        padding-left: 4px;
        padding-right: 4px;
        cursor: pointer;
      }

      .statement-arguments-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .user-proc-wrapper::part(btn) {
        display: block;
        padding: 0;
        border: none;
        box-shadow: none;
        background: none;
      }

      .ok-button::part(btn) {
        justify-content: center;
        color: var(--green-600);
        gap: 4px;
      }

      .stmt-brief-desc-wrapper {
        max-width: 800px;
        text-align: justify;
        text-justify: inter-word;
      }

      .stmt-desc-modal {
        position: absolute;
        bottom: -4px;
      }

      .stmt-icon {
        cursor: help;
      }

      .stmt-desc-modal * {
        outline: none;
      }

      .stmt-desc-inner-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 500px;
        overflow: auto;
      }

      .stmt-desc-item-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stmt-desc-label {
        font-weight: 600;
        font-size: 1.125rem;
      }

      .divider {
        width: 100%;
        height: 1px;
        background: var(--gray-300);
        margin-bottom: 8px;
      }

      @media (min-width: 500px) {
        .statement-label {
          white-space: nowrap;
        }
      }
    `,
  ];//}}}
  //#endregion

  //#region Props
  @property({attribute: false}) statement: ProgramStatement;
  @property({type: Number}) index: number;
  @property({type: Boolean}) nestedBlockVisible: boolean = true;
  @property({type: Boolean}) isProcBody: boolean = false;
  @property({type: Boolean}) isExample: boolean = false;
  @property({type: Boolean}) exampleBlockIsVisible: boolean = false;
  //#endregion

  //#region Context
  @consume({ context: languageContext })
  @property({attribute: false})
  language?: Language;

  @consume({ context: programContext })
  @property({attribute: false})
  program?: Program;

  @consume({ context: runninBlockContext, subscribe: true })
  @property()
  runningBlock?: string;

  @consume({ context: isRunningContext, subscribe: true })
  @property({type: Boolean})
  isRunning?: boolean;

  @consume({ context: breakpointsContext, subscribe: true })
  @property({attribute: false})
  breakpoints?: BreakpointMap|null;

  @property({attribute: false})
  breakpoint: PositionalBreakpoint|null;

  @consume({ context: parseErrorsContext, subscribe: true })
  @property({ attribute: false })
  parseErrorMap: ParseErrorMap = {};

  @consume({ context: parseWarningsContext, subscribe: true })
  @property({ attribute: false })
  parseWarningMap: ParseWarningMap = {};

  //#endregion


  @state() breakpointMarkerDraggingStarted: boolean = false;
  @state() breakpointMarkerDraggingConfirmed: boolean = false;
  @state() breakpointMarkerDraggingOffset: [number, number] = [0,0];
  @state() contextMenuCloseClickListener = null;
  @state() errorDetailOpen: boolean = false;

  //#region Refs
  breakpointMarkerRef: Ref<HTMLElement> = createRef();
  breakpointMarkerContextMenuRef: Ref<HTMLElement> = createRef();
  statementHeaderRef: Ref<HTMLElement> = createRef();
  statementNestedBlockRef: Ref<HTMLElement> = createRef();
  statementControlsModalRef: Ref<EditorModal> = createRef();
  multipleArgsModalRef: Ref<EditorModal> = createRef();
  procModalRef: Ref<EditorModal> = createRef();
  stmtDescModalRef: Ref<EditorModal> = createRef();
  //#endregion

  //#region Lifecycles

  constructor() {
    super();
    this.addEventListener(editorVariablesModalCustomEvent.VARIABLE_SELECTED, (e: CustomEvent) => {
      if (this.statement.id === 'setvar') {
        (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[1].type = this.program.header
          .userVariables[
          (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0].value as string
        ]
          ? this.program.header.userVariables[
              (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0].value as string
            ].type
          : this.language.variables[
              (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0].value as string
            ]
          ? 'device'
          : 'invalid';
        (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[1].value =
          (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[1].type === Types.boolean_expression
            ? initDefaultArgumentType(Types.boolean_expression)
            : null;

        const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(event);
      }
    });
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("breakpoints")) {
      if (this.breakpoints === null || this.breakpoints === undefined) {
        this.breakpoint = null;
        return;
      }
      this.breakpoint = this.breakpoints[this.statement._uuid] ?? null;
    }
  }

  updated() {
    const bgColor = this.language.statements[this.statement.isInvalid ? "_err" : this.statement.id].backgroundColor;
    const color = this.language.statements[this.statement.isInvalid ? "_err" : this.statement.id].foregroundColor;
    const invalidStyle = this.statement.isInvalid ? "outline: 4px dashed #facc15; outline-offset: -4px; border-left: 4px solid transparent;" : null;
    const runningStyle = this.statement._uuid === this.runningBlock ? "outline: 4px dashed #0000ff; outline-offset: -4px; border-left: 4px solid transparent;" : null;

    this.statementHeaderRef.value.setAttribute(
      'style',
      `background-color: ${bgColor}; color: ${color}; ${invalidStyle ?? ""} ${runningStyle ?? ""}`
    );

    if (this.statementNestedBlockRef.value) {
      const bgColor = this.language.statements[this.statement.isInvalid ? '_err' : this.statement.id].backgroundColor;
      const color = this.language.statements[this.statement.isInvalid ? '_err' : this.statement.id].foregroundColor;
      this.statementNestedBlockRef.value.setAttribute(
        'style',
        `background-color: ${bgColor}3a; color: ${color};`
      );
    }
  }
  //#endregion

  //#region Handlers

  handleToggleNestedBlockVisibility() {
    this.nestedBlockVisible = !this.nestedBlockVisible;
  }

  handleRemoveStatement(e: Event) {
    const event = new CustomEvent(statementCustomEvent.REMOVE, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
    e.stopPropagation();
  }

  handleMoveStatementUp(e: Event) {
    const event = new CustomEvent(statementCustomEvent.MOVE_UP, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
    e.stopPropagation();
  }

  handleMoveStatementDown(e: Event) {
    const event = new CustomEvent(statementCustomEvent.MOVE_DOWN, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
    this.handleHideStatementControlsModal();
    e.stopPropagation();
  }

  handleToggleStatementControlsModal(e: Event) {
    this.statementControlsModalRef.value.toggleModal();
    e.stopPropagation();
  }

  handleHideStatementControlsModal() {
    this.statementControlsModalRef.value.hideModal();
  }

  handleShowProcDef() {
    this.procModalRef.value.showModal();
  }

  handleShowStmtDescModal(e: Event) {
    if (!this.exampleBlockIsVisible) {
      this.exampleBlockIsVisible = true;
    }
    if (this.stmtDescModalRef.value) {
      this.stmtDescModalRef.value.showModal();
    }
    e.stopPropagation();
  }
  //#endregion

  //#region Templates
  multipleArgumentTemplate(argumentsArray: Argument[]) {
    return html`
      <editor-button class="expr-arg" @click="${() => this.multipleArgsModalRef.value.showModal()}">
        <div style="display: flex; gap: 4px; align-items: center;">
          <editor-icon .icon="${icons.threeDots}"></editor-icon>
          <div>Arguments</div>
        </div>
      </editor-button>
      <editor-modal ${ref(this.multipleArgsModalRef)} .modalTitle="${'Set Arguments'}">
        <div class="statement-arguments-wrapper">
          ${argumentsArray.map(
            (arg, i) =>
              html`
                <ge-statement-argument
                  .argument="${arg}"
                  .argPosition="${i}"
                  .stmtId="${this.statement.id}"
                  .showLabel="${true}"
                  .variableKey="${this.statement.id === 'setvar' && arg.type === Types.unknown
                    ? (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0].value
                    : null}">
                </ge-statement-argument>
              `
          )}
          <editor-button class="ok-button" @click="${() => this.multipleArgsModalRef.value.hideModal()}">
            <editor-icon .icon="${icons.checkLg}"></editor-icon>
            <span>OK</span>
          </editor-button>
        </div>
      </editor-modal>
    `;
  }

  hasBreakpoint(breakpoint: PositionalBreakpoint|null): boolean {
    return breakpoint !== undefined && breakpoint !== null;
  }

  computeBreakpointTitle(breakpoint: PositionalBreakpoint|null): string {
    if (this.hasBreakpoint(breakpoint) && !breakpoint.disabled) {
      return this.isRunning ? "Enabled breakpoint" : "Disable breakpoint"
    }
    else if (this.hasBreakpoint(breakpoint)) {
      return this.isRunning ? "Disabled breakpoint" : `Enable${this.isRunning ? "d":""} breakpoint`
    }
    return this.isRunning ? "" : "Set breakpoint"
  }

  emitBreakpointChangeEvent(breakpoint: PositionalBreakpoint, remove: boolean = false) {
    const eventName = remove ? graphicalEditorCustomEvent.BREAKPOINT_REMOVED : graphicalEditorCustomEvent.BREAKPOINT_UPDATED;
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail: { breakpoint },
    });
    this.dispatchEvent(event);
  }

  handleBreakpointRemove() {
    this.emitBreakpointChangeEvent(this.breakpoint, true);
  }

  handleBreakpointConfigure() {
    // TODO(filip): configure breakpoint
  }

  handleBreakpointAdd() {
    const event = new CustomEvent(graphicalEditorCustomEvent.BREAKPOINT_ADDED, {
      bubbles: true,
      composed: true,
      detail: { blockId: this.statement._uuid },
    });
    this.dispatchEvent(event);
  }

  handleBreakpointDisable() {
    this.breakpoint.disabled = true;
    this.emitBreakpointChangeEvent(this.breakpoint);
  }

  handleBreakpointEnable() {
    this.breakpoint.disabled = false;
    this.emitBreakpointChangeEvent(this.breakpoint);
  }

  handleBreakpointMarkerClick(e: MouseEvent) {
    if (this.hasBreakpoint(this.breakpoint) && !this.breakpoint.disabled) {
      this.handleBreakpointDisable();
    }
    else if (this.hasBreakpoint(this.breakpoint)) {
      this.handleBreakpointEnable();
    }
    else {
      this.handleBreakpointAdd();
    }
  }

  handleBreakpointMarkerMouseDown(e: MouseEvent) {
    if (e.button !== 0) {
      return;
    }
    if (this.hasBreakpoint(this.breakpoint)) {
      this.breakpointMarkerDraggingStarted = true;
      this.breakpointMarkerDraggingOffset[0] = e.clientX - this.breakpointMarkerRef.value.offsetLeft;
      this.breakpointMarkerDraggingOffset[1] = e.clientY - this.breakpointMarkerRef.value.offsetTop;
    }
  }

  resetBreakpointMarkerDraggingState() {
    this.breakpointMarkerDraggingStarted = false;
    this.breakpointMarkerDraggingOffset = [0,0];
    this.breakpointMarkerRef.value.style.left = "0px";
    this.breakpointMarkerRef.value.style.top = "0px";
    this.breakpointMarkerRef.value.removeAttribute("to-be-removed");
    // this.breakpointMarkerRef.value.removeAttribute("dragging");
    this.breakpointMarkerDraggingConfirmed = false;
  }

  getBreakpointDragDistance(): [number, number] {
    const l = parseInt(this.breakpointMarkerRef.value.style.left);
    const t = parseInt(this.breakpointMarkerRef.value.style.top);
    return [l, t];
  }

  handleBreakpointMarkerMouseUp(e: MouseEvent) {
    if (e.button !== 0) {
      return;
    }
    const toBeRemoved = this.breakpointMarkerRef.value.getAttribute("to-be-removed") !== null;
    const dragging = this.breakpointMarkerRef.value.getAttribute("dragging") !== null;
    if (this.breakpointMarkerDraggingStarted) {
      this.resetBreakpointMarkerDraggingState();
      if (toBeRemoved) {
        this.handleBreakpointRemove();
      }
    }
    if (!dragging) {
      this.handleBreakpointMarkerClick(e);
    }
  }

  handleBreakpointMarkerMouseMove(e: MouseEvent) {
    if (!this.breakpointMarkerDraggingStarted) return;
    e.preventDefault();
    const xOff = e.clientX - this.breakpointMarkerDraggingOffset[0];
    const yOff = e.clientY - this.breakpointMarkerDraggingOffset[1];
    this.breakpointMarkerRef.value.style.left = `${xOff}px`;
    this.breakpointMarkerRef.value.style.top = `${yOff}px`;

    if (Math.abs(xOff) > 1 || Math.abs(yOff) > 1) {
      this.breakpointMarkerRef.value.setAttribute("dragging", "true");
      this.breakpointMarkerDraggingConfirmed = true;
    }

    const threshold = 30;
    if (Math.abs(xOff) > threshold || Math.abs(yOff) > threshold) {
      this.breakpointMarkerRef.value.setAttribute("to-be-removed", "true");
    }
    else {
      this.breakpointMarkerRef.value.removeAttribute("to-be-removed");
    }

  }

  handleBreakpointMarkerMouseLeave(e: MouseEvent) {
    if (this.breakpointMarkerDraggingStarted) {
      this.resetBreakpointMarkerDraggingState();
    }
  }

  handleBreakpointMarkerContextMenu(e: MouseEvent) {
    if (!this.hasBreakpoint(this.breakpoint)) {
      return;
    }
    e.preventDefault();
    const offsets = this.breakpointMarkerRef.value.getBoundingClientRect();
    const mouseX = e.clientX - offsets.left;
    const mouseY = e.clientY - offsets.top;
    const menu = this.breakpointMarkerContextMenuRef.value;
    menu.style.left = mouseX + "px";
    menu.style.top = mouseY + "px";
    menu.style.display = "block";

    const listener = () => {
      menu.style.display = "none";
      window.removeEventListener("click", listener);
    }
    this.contextMenuCloseClickListener = listener;
    window.addEventListener("click", listener);
  }

  closeContextMenu() {
    if (this.contextMenuCloseClickListener !== null) {
      this.contextMenuCloseClickListener();
    }
  }

  handleBreakpointContextMenuClick(e: MouseEvent, button: string) {
    e.preventDefault();
    e.stopImmediatePropagation();

    switch (button) {
      case "disable":
        this.handleBreakpointDisable();
        break;
      case "enable":
        this.handleBreakpointEnable();
        break;
      case "configure":
        this.handleBreakpointConfigure();
        break;
      case "remove":
        this.handleBreakpointRemove();
        break;
    }
    this.closeContextMenu();
  }

  handleErrorClick(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.errorDetailOpen = !this.errorDetailOpen;
  }

  statementTemplate(hasNestedBlock: boolean) {
    return html`
      <div
        ${ref(this.statementHeaderRef)}
        class="statement-header ${!hasNestedBlock || !this.nestedBlockVisible ? 'bottom-radius' : ''} ${this.language
          .statements[this.statement.id].isUserProcedure
          ? 'user-proc'
          : ''}"
        ?breakpoints-enabled=${this.breakpoints !== undefined && this.breakpoints !== null && !this.isExample}
        ?breakpoint-dragging=${this.breakpointMarkerDraggingStarted}
        ?running=${this.isRunning}
      >

        <!-- ParseErrors -->
        ${(this.parseErrorMap[this.statement._uuid] !== undefined || this.parseWarningMap[this.statement._uuid] !== undefined)
        ? html`
          <div class="parse-error-container" ?open=${this.errorDetailOpen} ?error=${this.parseErrorMap[this.statement._uuid] !== undefined} ?warning=${this.parseWarningMap[this.statement._uuid] !== undefined}>
            ${this.parseErrorMap[this.statement._uuid] !== undefined
              ? html`
              <div class="parse-error-overview" title="Click to open error details" @click=${this.handleErrorClick}>
                <div class="icon">
                  ${icons.closeCircle}
                </div>
                <div class="num">
                  ${this.parseErrorMap[this.statement._uuid].length}
                </div>
              </div>
              `
              : nothing
            }

            ${this.parseWarningMap[this.statement._uuid] !== undefined
            ? html`
              <div class="parse-error-overview" warning title="Click to open error details" @click=${this.handleErrorClick}>
                <div class="icon">
                  ${icons.exclamationDiamond}
                </div>
                <div class="num">
                  ${this.parseWarningMap[this.statement._uuid].length}
                </div>
              </div>
            `
            : nothing
            }

            <div class="parse-error-details">
              <div class="close" @click=${this.handleErrorClick}>
                ${icons.xLg}
              </div>
              ${this.parseErrorMap[this.statement._uuid]?.map(e => html`
                <div class="parse-error">
                  <div class="icon">
                    ${icons.closeCircle}
                  </div>
                  <div>
                    ${e.message}
                  </div>
                </div>
              `)}
              ${this.parseWarningMap[this.statement._uuid]?.map(e => html`
                <div class="parse-error" warning>
                  <div class="icon">
                    ${icons.exclamationDiamond}
                  </div>
                  <div>
                    ${e.message}
                  </div>
                </div>
              `)}
            </div>

          </div>
        `
        : nothing
        }
        <!-- End ParseErrors -->

        <!-- Breakpoint -->
        <div
          class="breakpoint-threshold"
          ?dragging=${this.breakpointMarkerDraggingConfirmed}
        ></div>
        <ul
          ${ref(this.breakpointMarkerContextMenuRef)}
          id="context-menu"
          class="context-menu"
          @pointerdown=${(e: MouseEvent) => {e.preventDefault();e.stopImmediatePropagation();}}
          @pointerup=${(e: MouseEvent) => {e.preventDefault();e.stopImmediatePropagation();}}
          @pointermove=${(e: MouseEvent) => {e.preventDefault();e.stopImmediatePropagation();}}
        >
          ${this.breakpoint?.disabled
            ? html`<li @click=${(e:any)=>this.handleBreakpointContextMenuClick(e, "enable")}>Enable</li>`
            : html`<li @click=${(e:any)=>this.handleBreakpointContextMenuClick(e, "disable")}>Disable</li>`
          }
          <li @click=${(e:any)=>this.handleBreakpointContextMenuClick(e, "configure")}>Configure</li>
          <li @click=${(e:any)=>this.handleBreakpointContextMenuClick(e, "remove")}>Remove</li>
        </ul>
        <div
          ${ref(this.breakpointMarkerRef)}
          class="breakpoint-marker"
          ?visible=${this.hasBreakpoint(this.breakpoint)}
          ?disabled=${this.breakpoint?.disabled}
          ?dragging=${this.breakpointMarkerDraggingConfirmed}
          .title=${this.computeBreakpointTitle(this.breakpoint)}
          @pointerdown=${this.isRunning ? ()=>{} : this.handleBreakpointMarkerMouseDown}
          @pointerup=${this.isRunning ? ()=>{} : this.handleBreakpointMarkerMouseUp}
          @pointermove=${this.isRunning ? ()=>{} : this.handleBreakpointMarkerMouseMove}
          @pointerleave=${this.isRunning ? ()=>{} : this.handleBreakpointMarkerMouseLeave}
          @contextmenu=${this.isRunning ? ()=>{} : this.handleBreakpointMarkerContextMenu}
        >
          <span></span>  <!-- Drag spacer -- grows when dragging to prevent losing "focus" -->
          <div class="marker"></div> <!-- the visible breakpoint marker element -->
        </div>
        <!-- End Breakpoint -->

        <div class="statement-label-wrapper">
          ${this.language.statements[this.statement.id].icon
            ? html`
                <editor-icon
                  class="stmt-icon"
                  title="Show Help"
                  @click="${this.handleShowStmtDescModal}"
                  .icon="${icons[this.language.statements[this.statement.isInvalid ? '_err' : this.statement.id].icon]}"
                  .color="${this.language.statements[this.statement.id].foregroundColor}"
                  .width="${24}"
                  .height="${24}">
                </editor-icon>
                ${this.language.statements[this.statement.id].description
                  ? html`
                      <editor-modal
                        class="stmt-desc-modal"
                        .modalTitle="${`Help for "${this.language.statements[this.statement.id].label}" statement`}"
                        .modalIcon="${icons.questionCircle}"
                        ${ref(this.stmtDescModalRef)}>
                        <div class="stmt-desc-inner-wrapper">
                          <div class="stmt-desc-item-wrapper">
                            <div class="stmt-desc-label">Description</div>
                            <div class="stmt-brief-desc-wrapper">
                              ${this.language.statements[this.statement.id].description.brief}
                            </div>
                          </div>
                          ${this.language.statements[this.statement.id].description.example
                            ? html`
                                <div class="stmt-desc-item-wrapper">
                                  <div class="stmt-desc-label">Example</div>
                                  <div class="stmt-brief-desc-wrapper">
                                    ${this.language.statements[this.statement.id].description.example.description}
                                  </div>
                                </div>
                                <div>
                                  ${this.exampleBlockIsVisible
                                    ? html`
                                        <div class="divider"></div>
                                        <ge-block
                                          .isExample="${true}"
                                          .block="${this.language.statements[this.statement.id].description.example
                                            .block}">
                                        </ge-block>
                                      `
                                    : nothing}
                                </div>
                              `
                            : nothing}
                        </div>
                      </editor-modal>
                    `
                  : nothing}
              `
            : nothing}

          <div class="statement-label">${this.language.statements[this.statement.id].label}</div>
        </div>
        ${(this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments
          ? (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments.length === 1
            ? html`
                <ge-statement-argument
                  ?disabled="${this.statement.isInvalid ? true : false}"
                  .argument="${(this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments[0]}"
                  .argPosition="${0}"
                  .stmtId="${this.statement.id}"
                  .isExample="${this.isExample}">
                </ge-statement-argument>
              `
            : this.multipleArgumentTemplate(
                (this.statement as AbstractStatementWithArgs | CompoundStatementWithArgs).arguments
              )
          : nothing}
        <div class="statement-controls">
          <div class="statement-controls-modal-wrapper">
            ${!this.isExample
              ? html`
                  <editor-button
                    style="${this.isRunning ? 'display: none' : ''}"
                    @click="${this.handleToggleStatementControlsModal}"
                    title="Statement Controls"
                  >
                    <editor-icon .icon="${icons.list}"></editor-icon>
                  </editor-button>
                  <editor-modal
                    class="statement-controls-modal"
                    .displayType="${'dialog'}"
                    .titleIsVisible="${false}"
                    ?hideCloseButton="${true}"
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
                      ${this.breakpoints !== null
                      ? this.hasBreakpoint(this.breakpoint)
                        ? html`
                          <editor-button
                            @click="${this.handleBreakpointRemove}"
                            title="Remove breakpoint">
                            <editor-icon .icon="${icons.trash}"></editor-icon>
                            Remove breakpoint
                          </editor-button>
                          <editor-button
                            @click="${this.handleBreakpointConfigure}"
                            title="Configure breakpoint">
                            <editor-icon .icon="${icons.pencilSquare}"></editor-icon>
                            Configure breakpoint
                          </editor-button>
                          ${this.breakpoint?.disabled
                          ? html`
                            <editor-button
                              @click="${this.handleBreakpointEnable}"
                              title="Enable breakpoint">
                              <editor-icon .icon="${icons.checkLg}"></editor-icon>
                              Enable breakpoint
                            </editor-button>
                            `
                          : html`
                            <editor-button
                              @click="${this.handleBreakpointDisable}"
                              title="Disable breakpoint">
                              <editor-icon .icon="${icons.xLg}"></editor-icon>
                              Disable breakpoint
                            </editor-button>
                            `
                          }
                        `
                        : html`
                          <editor-button
                            @click="${this.handleBreakpointAdd}"
                            title="Add breakpoint">
                            <editor-icon .icon="${icons.plusLg}"></editor-icon>
                            Add breakpoint
                          </editor-button>
                        `
                      : nothing
                      }
                    </div>
                  </editor-modal>
                `
              : nothing}
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
              .parentStmt="${this.statement}"
              .isProcBody="${this.isProcBody}"
              .isExample="${this.isExample}"></ge-block>
          `
        : this.language.statements[this.statement.id].isUserProcedure && !this.isProcBody
        ? html`
            <editor-button @click="${this.handleShowProcDef}" class="user-proc-wrapper">
              ${this.statementTemplate(false)}
            </editor-button>
            <editor-modal
              ${ref(this.procModalRef)}
              .modalTitle="${this.language.statements[this.statement.id].label}"
              .modalIcon="${icons[this.language.statements[this.statement.id].icon]}"
              .backgroundColor="${this.language.statements[this.statement.id].backgroundColor}"
              .foregroundColor="${this.language.statements[this.statement.id].foregroundColor}"
              .isFullWidth="${true}"
              .isFullHeight="${true}">
              <ge-block
                .isProcBody="${true}"
                .isExample="${this.isExample}"
                .block="${this.program.header.userProcedures[this.statement.id]}"></ge-block>
            </editor-modal>
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
