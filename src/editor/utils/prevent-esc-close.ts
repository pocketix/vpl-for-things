/**
 * Utility to prevent ESC key from closing dialogs
 * 
 * This utility provides functions to prevent the default ESC key behavior
 * that closes HTML dialog elements.
 */

/**
 * Prevents a dialog from being closed with the ESC key
 * @param dialog The dialog element to prevent from closing
 */
export function preventDialogEscClose(dialog: HTMLDialogElement): void {
  // Method 1: Prevent the cancel event (works for first ESC press)
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
  });

  // Method 2: Prevent keydown event (more reliable)
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  // Method 3: Add a document-level handler for cases where dialog might not have focus
  const documentHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && dialog.open) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  document.addEventListener('keydown', documentHandler);

  // Clean up the document event listener when the dialog is closed
  dialog.addEventListener('close', () => {
    document.removeEventListener('keydown', documentHandler);
  });
}

/**
 * Applies ESC key prevention to all dialogs in the application
 */
export function preventAllDialogsEscClose(): void {
  // Apply to existing dialogs
  document.querySelectorAll('dialog').forEach(dialog => {
    preventDialogEscClose(dialog as HTMLDialogElement);
  });

  // Set up a mutation observer to apply to new dialogs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'DIALOG') {
            preventDialogEscClose(node as HTMLDialogElement);
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            (node as Element).querySelectorAll('dialog').forEach(dialog => {
              preventDialogEscClose(dialog as HTMLDialogElement);
            });
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
