import { LitElement, html, css, nothing, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Language, Statement, Statements } from '@/vpl/language';
import { AbstractStatement, AbstractStatementWithArgs, Block, CompoundStatement, Expression, Program, ProgramStatement, analyzeBlock } from '@/vpl/program';
import { breakpointsContext, isRunningContext, languageContext, parseErrorsContext, parseWarningsContext, programContext, runninBlockContext } from '@/editor/context/editor-context';
import {
  editorControlsCustomEvent,
  graphicalEditorCustomEvent,
  statementCustomEvent,
  textEditorCustomEvent,
} from '../editor-custom-events';
import { TextEditor } from './text-editor';
import { GraphicalEditor } from './graphical-editor';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { exampleDevices } from '@/vpl/example.devices';
import { globalStyles } from '../global-styles';
import { EditorControls, SelectedEditorView } from './editor-controls';

type ParseError = {
  path: BlockPath;
  name: string;
  message: string;
}

type Warning = {
  path: BlockPath;
  name: string;
  message: string;
}

type ToBlockMap<T> = {[key: string]: T };

export type ParseErrorMap = ToBlockMap<ParseError[]>
export type ParseWarningMap = ToBlockMap<Warning[]>;

type BlockPath = any[];

type ProgPointer =
 | { type: "stlist", value: Block }
 | { type: "statement", value: ProgramStatement }
 | { type: "expression", value: Expression }

type Breakpoint = { disabled: boolean } & ( // TODO(filip): import type from debugger lib?
 | { type: "normal", path: BlockPath }
 | { type: "conditional", condition: any, path: BlockPath } // TODO(filip): condition type
 | { type: "data", condition: any } // TODO(filip): condition type
);

type AddIdToBreakpoint<T> = T extends { type: "normal" | "conditional" } ? T & { blockId: string } : T;

export type BreakpointWithId = AddIdToBreakpoint<Breakpoint>;

type BreakpointWithPositionOnly<T> = T extends { blockId: string } ? T : never;

export type PositionalBreakpoint = BreakpointWithPositionOnly<BreakpointWithId>;

export type BreakpointMap = {
  [K in PositionalBreakpoint as K["blockId"]]: K
};

@customElement('vpl-editor')
export class VplEditor extends LitElement {
  //#region Styles
  static styles = [
    globalStyles,
    css`
      :host {
        font-family: var(--main-font);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        position: relative;
        width: 100%;
        max-width: 1600px;
      }

      .editor-view-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: center;
      }
    `,
  ];
  //#endregion

  //#region Props
  @property({ type: Number }) width?: number;
  @property({ type: Number }) height?: number;
  @property({ type: Boolean }) isSmallScreen: boolean = document.body.clientWidth < 800;
  @property({ type: String }) viewMode: SelectedEditorView;
  @property({ type: Boolean }) showControls: boolean;
  @property({ attribute: false }) runningBlockPath: BlockPath;
  @property({ attribute: false }) breakpointData: Breakpoint[] = [];
  @property({ type: Boolean }) enableBreakpoints: boolean = false;
  @property({attribute: false}) errors: ParseError[] = [];
  @property({attribute: false}) warnings: Warning[] = [];
  //#endregion

  //#region Refs
  textEditorRef: Ref<TextEditor> = createRef();
  graphicalEditorRef: Ref<GraphicalEditor> = createRef();
  controlsRef: Ref<EditorControls> = createRef();
  //#endregion

  //#region Context
  @provide({ context: languageContext })
  @property({ attribute: false })
  language = new Language(exampleDevices);

  @provide({ context: programContext })
  @property({ attribute: false })
  program = new Program();

  @provide({ context: runninBlockContext })
  @property({ attribute: false })
  runningBlock = "";

  @provide({ context: isRunningContext })
  @property({ attribute: false })
  isRunning = false;

  @provide({ context: breakpointsContext })
  @property({ attribute: false })
  breakpoints: BreakpointMap|null = null;

  // TODO(filip): add data breakpoin content

  @provide({ context: parseErrorsContext })
  @property({ attribute: false })
  parseErrorMap: ParseErrorMap = {};

  @provide({ context: parseWarningsContext })
  @property({ attribute: false })
  parseWarningMap: ParseWarningMap = {};

  //#endregion

  //#region Lifecycle
  constructor() {
    super();
    this.addEventListener(textEditorCustomEvent.PROGRAM_UPDATED, (e: CustomEvent) => {
      this.handleTextEditorProgramUpdated();
    });
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, (e: CustomEvent) => {
      this.errors = [...this.errors]; // TODO(filip): remove ?
      this.warnings = [...this.warnings];
      this.breakpoints = this.updateBreakpoints(this.breakpoints);
      this.handleGraphicalEditorProgramUpdated();
    });
    this.addEventListener(editorControlsCustomEvent.EDITOR_VIEW_CHANGED, (e: CustomEvent) => {
      this.viewMode = e.detail.newView;
    });

    this.addEventListener(graphicalEditorCustomEvent.BREAKPOINT_ADDED, (e: CustomEvent) => {
      this.breakpoints = {
        ...this.breakpoints,
        [e.detail.blockId]: {
          type: "normal",
          disabled: false,
          blockId: e.detail.blockId,
          path: this.getPathOfBlock(e.detail.blockId, this.program.block),
        }
      }
    })

    this.addEventListener(graphicalEditorCustomEvent.BREAKPOINT_UPDATED, (e: CustomEvent) => {
      this.breakpoints = {
        ...this.breakpoints,
        [e.detail.breakpoint.blockId]: e.detail.breakpoint,
      }
    })

    this.addEventListener(graphicalEditorCustomEvent.BREAKPOINT_REMOVED, (e: CustomEvent) => {
      this.breakpoints = {
        ...this.breakpoints,
        [e.detail.breakpoint.blockId]: undefined,
      }
    })

    window.addEventListener('resize', () => {
      if (document.body.clientWidth < 800) {
        this.isSmallScreen = true;
      } else {
        this.isSmallScreen = false;
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();

    (this.shadowRoot.host as HTMLElement).setAttribute(
      'style',
      this.width && this.height ? `width: ${this.width}px; height: ${this.height}px;` : ''
    );
  }
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("breakpointData")) {
      this.breakpoints = this.findBreakpointBlocks(this.breakpointData);
    }
    if (changedProperties.has("runningBlockPath")) {
      this.runningBlock = this.findBlockByPath(this.runningBlockPath) || "";
    }

    if (changedProperties.has("enableBreakpoints")) {
      if (this.enableBreakpoints === true) {
        this.breakpoints = this.findBreakpointBlocks(this.breakpointData);
      }
      else {
        this.breakpoints = null;
      }
    }

    if (changedProperties.has("breakpoints") && !changedProperties.has("breakpointData")) { // breakpoints were changed from inside, not outside
      this.emitBreakpointsChangeEvent(this.breakpoints);
    }
    if (changedProperties.has("errors")) {
      this.parseErrorMap = this.processParseErrorsWarning(this.errors);
    }
    if (changedProperties.has("warnings")) {
      this.parseWarningMap = this.processParseErrorsWarning(this.warnings);
    }
  }

  //#endregion

  processParseErrorsWarning<T extends ParseError|Warning>(data: T[]): ToBlockMap<T[]> {
    const pMap: ToBlockMap<T[]> = {};
    for (let e of data) {
      const errPath = this.findBlockByPath(e.path, true);
      if (pMap[errPath] === undefined) {
        pMap[errPath] = [];
      }
      pMap[errPath].push(e);
    }
    return pMap;
  }

  emitBreakpointsChangeEvent(breakpoints: BreakpointMap|null) {
    const event = new CustomEvent("vpl-editor-breakpoints-updated", {
      bubbles: true,
      composed: true,
      detail: { breakpoints: Object.values(breakpoints ?? {}) },
    });
    this.dispatchEvent(event);
  }
  findBreakpointBlocks(breakpoints: Breakpoint[]): BreakpointMap|null {
    if (breakpoints === undefined || breakpoints === null) {
      return null;
    }

    const bMap: BreakpointMap = {};

    for (let b of breakpoints) {
      switch (b?.type) {
        case "normal":
          const normalB: PositionalBreakpoint = {...b, blockId: this.findBlockByPath(b.path)};
          if (typeof normalB.blockId === "string" && normalB.blockId.length > 0) {
            bMap[normalB.blockId] = normalB;
          }
          break;
        case "conditional":
          const condB: PositionalBreakpoint = {...b, blockId: this.findBlockByPath(b.path)}; // TODO(filip): parse condition?
          if (typeof condB.blockId === "string" && condB.blockId.length > 0) {
            bMap[condB.blockId] = condB;
          }
          break;
        case "data":
          // TODO(filip): handle data breakpoints
      }
    }
    return bMap;
  }


  updateBreakpoints(breakpoints: BreakpointMap): BreakpointMap|null {
    if (breakpoints === null) {
      return null;
    }

    const bMap: BreakpointMap = {};

    const processBlock = (block: Block) => {
      for (let st of block) {
        const b = breakpoints[st._uuid]
        if (!!b) {
          bMap[st._uuid] = {...b, path: this.getPathOfBlock(st._uuid, [st])};
        }
        if (Array.isArray((st as CompoundStatement).block)) {
          processBlock((st as CompoundStatement).block);
        }
      }
    }
    processBlock(this.program.block);

    return bMap;
  }

  findBlockByPath(path: any[], mergeExpressions: boolean = false) {
    if (!path || path.length === 0) {
      return null;
    }

    let currPtr: ProgPointer = {
      type: "stlist",
      value: this.program.block
    }

    for (let p of path) {
      if (p.type === "statement") {
        if (currPtr.type === "stlist" && Array.isArray(currPtr.value)) {
          currPtr = {
            type: "statement",
            value: currPtr.value[p.pos]
          }
        }
        // @ts-ignore
        else if (currPtr.type === "statement" && currPtr.value?.block !== undefined){ // TODO(filip): fix types
          currPtr = {
            type: "statement",
            value: (currPtr.value as CompoundStatement).block[p.pos]
          }
        }
        else {
          console.error("invalid runningBlockPath: no matching compount block found: ", p, this.runningBlockPath);
        }
      }
      else if (p.type === "expression") {
        if (currPtr.type === "stlist") {
          console.error("invalid runningBlockPath: expresssion in stlist", this.runningBlockPath);
          return null;
        }

        if (!mergeExpressions && currPtr.type === "statement" && (currPtr.value as AbstractStatementWithArgs).arguments !== undefined) {
          currPtr = {
            type: "expression",
            value: (currPtr.value as AbstractStatementWithArgs).arguments[p.pos] as Expression // TODO(filip): these types...
          }
        }
        else if (!mergeExpressions && currPtr.type === "expression" && (Array.isArray(currPtr.value))) {
          currPtr = {
            type: "expression",
            value: currPtr.value.value[p.pos] as Expression
          }
        }
        else if (!mergeExpressions) {
          console.error("invalid runningBlockPath: expresssion in terminal expression", this.runningBlockPath);
          return null;
        }
      }
    }

    if (currPtr.type === "stlist") {
      console.error("invalid runningBlockPath: pointing to statement list is not supported", this.runningBlockPath);
      return null;
    }

    return currPtr.value?._uuid || "";
  }

  getPathOfBlock(id: string, block: Block): BlockPath|null {
    for (let i = 0; i < block.length; i++) {
      const st = block[i];
      if (st._uuid === id) {
        return [{type: "statement", pos: i}];
      }
      else if (Array.isArray((st as CompoundStatement).block)) {
        const path = this.getPathOfBlock(id, (st as CompoundStatement).block);
        if (path !== null) {
          return [{type: "statement", pos: i}, ...path]
        }
      }
    }
    return null;
  }

  //#region Handlers
  handleTextEditorProgramUpdated() {
    this.graphicalEditorRef.value.requestUpdate();
  }

  handleGraphicalEditorProgramUpdated() {
    // Source for deepQuerySelectorAll function: https://gist.github.com/Haprog/848fc451c25da00b540e6d34c301e96a#file-deepqueryselectorall-js-L7
    function deepQuerySelectorAll(selector, root) {
      root = root || document;
      const results = Array.from(root.querySelectorAll(selector));
      const pushNestedResults = function (root) {
        deepQuerySelectorAll(selector, root).forEach((elem) => {
          if (!results.includes(elem)) {
            results.push(elem);
          }
        });
      };
      if (root.shadowRoot) {
        pushNestedResults(root.shadowRoot);
      }
      for (const elem of root.querySelectorAll('*')) {
        if (elem.shadowRoot) {
          pushNestedResults(elem.shadowRoot);
        }
      }
      return results;
    }

    analyzeBlock(this.program.block, this.language.statements, null);
    for (let userProcId of Object.keys(this.program.header.userProcedures)) {
      analyzeBlock(this.program.header.userProcedures[userProcId], this.language.statements, null);
    }

    deepQuerySelectorAll(
      'editor-button, editor-controls, editor-icon, editor-modal, ge-block, graphical-editor, text-editor, vpl-editor, editor-expression-modal, ge-statement-argument, editor-expression, editor-variables-modal, editor-expression-operand, editor-user-procedures-modal, editor-user-procedure-modal, editor-user-var-expr-modal, editor-expression-operand-list',
      this.shadowRoot
    ).forEach((elem: LitElement) => {
      elem.requestUpdate();
    });

    this.textEditorRef.value.textEditorValue = JSON.stringify(
      this.program.exportProgramBlock(this.program.block),
      null,
      '  '
    );
  }
  //#endregion

  openVariablesModal() {
    this.controlsRef.value.openVariablesModal();
  }

  openProceduresModal() {
    this.controlsRef.value.openProceduresModal();
  }

  //#region Render
  render() {

    const graphicalEditor = this.viewMode === "ge" || this.viewMode === "split"
      ? html`<graphical-editor ${ref(this.graphicalEditorRef)}></graphical-editor>`
      : nothing;

    const textEditor = this.viewMode === "te" || this.viewMode === "split"
      ? html`
        <text-editor
          ${ref(this.textEditorRef)}
          style="${this.isSmallScreen && this.viewMode !== 'te' ? 'display: none;' : ''}"></text-editor>`
      : nothing;

      // ${this.showControls ? html`<editor-controls .selectedEditorView=${this.viewMode}></editor-controls>` : nothing }
    return html`
      <editor-controls style="${!this.showControls ? 'position: absolute;' : ''}" .showControls=${this.showControls} .selectedEditorView=${this.viewMode} ${ref(this.controlsRef)}></editor-controls>
      <div class="editor-view-wrapper">
        ${graphicalEditor}
        ${textEditor}
      </div>
    `;
  }
  //#endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'vpl-editor': VplEditor;
  }
}
