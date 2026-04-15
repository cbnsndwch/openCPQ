import { useCallback, useMemo, useReducer, type ReactNode } from 'react';

import type { Type, Node } from '../core/base';
import { serialize, deserialize } from '../core/serialize';
import type { Ctx } from '../core/types';

type LinkedList<T> = { car: T; cdr: LinkedList<T> | null } | null;

interface EmbeddedState {
    config: unknown;
    configValid: boolean;
    past: LinkedList<unknown>;
    future: LinkedList<unknown>;
}

type EmbeddedAction =
    | { kind: 'set'; value: unknown }
    | { kind: 'undo' }
    | { kind: 'undoAll' }
    | { kind: 'redo' }
    | { kind: 'redoAll' }
    | { kind: 'clear' }
    | { kind: 'startOver' };

function reducer(state: EmbeddedState, action: EmbeddedAction): EmbeddedState {
    const { config, past, future } = state;
    switch (action.kind) {
        case 'set':
            return {
                ...state,
                config: action.value,
                past: { car: config, cdr: past },
                future: null
            };
        case 'undo':
            if (!past) return state;
            return {
                ...state,
                config: past.car,
                past: past.cdr,
                future: { car: config, cdr: future }
            };
        case 'undoAll': {
            let c = config;
            let p = past;
            let f = future;
            while (p) {
                f = { car: c, cdr: f };
                c = p.car;
                p = p.cdr;
            }
            return { ...state, config: c, past: p, future: f };
        }
        case 'redo':
            if (!future) return state;
            return {
                ...state,
                config: future.car,
                past: { car: config, cdr: past },
                future: future.cdr
            };
        case 'redoAll': {
            let c = config;
            let p = past;
            let f = future;
            while (f) {
                p = { car: c, cdr: p };
                c = f.car;
                f = f.cdr;
            }
            return { ...state, config: c, past: p, future: f };
        }
        case 'clear':
            return {
                ...state,
                config: undefined,
                past: { car: config, cdr: past },
                future: null
            };
        case 'startOver':
            return {
                config: undefined,
                configValid: true,
                past: null,
                future: null
            };
    }
}

export interface EmbeddedRootProps {
    type: Type;
    initialConfig?: unknown;
    initialConfigValid?: boolean;
    initialCtxProvider: () => Omit<Ctx, 'value' | 'updateTo'>;
    makeResult: (node: Node, ctx: Ctx) => Record<string, unknown>;
    onClose: (result?: Record<string, unknown>) => void;
}

export function EmbeddedRoot({
    type,
    initialConfig,
    initialConfigValid = true,
    initialCtxProvider,
    makeResult,
    onClose
}: EmbeddedRootProps): ReactNode {
    const [state, dispatch] = useReducer(reducer, {
        config: initialConfig,
        configValid: initialConfigValid,
        past: null,
        future: null
    });

    const updateTo = useCallback(
        (v: unknown) => dispatch({ kind: 'set', value: v }),
        []
    );

    const ctx = useMemo<Ctx>(
        () =>
            ({
                ...initialCtxProvider(),
                value: state.config,
                updateTo
            }) as Ctx,
        [initialCtxProvider, state.config, updateTo]
    );

    if (!state.configValid) {
        return (
            <div className="cpq-embedded cpq-invalid">
                <h1>Invalid Configuration</h1>
                <p>
                    This configurator has received invalid configuration data.
                </p>
                <p>
                    <button type="button" onClick={() => onClose()}>
                        Close
                    </button>{' '}
                    this configurator and solve the problem outside, or{' '}
                    <button
                        type="button"
                        onClick={() => dispatch({ kind: 'startOver' })}
                    >
                        start over with an empty configuration
                    </button>
                    .
                </p>
                <pre>{String(state.config)}</pre>
            </div>
        );
    }

    const node = type.makeNode(ctx);

    const ok = (): void => {
        onClose({
            value: serialize(state.config),
            ...makeResult(node, ctx)
        });
    };

    return (
        <div className="cpq-embedded">
            <div className="cpq-embedded-body">{node.render()}</div>
            <footer className="cpq-embedded-footer">
                <div className="cpq-toolbar-group">
                    <button
                        type="button"
                        className="cpq-btn cpq-btn-primary"
                        onClick={ok}
                    >
                        OK
                    </button>
                    <button
                        type="button"
                        className="cpq-btn"
                        onClick={() => onClose()}
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={state.config == null}
                        onClick={() => dispatch({ kind: 'clear' })}
                    >
                        Clear
                    </button>
                </div>
                <div className="cpq-toolbar-group">
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={!state.past}
                        onClick={() => dispatch({ kind: 'undoAll' })}
                    >
                        ⇤ Undo All
                    </button>
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={!state.past}
                        onClick={() => dispatch({ kind: 'undo' })}
                    >
                        ↶ Undo
                    </button>
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={!state.future}
                        onClick={() => dispatch({ kind: 'redo' })}
                    >
                        ↷ Redo
                    </button>
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={!state.future}
                        onClick={() => dispatch({ kind: 'redoAll' })}
                    >
                        ⇥ Redo All
                    </button>
                </div>
            </footer>
        </div>
    );
}

export { serialize, deserialize };
