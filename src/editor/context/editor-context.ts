import { createContext } from '@lit/context';
import { Language } from '@vpl/language';
import { Block, Program } from '@vpl/program';
import { BreakpointMap, ParseErrorMap, ParseWarningMap } from '../components/vpl-editor';
export const languageContext = createContext<Language>(Symbol('language'));
export const programContext = createContext<Program>(Symbol('program'));

export const runninBlockContext = createContext<string>(Symbol('running-block')); // uuid of current running block
export const isRunningContext = createContext<boolean>(Symbol('is-running'));

export const breakpointsContext = createContext<BreakpointMap|null>(Symbol('breakpoint-map')); // uuid of current running block
export const parseErrorsContext = createContext<ParseErrorMap>(Symbol('parse-errors-map')); // uuid of current running block
export const parseWarningsContext = createContext<ParseWarningMap>(Symbol('parse-warnings-map')); // uuid of current running block
