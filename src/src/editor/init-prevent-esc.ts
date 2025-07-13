/**
 * Initializes ESC key prevention for all dialogs in the application
 *
 * This module provides a function to initialize ESC key prevention
 * for all dialogs in the application.
 */

import { preventAllDialogsEscClose } from './utils/prevent-esc-close';

/**
 * Initializes ESC key prevention for all dialogs
 * This should be called once when the application starts
 */
export function initPreventEscClose(): void {
  preventAllDialogsEscClose();
}
