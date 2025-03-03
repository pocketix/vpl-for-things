import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('multi-device-selector')
export class MultiDeviceSelector extends LitElement {
  @property({ type: Array }) devices = [];
  @property({ type: Array }) selectedDevices = [];

  static styles = css`
    :host {
      display: block;
      padding: 10px;
      border: 1px solid #ccc;
      background-color: #f9f9f9;
    }
  `;

  handleDeviceChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const device = target.value;
    if (target.checked) {
      this.selectedDevices = [...this.selectedDevices, device];
    } else {
      this.selectedDevices = this.selectedDevices.filter(d => d !== device);
    }
    this.dispatchEvent(new CustomEvent('devices-changed', { detail: this.selectedDevices }));
  }

  render() {
    return html`
      <div>
        <label>Select Devices:</label>
        ${this.devices.map(device => html`
          <div>
            <input type="checkbox" value="${device}" @change="${this.handleDeviceChange}" />
            <label>${device}</label>
          </div>
        `)}
      </div>
    `;
  }
}