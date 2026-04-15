import { useCallback, useMemo, useReducer, type Reducer } from 'react';

export interface HistoryState {
    now: unknown;
    past: unknown[];
    future: unknown[];
}

type HistoryAction =
    | { kind: 'set'; value: unknown }
    | { kind: 'undo' }
    | { kind: 'redo' }
    | { kind: 'undoAll' }
    | { kind: 'redoAll' }
    | { kind: 'replace'; state: HistoryState };

const historyReducer: Reducer<HistoryState, HistoryAction> = (
    state,
    action
) => {
    const { now, past, future } = state;
    switch (action.kind) {
        case 'set':
            return { now: action.value, past: [now, ...past], future: [] };
        case 'undo':
            if (past.length === 0) return state;
            return {
                now: past[0],
                past: past.slice(1),
                future: [now, ...future]
            };
        case 'redo':
            if (future.length === 0) return state;
            return {
                now: future[0],
                past: [now, ...past],
                future: future.slice(1)
            };
        case 'undoAll':
            if (past.length === 0) return state;
            return {
                now: past[past.length - 1],
                past: [],
                future: [...past.slice(0, -1).reverse(), now, ...future]
            };
        case 'redoAll':
            if (future.length === 0) return state;
            return {
                now: future[future.length - 1],
                past: [...future.slice(0, -1).reverse(), now, ...past],
                future: []
            };
        case 'replace':
            return action.state;
    }
};

export interface HistoryApi {
    state: HistoryState;
    now: unknown;
    canUndo: boolean;
    canRedo: boolean;
    set: (value: unknown) => void;
    undo: () => void;
    redo: () => void;
    undoAll: () => void;
    redoAll: () => void;
    replace: (state: HistoryState) => void;
}

export function useHistory(initialValue: unknown): HistoryApi {
    const [state, dispatch] = useReducer(historyReducer, {
        now: initialValue,
        past: [],
        future: []
    });

    const set = useCallback(
        (value: unknown) => dispatch({ kind: 'set', value }),
        []
    );
    const undo = useCallback(() => dispatch({ kind: 'undo' }), []);
    const redo = useCallback(() => dispatch({ kind: 'redo' }), []);
    const undoAll = useCallback(() => dispatch({ kind: 'undoAll' }), []);
    const redoAll = useCallback(() => dispatch({ kind: 'redoAll' }), []);
    const replace = useCallback(
        (s: HistoryState) => dispatch({ kind: 'replace', state: s }),
        []
    );

    return useMemo(
        () => ({
            state,
            now: state.now,
            canUndo: state.past.length > 0,
            canRedo: state.future.length > 0,
            set,
            undo,
            redo,
            undoAll,
            redoAll,
            replace
        }),
        [state, set, undo, redo, undoAll, redoAll, replace]
    );
}
