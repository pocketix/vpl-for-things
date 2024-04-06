import {
  Argument,
  ArgumentType,
  EditorModal,
  GroupedExpressions,
  Language,
  Program,
  ProgramStatementArgument,
  UserVariableType,
} from '@/index';
import { consume } from '@lit/context';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { languageContext, programContext } from '../context/editor-context';
import { globalStyles } from '../global-styles';
import { editorVariablesModalCustomEvent, graphicalEditorCustomEvent } from '../editor-custom-events';
import { v4 as uuidv4 } from 'uuid';

@customElement('ge-statement-argument')
export class GeStatementArgument extends LitElement {
  static styles = [
    globalStyles,
    css`
      :host {
        display: flex;
        white-space: nowrap;
        overflow-x: auto;
        width: 100%;
      }

      .expr-arg {
        white-space: nowrap;
        overflow-x: auto;
        width: 100%;
      }

      .variables-icon {
        width: 18px;
        height: 18px;
        font-size: 1.5rem;
        line-height: 0;
        padding-top: 6px;
        padding-left: 3px;
      }

      .user-variables-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .ava-label {
        font-weight: 600;
      }

      .argument-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
      }

      .argument-var-wrapper {
        display: flex;
        width: 100%;
      }
    `,
  ];

  @property() argument: ProgramStatementArgument;
  @property() argPosition: number;
  @property() stmtId: string;
  @property() selectedBoolValue: boolean = true;
  @property() showLabel: boolean = false;
  @property() originalArgumentType: ArgumentType;

  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;

  expressionModalRef: Ref<EditorModal> = createRef();
  selectArgumentVariableModalRef: Ref<EditorModal> = createRef();

  handleShowExpressionModal() {
    this.expressionModalRef.value.showModal();
  }

  handleShowSelectArgumentVariableModalModal() {
    this.selectArgumentVariableModalRef.value.showModal();
  }

  handleHideSelectArgumentVariableModalModal() {
    this.selectArgumentVariableModalRef.value.hideModal();
  }

  handleValueChange(e: Event) {
    if (this.argument.type === 'num' || this.argument.type === 'num_opt') {
      this.argument.value = Number(e.currentTarget.value);
    } else {
      this.argument.value = e.currentTarget.value;
    }
    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleDeselectUserVariable() {
    if (this.program.header.userVariables[this.argument.value as string] !== undefined) {
      this.argument.type = this.program.header.userVariables[this.argument.value as string].type;
    } else {
      this.argument.type = this.language.statements[this.stmtId].args[this.argPosition].type;
    }
    this.argument.value = this.program.initDefaultArgumentType(this.argument.type);

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  handleVariableSelected(e: CustomEvent) {
    console.log('handling select variable');
    this.argument.type = 'var';
    this.argument.value = e.detail.varKey;

    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  constructor() {
    super();
    this.addEventListener(editorVariablesModalCustomEvent.VARIABLE_SELECTED, (e: CustomEvent) => {
      this.handleVariableSelected(e);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.argument.type === 'num_opt' || this.argument.type === 'str_opt') {
      this.argument.value = this.language.statements[this.stmtId].args[this.argPosition].options[0].id;
      console.log(this.language.statements[this.stmtId].args[this.argPosition].options[0].id);
      const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }
  }

  argumentLabelTemplate(labelId: string) {
    return this.language.statements[this.stmtId].args[this.argPosition].label && this.showLabel
      ? html` <label for="${labelId}">${this.language.statements[this.stmtId].args[this.argPosition].label}</label> `
      : nothing;
  }

  useVariableTemplate() {
    let permittedVarType;
    if (this.argument.type === 'var' && this.argument.value !== null) {
      if (this.program.header.userVariables[this.argument.value as string] === undefined) {
        permittedVarType = this.language.statements[this.stmtId].args[this.argPosition].type;
      } else {
        permittedVarType = this.program.header.userVariables[this.argument.value as string].type;
      }
    } else {
      permittedVarType = this.argument.type;
    }

    return html`
      <div class="${this.argument.type === 'var' && this.argument.value ? 'argument-var-wrapper' : ''}">
        <editor-button
          class="${this.argument.type === 'var' && this.argument.value ? 'expr-arg' : ''}"
          style="height: 100%;"
          @click="${this.handleShowSelectArgumentVariableModalModal}">
          ${this.argument.type === 'var' && this.argument.value
            ? this.argument.value
            : html`<div class="variables-icon">𝑥</div>`}
        </editor-button>
        ${this.argument.type === 'var' && this.argument.value
          ? html`
              <editor-button @click="${this.handleDeselectUserVariable}">
                <div class="variables-icon">𝑥-</div>
              </editor-button>
            `
          : nothing}
      </div>
      <editor-variables-modal ${ref(this.selectArgumentVariableModalRef)} .permittedVarType="${permittedVarType}">
      </editor-variables-modal>
    `;
  }

  render() {
    let argumentElementId = uuidv4();

    switch (this.argument.type) {
      case 'bool':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <select
                id="${argumentElementId}"
                .value="${this.argument.value}"
                @change="${this.handleValueChange}"
                class="expr-arg">
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
              ${this.useVariableTemplate()}
            </div>
          </div>
        `;
      case 'bool_expr':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate('')}
            <div class="argument-var-wrapper">
              <editor-button @click="${this.handleShowExpressionModal}" class="expr-arg">
                ${(this.argument.value as GroupedExpressions[])?.length > 0
                  ? this.program.parseGroupedExpressions(this.argument.value[0])
                  : 'Enter expression'}
              </editor-button>
              <editor-expression-modal ${ref(this.expressionModalRef)} .exprList="${this.argument.value}">
              </editor-expression-modal>
              ${this.useVariableTemplate()}
            </div>
          </div>
        `;
      case 'num':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <input
                id="${argumentElementId}"
                type="number"
                .value="${this.argument.value}"
                @input="${this.handleValueChange}" />
              ${this.useVariableTemplate()}
            </div>
          </div>
        `;
      case 'num_expr':
        return html`<editor-button>Enter numeric expression</editor-button>`;
      case 'num_opt':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <select id="${argumentElementId}" .value="${this.argument.value}" @change="${this.handleValueChange}">
                ${this.language.statements[this.stmtId].args[this.argPosition].options.map(
                  (option) => html`<option value="${option.id}">${option.label}</option>`
                )}
              </select>
            </div>
          </div>
        `;
      case 'str':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <input
                id="${argumentElementId}"
                type="text"
                .value="${this.argument.value}"
                @input="${this.handleValueChange}" />
              ${this.useVariableTemplate()}
            </div>
          </div>
        `;
      case 'str_opt':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)}
            <div class="argument-var-wrapper">
              <select id="${argumentElementId}" .value="${this.argument.value}" @change="${this.handleValueChange}">
                ${this.language.statements[this.stmtId].args[this.argPosition].options.map(
                  (option) => html`<option value="${option.id}">${option.label}</option>`
                )}
              </select>
            </div>
          </div>
        `;
      case 'var':
        return html`
          <div class="argument-wrapper">
            ${this.argumentLabelTemplate(argumentElementId)} ${this.useVariableTemplate()}
          </div>
        `;
      default:
        return nothing;
    }
  }
}
