import { createContext } from '@lit/context';
import { Language } from '@vpl/language';
import { Program } from '@vpl/program';
export const languageContext = createContext<Language>('language');
export const programContext = createContext<Program>('program');
