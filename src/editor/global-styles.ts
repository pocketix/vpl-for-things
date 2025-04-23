import { css } from 'lit';

export const globalStyles = css`
  :host {
    --main-font: 'Inter';
    --mono-font: 'JetBrains Mono';
    --ge-background: #cecece;
    --ge-wrapper-radius: 1rem;

    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-300: #d1d5db;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-700: #374151;
    --blue-100: #dbeafe;
    --blue-200: #bfdbfe;
    --blue-500: #3b82f6;
    --red-500: #ef4444;
    --red-600: #dc2626;
    --orange-500: #f97316;
    --emerald-500: #10b981;
    --indigo-500: #6366f1;
    --violet-500: #8b5cf6;
    --yellow-500: #eab308;
    --green-600: #16a34a;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .hidden {
    display: none !important;
  }

  .flex {
    display: flex !important;
  }

  .block {
    display: block;
  }

  select {
    padding: 0.5rem;
    border-radius: 0.5rem;
    border-width: 1px;
    font-size: 1rem;
    border-color: var(--gray-300);
    background-color: white;
    cursor: pointer;
    user-select: none;
    transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    color: black;
    -webkit-appearance: none;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-expand" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.646 9.146a.5.5 0 0 1 .708 0L8 12.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708m0-2.292a.5.5 0 0 0 .708 0L8 3.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708"/></svg>');
    background-repeat: no-repeat;
    background-position: right 0.35rem top 50%;
    background-size: 1rem auto;
    padding-right: 1.55rem;
  }

  select:hover {
    border-color: var(--gray-400);
    background-color: var(--gray-50);
    transition-duration: 0.1s;
  }

  select:focus {
    outline: none;
    border-color: var(--blue-500);
  }

  select:disabled {
    pointer-events: none;
    opacity: 50%;
  }

  ::-webkit-scrollbar {
    height: 0.85rem;
    width: 0.85rem;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    border-radius: 0.5rem;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: var(--gray-400);
    border-radius: 0.5rem;
    border: 3px solid white;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: var(--gray-500);
  }

  table {
    border-collapse: collapse;
  }

  table tbody tr:nth-child(odd) {
    background-color: var(--gray-100);
  }

  table tbody tr:first-child {
    color: white;
    background-color: var(--gray-500);
    text-align: left;
  }

  table td,
  table th {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }

  input[type='text'],
  input[type='number'] {
    padding: 0.5rem;
    font-size: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--gray-300);
    background-color: white;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    min-width: 2rem;
    size: 1px;
    width: 100%;
    font-family: var(--mono-font);
  }

  input[type='text']:focus,
  input[type='number']:focus {
    outline: none;
    border-color: var(--blue-500);
  }

  input[type='checkbox'] {
    accent-color: var(--blue-500);
    width: 1.125rem;
    height: 1.125rem;
    margin: 0;
    min-width: 1.125rem;
    min-height: 1.125rem;
    cursor: pointer;
  }

  label {
    font-weight: 600;
  }

  .mono-font {
    font-family: var(--mono-font);
  }

  .regular-font {
    font-family: var(--main-font);
  }

  .bold-font {
    font-weight: 600;
  }
`;
