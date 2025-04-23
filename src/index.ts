import './index.css';

// Initialize ESC key prevention
import { initPreventEscClose } from './editor/init-prevent-esc';

// Initialize ESC key prevention when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initPreventEscClose();
});

export * from '@components/vpl-editor';
export * from '@components/graphical-editor';
export * from '@components/text-editor';
export * from '@components/editor-controls';
export * from '@components/ge-statement';
export * from '@components/ge-block';
export * from '@components/editor-modal';
export * from '@components/editor-button';
export * from '@components/editor-icon';
export * from '@components/editor-expression-modal';
export * from '@components/ge-statement-argument';
export * from '@components/editor-expression';
export * from '@components/editor-variables-modal';
export * from '@components/editor-expression-operand';
export * from '@components/editor-user-procedures-modal';
export * from '@components/editor-user-procedure-modal';
export * from '@components/editor-user-var-expr-modal';
export * from '@components/editor-expression-operand-list';

export * from '@vpl/base.language';
export * from '@vpl/language';
export * from '@vpl/program';
