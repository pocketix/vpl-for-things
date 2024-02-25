import { Language } from '@/vpl/language';
import { Program } from '@/vpl/program';
import { consume } from '@lit/context';
import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { languageContext, programContext } from '@/editor/context/editor-context';

@customElement('graphical-editor')
export class GraphicalEditor extends LitElement {
  static styles = css`
    :host {
      width: 500px;
      background-color: var(--ge-background);
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 1rem;
      border-radius: var(--ge-wrapper-radius);
    }
  `;

  @consume({ context: languageContext })
  _language?: Language;

  @consume({ context: programContext })
  _program?: Program;

  render() {
    return html` <ge-block .block="${this._program.block}"> </ge-block> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'graphical-editor': GraphicalEditor;
  }
}
