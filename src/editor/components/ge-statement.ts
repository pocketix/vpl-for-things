import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CompoundStatement, Program, ProgramStatement } from '@vpl/program';
import { Language } from '@vpl/language';
import { consume } from '@lit/context';
import { languageContext, programContext } from '@/editor/context/editor-context';
import * as icons from '@/editor/icons';
import { statementCustomEvent } from '@/editor/editor-custom-events';

@customElement('ge-statement')
export class GEStatement extends LitElement {
  @property() statement: CompoundStatement;
  @property() index: number;

  @consume({ context: languageContext })
  _language?: Language;

  @consume({ context: programContext })
  @property()
  _program?: Program;

  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        border: 1px solid black;
      }

      .statement-controls {
        display: flex;
        gap: 1rem;
      }

      .statement-label {
        display: flex;
        align-items: center;
      }

      .statement-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }

      .nested {
        padding: 0.5rem 1rem 0.5rem 1rem;
      }
    `,
  ];

  // updateStatement() {
  //   this.statement.id = 'else';
  //   console.log('before resuestUpdate()');
  //   this.requestUpdate();
  //   console.log('after resuestUpdate()');
  //   const event = new CustomEvent('programchanged2', { bubbles: true, composed: true });
  //   this.dispatchEvent(event);
  // }

  emitRemoveStatement() {
    const event = new CustomEvent(statementCustomEvent.REMOVE, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
  }

  emitMoveStatementDown() {
    const event = new CustomEvent(statementCustomEvent.MOVE_DOWN, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
  }

  emitMoveStatementUp() {
    const event = new CustomEvent(statementCustomEvent.MOVE_UP, {
      bubbles: false,
      composed: true,
      detail: { index: this.index },
    });
    this.dispatchEvent(event);
  }

  statementTemplate() {
    return html`
      <div class="statement-header">
        <div class="statement-label">
          <img src="${icons.lightningChargeFill}" alt="Statement Icon" />
          <div>${this._language.statements[this.statement.id].label}</div>
        </div>
        <div class="statement-controls">
          <button @click="${this.emitMoveStatementUp}">↑</button>
          <button @click="${this.emitMoveStatementDown}">↓</button>
          <button @click="${this.emitRemoveStatement}">X</button>
          ${this.statement.block ? html`<button>⌄</button>` : nothing}
        </div>
      </div>
    `;
  }

  render() {
    if (this.statement.block) {
      return html`
        ${this.statementTemplate()}
        <ge-block class="nested" .block="${this.statement.block}"></ge-block>
      `;
    } else {
      return html`${this.statementTemplate()}`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ge-statement': GEStatement;
  }
}
