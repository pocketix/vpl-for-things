import { createContext } from '@lit/context';
import { Language } from '@vpl/language';
import { Block, Program } from '@vpl/program';
export const languageContext = createContext<Language>(Symbol('language'));
export const programContext = createContext<Program>(Symbol('program'));

export const runninBlockContext = createContext<string>(Symbol('running-block')); // uuid of current running block
export const isRunningContext = createContext<boolean>(Symbol('is-running'));
