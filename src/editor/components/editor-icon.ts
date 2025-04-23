import { Language, Program } from '@/index';
import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import { consume } from '@lit/context';
import { languageContext, programContext } from '../context/editor-context';
import { TemplateResultType } from 'lit/directive-helpers.js';

@customElement('editor-icon')
export class EditorIcon extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
      }
    `,
  ];

  @property({type: Object}) icon: TemplateResult<1>;
  @property() color?: string;
  @property() width?: number;
  @property() height?: number;

  //#region Context
  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;
  //#endregion

  updated() {
    const svg = this.shadowRoot.querySelector('svg');
    if (!svg) {
      return;
    }
    svg.style.fill = this.color ? this.color : 'currentColor';
    svg.style.width = this.width ? `${this.width}px` : svg.style.width;
    svg.style.height = this.height ? `${this.height}px` : svg.style.height;
  }

  render() {
    return this.icon;
  }
}
