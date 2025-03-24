import { LitElement, html, css, nothing, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Language, Statement, Statements } from '@/vpl/language';
import { AbstractStatementWithArgs, Block, CompoundStatement, Expression, Program, ProgramStatement, analyzeBlock } from '@/vpl/program';
import { isRunningContext, languageContext, programContext, runninBlockContext } from '@/editor/context/editor-context';
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

type ProgPointer =
 | { type: "stlist", value: Block }
 | { type: "statement", value: ProgramStatement }
 | { type: "expression", value: Expression }

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
  @property({ attribute: false }) runningBlockPath: any[];
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
  //#endregion

  //#region Lifecycle
  constructor() {
    super();
    this.addEventListener(textEditorCustomEvent.PROGRAM_UPDATED, (e: CustomEvent) => {
      this.handleTextEditorProgramUpdated();
    });
    this.addEventListener(graphicalEditorCustomEvent.PROGRAM_UPDATED, (e: CustomEvent) => {
      this.handleGraphicalEditorProgramUpdated();
    });
    this.addEventListener(editorControlsCustomEvent.EDITOR_VIEW_CHANGED, (e: CustomEvent) => {
      this.viewMode = e.detail.newView;
    });

    window.addEventListener('resize', () => {
      if (document.body.clientWidth < 800) {
        this.isSmallScreen = true;
      } else {
        this.isSmallScreen = false;
      }
    });

    // window.onbeforeunload = function () {
    //   return 'Changes may be lost!';
    // };
  }

  connectedCallback() {
    super.connectedCallback();

    (this.shadowRoot.host as HTMLElement).setAttribute(
      'style',
      this.width && this.height ? `width: ${this.width}px; height: ${this.height}px;` : ''
    );
  }
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("runningBlockPath")) {
      this.runningBlock = this.findBlockByPath(this.runningBlockPath) || "";
    }
  }

  //#endregion

  findBlockByPath(path: any[]) {
    if (!this.runningBlockPath || this.runningBlockPath.length === 0) {
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
        else if (currPtr.type === "statement" && currPtr.value.block !== undefined){ // TODO(filip): fix types
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

        if (currPtr.type === "statement" && (currPtr.value as AbstractStatementWithArgs).arguments !== undefined) {
          currPtr = {
            type: "expression",
            value: (currPtr.value as AbstractStatementWithArgs).arguments[p.pos] as Expression // TODO(filip): these types...
          }
        }
        else if (currPtr.type === "expression" && (Array.isArray(currPtr.value))) {
          currPtr = {
            type: "expression",
            value: currPtr.value.value[p.pos] as Expression
          }
        }
        else {
          console.error("invalid runningBlockPath: expresssion in terminal expression", this.runningBlockPath);
          return null;
        }
      }
    }

    if (currPtr.type === "stlist") {
      console.error("invalid runningBlockPath: pointing to statement list is not supported", this.runningBlockPath);
      return null;
    }

    return currPtr.value._uuid || "";
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
