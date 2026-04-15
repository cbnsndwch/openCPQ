import { useCallback, useMemo, useState, type ReactNode } from 'react';

import type { Type, Node } from '../core/base';
import { serialize, deserialize } from '../core/serialize';
import type { Ctx } from '../core/types';

import { useHistory } from './use-history';

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
    const history = useHistory(initialConfig);
    const [configValid, setConfigValid] = useState(initialConfigValid);

    const updateTo = useCallback((v: unknown) => history.set(v), [history]);

    const ctx = useMemo<Ctx>(
        () =>
            ({
                ...initialCtxProvider(),
                value: history.now,
                updateTo
            }) as Ctx,
        [initialCtxProvider, history.now, updateTo]
    );

    if (!configValid) {
        const startOver = (): void => {
            history.replace({ now: undefined, past: [], future: [] });
            setConfigValid(true);
        };
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
                    <button type="button" onClick={startOver}>
                        start over with an empty configuration
                    </button>
                    .
                </p>
                <pre>{String(history.now)}</pre>
            </div>
        );
    }

    const node = type.makeNode(ctx);

    const ok = (): void => {
        onClose({
            value: serialize(history.now),
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
                        disabled={history.now == null}
                        onClick={() => history.set(undefined)}
                    >
                        Clear
                    </button>
                </div>
                <div className="cpq-toolbar-group">
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={!history.canUndo}
                        onClick={history.undoAll}
                    >
                        ⇤ Undo All
                    </button>
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={!history.canUndo}
                        onClick={history.undo}
                    >
                        ↶ Undo
                    </button>
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={!history.canRedo}
                        onClick={history.redo}
                    >
                        ↷ Redo
                    </button>
                    <button
                        type="button"
                        className="cpq-btn"
                        disabled={!history.canRedo}
                        onClick={history.redoAll}
                    >
                        ⇥ Redo All
                    </button>
                </div>
            </footer>
        </div>
    );
}

export { serialize, deserialize };
