import { createContext } from '@lit/context';
import { Language } from '@vpl/language';
import { Block, Program } from '@vpl/program';
export const languageContext = createContext<Language>(Symbol('language'));
export const programContext = createContext<Program>(Symbol('program'));
