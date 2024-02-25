import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('editor-controls')
export class EditorControls extends LitElement {
  static styles = [
    css`
      :host {
        display: flex;
      }
    `,
  ];

  render() {
    return html`
      <div>item 1</div>
      <div>item 1</div>
      <div>item 1</div>
      <div>item 1</div>
      <div>item 1</div>
    `;
  }
}
