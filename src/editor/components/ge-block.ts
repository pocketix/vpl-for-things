import { consume } from '@lit/context';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { programContext } from '../context/editor-context';
import { Program } from '@/vpl/program';
import { statementCustomEvent } from '../editor-custom-events';

@customElement('ge-block')
export class GeBlock extends LitElement {
  @property()
  block: any;

  @consume({ context: programContext })
  @property()
  program?: Program;

  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .add-new-statement-btn {
        width: fit-content;
        align-self: flex-end;
      }
    `,
  ];

  constructor() {
    super();
    this.addEventListener(statementCustomEvent.REMOVE, (e: CustomEvent) => {
      this.handleRemoveStatement(e);
    });
    this.addEventListener(statementCustomEvent.MOVE_UP, (e: CustomEvent) => {
      this.handleMoveStatementUp(e);
    });
    this.addEventListener(statementCustomEvent.MOVE_DOWN, (e: CustomEvent) => {
      this.handleMoveStatementDown(e);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('block mounted');
    console.log(this.block);
  }

  handleMoveStatementUp(e: CustomEvent) {
    let statementIndex = e.detail.index;
    if (statementIndex > 0) {
      let tmpStatement = this.block[statementIndex];
      this.block[statementIndex] = this.block[statementIndex - 1];
      this.block[statementIndex - 1] = tmpStatement;
      this.requestUpdate();
      e.stopPropagation();
    }
  }

  handleMoveStatementDown(e: CustomEvent) {
    let statementIndex = e.detail.index;
    if (statementIndex < this.block.length - 1) {
      let tmpStatement = this.block[statementIndex];
      this.block[statementIndex] = this.block[statementIndex + 1];
      this.block[statementIndex + 1] = tmpStatement;
      this.requestUpdate();
      e.stopPropagation();
    }
  }

  handleRemoveStatement(e: CustomEvent) {
    let statementIndex = e.detail.index;
    this.block.splice(statementIndex, 1);
    this.requestUpdate();
    e.stopPropagation();
  }

  handleAddNewStatement() {
    this.program.addStatement(this.block, { id: 'if' });
    this.requestUpdate();
    const event = new CustomEvent('programchanged2', { bubbles: true, composed: true });
    this.dispatchEvent(event);
  }

  addStatementButtonTemplate() {
    return html` <button @click="${this.handleAddNewStatement}" class="add-new-statement-btn">+</button> `;
  }

  statementsTemplate() {
    return this.block.map((stmt, i) => {
      return html`<ge-statement .statement="${stmt}" .index="${i}"></ge-statement>`;
    });
  }

  render() {
    return html`${this.statementsTemplate()} ${this.addStatementButtonTemplate()}`;
  }
}
