import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { globalStyles } from '../global-styles';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { EditorModal } from './editor-modal';
import { plusLg } from '../icons';
import { consume } from '@lit/context';
import { languageContext, programContext } from '../context/editor-context';
import { Icon, Language, Program } from '@/index';
import * as icons from '@/editor/icons';
import { v4 as uuidv4 } from 'uuid';
import { graphicalEditorCustomEvent } from '../editor-custom-events';

@customElement('editor-user-procedures-modal')
export class EditorUserProceduresModal extends LitElement {
  // Property to store the skeletonize result
  _skeletonizeResult: any[] = [];
  static styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .procedure-search-wrapper {
        display: flex;
        position: sticky;
        top: 0;
        padding-bottom: 0.5rem;
        gap: 0.25rem;
      }

      .procedure-name-wrapper {
        display: flex;
      }

      .add-procedure-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .procedure-settings-wrapper {
        display: grid;
        grid-template:
          'bg-color-label bg-color'
          'fg-color-label fg-color';
        grid-template-columns: max-content auto;
        gap: 0.5rem;
        align-items: center;
      }

      .procedure-icon-button {
        display: flex;
        justify-content: center;
        width: 43px;
        height: 39px;
      }

      .add-procedure-modal::part(dialog) {
      }

      .procedure-modal-wrapper {
        display: flex;
        flex-direction: column;
        position: relative;
        max-height: 500px;
      }

      .icon-list-modal {
        position: absolute;
        top: 39px;
      }

      .icon-list-wrapper {
        display: flex;
        flex-wrap: wrap;
        width: 200px;
        height: 100px;
      }

      .icon-list-item {
        padding: 0.25rem;
        border-radius: 0.5rem;
        cursor: pointer;
      }

      .icon-list-item:hover {
        background-color: var(--gray-300);
      }

      .action-buttons-wrapper {
        display: flex;
      }

      .action-button {
        width: 100%;
        justify-content: center;
        gap: 0.25rem;
      }

      .confirm-button {
        color: var(--green-600);
      }

      .cancel-button {
        color: var(--red-600);
      }

      .procedure-button {
        gap: 0.25rem;
      }

      .name-is-missing::placeholder {
        color: var(--red-600);
      }

      .procedure-body-modal::part(dialog-title) {
        margin-left: 34px;
      }

      .no-procedures {
        padding-top: 1rem;
        padding-bottom: 1rem;
        color: var(--gray-500);
        text-align: center;
      }

      .user-procedures-list-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
    `,
  ];

  @consume({ context: languageContext })
  @property()
  language?: Language;

  @consume({ context: programContext })
  @property()
  program?: Program;

  @property() procedureSearchInput: string = '';
  @property() selectedProcIconKey: Icon = 'lightningChargeFill';
  @property() selectedBgColor: string = '#2dd4bf';
  @property() selectedFgColor: string = '#ffffff';
  @property() addProcNameIsMissing: boolean = false;
  @property() addProcName: string = '';
  @property() addProcNameIsTaken: boolean = false;

  userProceduresModalRef: Ref<EditorModal> = createRef();
  addProcedureModalRef: Ref<EditorModal> = createRef();
  iconListModalRef: Ref<EditorModal> = createRef();

  get filteredUserProcedureKeys() {
    return Object.keys(this.language.statements)
      .map((stmtKey) => stmtKey)
      .filter((stmtKey) => {
        if (this.language.statements[stmtKey].isUserProcedure) {
          if (this.procedureSearchInput) {
            return this.language.statements[stmtKey].label
              .toLowerCase()
              .includes(this.procedureSearchInput.toLowerCase());
          }
          return true;
        }
        return false;
      });
  }

  showModal() {
    this.userProceduresModalRef.value.showModal();
  }

  handleProcedureSearch(e: Event) {
    this.procedureSearchInput = (e.currentTarget as HTMLInputElement).value;
  }

  handleShowAddProcedureModal() {
    this.addProcedureModalRef.value.showModal();
  }

  handleSelectProcIcon(iconKey: Icon) {
    this.selectedProcIconKey = iconKey;
    this.iconListModalRef.value.hideModal();
  }

  handleBgColorChange(e: Event) {
    this.selectedBgColor = (e.currentTarget as HTMLInputElement).value;
  }

  handleFgColorChange(e: Event) {
    this.selectedFgColor = (e.currentTarget as HTMLInputElement).value;
  }

  formatSkeletonize() {
    // Copy the contents of program.block from program to a temporary variable
    const skeletonizeCopy = JSON.parse(JSON.stringify(this.program.block));

    // Log the skeletonize content for debugging
    console.log('Skeletonize Content:', skeletonizeCopy);

    // If skeletonize is empty, log a warning and return
    if (!skeletonizeCopy || skeletonizeCopy.length === 0) {
      console.warn('Skeletonize is empty. Ensure program.block contains data.');
      return;
    }

    const deviceList = this.language.deviceList || []; // Get deviceList from language context
    const validUuids = new Set(this.program.header.skeletonize_uuid); // Get valid UUIDs

    // Recursive function to remove blocks not in skeletonize_uuid while preserving nested blocks
    const filterInvalidBlocks = (block: any[]) => {
      console.log('Skeletonize UUIDs:', Array.from(validUuids)); // Log the skeletonize_uuid array

      let result: any[] = [];

      // Process each statement in the block
      for (let i = 0; i < block.length; i++) {
        const stmt = block[i];
        console.log('Processing block with UUID:', stmt._uuid); // Log the UUID of the current block

        // Check if the UUID is valid and the block is not marked as invalid
        const isValid = validUuids.has(stmt._uuid) && !stmt.isInvalid;

        if (isValid) {
          // If the block is valid, keep it and process its nested blocks
          if (stmt.block && Array.isArray(stmt.block)) {
            stmt.block = filterInvalidBlocks(stmt.block); // Recursively filter nested blocks
          }
          result.push(stmt);
        } else {
          // If the block is invalid, log the reason
          if (!validUuids.has(stmt._uuid)) {
            console.log('Found block with invalid UUID:', stmt._uuid);
          } else if (stmt.isInvalid) {
            console.log('Found invalid block with UUID:', stmt._uuid);
          }

          // If the invalid block has nested blocks, process and keep them
          if (stmt.block && Array.isArray(stmt.block) && stmt.block.length > 0) {
            console.log('Preserving nested blocks from invalid block with UUID:', stmt._uuid);
            const nestedBlocks = filterInvalidBlocks(stmt.block);

            // Add all valid nested blocks to the result
            if (nestedBlocks.length > 0) {
              console.log(`Adding ${nestedBlocks.length} preserved nested blocks to parent`);
              result = result.concat(nestedBlocks);
            }
          }
        }
      }

      return result; // Return the processed array
    };

    // Filter the skeletonize copy
    const filteredSkeletonize = filterInvalidBlocks(skeletonizeCopy);

    // Recursive function to parse blocks, replace matching IDs, and print every id and uuid
    const parseBlock = (block: any[]) => {
      // Create a new array to hold the modified blocks
      const modifiedBlock = [];

      // Process each statement in the block
      for (let i = 0; i < block.length; i++) {
        const stmt = block[i];

        // Skip statements without an ID
        if (!stmt.id) {
          console.warn('Block without ID:', stmt, 'UUID:', stmt._uuid ? stmt._uuid : 'No UUID');
          modifiedBlock.push(stmt); // Keep the statement as is
          continue;
        }

        // Process the statement ID
        const idParts = stmt.id.split('.'); // Split the id by '.'
        const deviceName = idParts[0]; // Extract the first part as the device name
        const deviceType = this.language.deviceListWithTypes[deviceName]; // Get the device type from the language context

        console.log('Device Type:', deviceType);
        console.log('Parsed Name:', deviceName);
        console.log('Parsed ID:', stmt._uuid ? stmt._uuid : 'No UUID');

        // Create a copy of the statement to modify
        let modifiedStmt = { ...stmt };

        // Check if this is a user procedure
        if (this.language.statements[stmt.id]?.isUserProcedure) {
          console.log('Found user procedure:', stmt.id, 'UUID:', stmt._uuid);

          // Get the procedure body from userProcedures
          const procedureBody = this.program.header.userProcedures[stmt.id];

          if (procedureBody && Array.isArray(procedureBody)) {
            console.log('Replacing user procedure with its body');

            // Create deep copies of all statements in the procedure body
            const bodyCopy = JSON.parse(JSON.stringify(procedureBody));

            // Process each statement in the procedure body
            const processedBody = parseBlock(bodyCopy);

            // Add all statements from the processed body to our result
            for (const bodyStmt of processedBody) {
              // Assign a new UUID to each statement to avoid conflicts
              bodyStmt._uuid = bodyStmt._uuid || uuidv4();
              modifiedBlock.push(bodyStmt);
            }

            // Skip adding the current statement since we've replaced it with its body
            continue;
          } else {
            console.warn('User procedure body not found or invalid:', stmt.id);
          }
        }
        // If the device name is in the deviceList, replace it with a deviceType block
        else if (deviceList.includes(deviceName)) {
          console.log('Replacing block with ID:', stmt.id);
          modifiedStmt = {
            id: 'deviceType',
            _uuid: stmt._uuid, // Preserve the UUID
            arguments: [
              {
                type: 'deviceType',
                value: deviceType,
              },
            ],
          };
        } else {
          console.log('Keeping block with ID:', stmt.id, 'UUID:', stmt._uuid ? stmt._uuid : 'No UUID');
        }

        // Process nested blocks if they exist
        if (stmt.block && Array.isArray(stmt.block)) {
          modifiedStmt.block = parseBlock(stmt.block); // Recursively parse nested blocks
        }

        // Add the modified statement to the result
        modifiedBlock.push(modifiedStmt);
      }

      return modifiedBlock;
    };

    // Parse the filtered skeletonize copy
    const parsedSkeletonize = parseBlock(filteredSkeletonize);

    // Store the result in a property that can be used later
    // We don't assign directly to program.header.skeletonize due to type constraints
    this._skeletonizeResult = parsedSkeletonize;

    this.requestUpdate();
  }

  handleAddNewProc() {
    if (this.addProcName === '') {
      this.addProcNameIsMissing = true;
      return;
    }

    let stmtKeys = Object.keys(this.language.statements);
    for (let stmtKey of stmtKeys) {
      if (this.language.statements[stmtKey].label.toLowerCase() === this.addProcName.toLowerCase()) {
        this.addProcNameIsTaken = true;
        return;
      }
    }

    let newProcId = this.addProcName;
    const procName = this.addProcName;

    // Clear form state first
    this.addProcName = '';
    this.addProcedureModalRef.value.hideModal();

    this.formatSkeletonize();

    this.requestUpdate();

    // Create the new procedure
    this.language.statements[newProcId] = {
      type: 'unit',
      group: 'misc',
      label: procName,
      icon: this.selectedProcIconKey,
      foregroundColor: this.selectedFgColor,
      backgroundColor: this.selectedBgColor,
      isUserProcedure: true,
    };
    this.program.header.userProcedures[newProcId] = JSON.parse(JSON.stringify(this._skeletonizeResult));

    // Dispatch the update event
    const event = new CustomEvent(graphicalEditorCustomEvent.PROGRAM_UPDATED, {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);

    // Wait for next render cycle and then find and open the new procedure modal
    requestAnimationFrame(() => {
      this.updateComplete.then(() => {
        requestAnimationFrame(() => {
          // Find the newly created procedure's modal
          console.log('Looking for procedure modal with key:', newProcId);
          const newProcModal = this.shadowRoot.querySelector(`editor-user-procedure-modal[stmtKey="${newProcId}"]`);
          console.log('Found modal:', newProcModal);
          if (newProcModal) {
            // Call the handleChangeProcedureBody method to open the editing modal
            (newProcModal as any).handleChangeProcedureBody();
          } else {
            console.error('Could not find procedure modal for:', newProcId);
            // Try to force a re-render
            this.requestUpdate();
          }
        });
      });
    });
  }

  handleAddProcNameChange(e: Event) {
    this.addProcNameIsMissing = false;
    this.addProcNameIsTaken = false;
    this.addProcName = (e.currentTarget as HTMLInputElement).value;
  }

  render() {
    return html`
      <editor-modal ${ref(this.userProceduresModalRef)} .modalTitle="${'Procedures'}">
        <div class="procedure-modal-wrapper">
          <div class="procedure-search-wrapper">
            <input
              type="text"
              placeholder="Search"
              id="variable-search-field"
              .value="${this.procedureSearchInput}"
              @input="${this.handleProcedureSearch}" />
            <editor-button @click="${this.handleShowAddProcedureModal}">
              <editor-icon .icon="${plusLg}"></editor-icon>
              Add
            </editor-button>
            <editor-modal
              ${ref(this.addProcedureModalRef)}
              .modalTitle="${'New Procedure'}"
              class="add-procedure-modal">
              <div class="add-procedure-wrapper">
                <div class="procedure-name-wrapper">
                  <editor-button
                    class="procedure-icon-button"
                    @click="${() => this.iconListModalRef.value.toggleModal()}">
                    <editor-icon
                      .width="${18}"
                      .height="${18}"
                      .icon="${icons[this.selectedProcIconKey]}"></editor-icon>
                  </editor-button>
                  <editor-modal
                    class="icon-list-modal"
                    ${ref(this.iconListModalRef)}
                    .displayType="${'dialog'}"
                    .titleIsVisible="${false}"
                    .closeButtonIsVisible="${false}">
                    <div class="icon-list-wrapper">
                      ${Object.keys(icons).map(
                        (iconKey) =>
                          html`
                            <editor-icon
                              @click="${() => this.handleSelectProcIcon(iconKey as Icon)}"
                              .icon="${icons[iconKey]}"
                              .width="${24}"
                              .height="${24}"
                              class="icon-list-item">
                            </editor-icon>
                          `
                      )}
                    </div>
                  </editor-modal>
                  <input
                    type="text"
                    placeholder="${this.addProcNameIsMissing ? 'Name is required' : 'Name'}"
                    .value="${this.addProcName}"
                    @input="${this.handleAddProcNameChange}"
                    class="${this.addProcNameIsMissing || this.addProcNameIsTaken ? 'name-is-missing' : ''}"
                    style="${this.addProcNameIsMissing || this.addProcNameIsTaken
                      ? 'border: 1px solid var(--red-600);'
                      : ''}" />
                </div>
                <div class="procedure-settings-wrapper">
                  <label class="bg-color-label" for="bg-color-input">Background Color</label>
                  <input
                    id="bg-color-input"
                    class="bg-color"
                    type="color"
                    .value="${this.selectedBgColor}"
                    @change="${this.handleBgColorChange}" />
                  <label class="fg-color-label" for="fg-color-input">Text Color</label>
                  <input
                    id="fg-color-input"
                    class="fg-color"
                    type="color"
                    .value="${this.selectedFgColor}"
                    @change="${this.handleFgColorChange}" />
                </div>
                <div class="action-buttons-wrapper">
                  <editor-button class="action-button confirm-button" @click="${this.handleAddNewProc}">
                    <editor-icon .icon="${icons['checkLg']}"></editor-icon>
                    <span>Create</span>
                  </editor-button>
                  <editor-button
                    class="action-button cancel-button"
                    @click="${() => this.addProcedureModalRef.value.hideModal()}">
                    <editor-icon .icon="${icons['xLg']}"></editor-icon>
                    <span>Cancel</span>
                  </editor-button>
                </div>
              </div>
            </editor-modal>
          </div>
          <div class="user-procedures-list-wrapper">
            ${this.filteredUserProcedureKeys.length > 0
              ? html`${this.filteredUserProcedureKeys.map(
                  (stmtKey) => html`<editor-user-procedure-modal stmtKey="${stmtKey}" .stmtKey="${stmtKey}"></editor-user-procedure-modal>`
                )}`
              : html` <div class="no-procedures">Click on "+ Add" to add new procedure</div> `}
          </div>
        </div>
      </editor-modal>
    `;
  }
}

