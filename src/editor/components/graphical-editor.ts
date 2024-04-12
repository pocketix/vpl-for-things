import { Language } from '@/vpl/language';
import { Block, Program } from '@/vpl/program';
import { consume } from '@lit/context';
import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { languageContext, programContext } from '@/editor/context/editor-context';
import { globalStyles } from '../global-styles';

@customElement('graphical-editor')
export class GraphicalEditor extends LitElement {
  //#region Styles
  static styles = [
    globalStyles,
    css`
      :host {
        width: 100%;
        background-color: white;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0.25rem;
        border: 1px solid var(--gray-300);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        border-radius: 0.5rem;
      }
    `,
  ];
  //#endregion

  //#region Context
  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;
  //#endregion

  //#region Render
  render() {
    return html` <ge-block .block="${this.program.block}"></ge-block> `;
  }
  //#endregion
}

declare global {
  interface HTMLElementTagNameMap {
    'graphical-editor': GraphicalEditor;
  }
}
