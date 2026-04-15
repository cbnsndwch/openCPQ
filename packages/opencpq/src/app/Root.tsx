import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';

import type { Type } from '../core/base';
import type { Ctx } from '../core/types';

import { downloadBlob } from './download';
import { useHistory, type HistoryState } from './use-history';

const STORAGE_KEY = 'openCPQ';

export interface RootProps {
    type: Type;
    initialValue?: unknown;
    initialCtxProvider: () => Omit<Ctx, 'value' | 'updateTo'>;
    storageKey?: string;
    renderToolbar?: (api: RootApi) => ReactNode;
}

export interface RootApi {
    now: unknown;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    reset: () => void;
    save: () => void;
    restore: () => void;
    hasSaved: () => boolean;
    importFile: (file: File) => Promise<void>;
    exportFile: () => void;
}

export function Root({
    type,
    initialValue,
    initialCtxProvider,
    storageKey = STORAGE_KEY,
    renderToolbar
}: RootProps): ReactNode {
    const history = useHistory(initialValue);
    const rootRef = useRef<HTMLDivElement>(null);

    const api: RootApi = useMemo(
        () => ({
            now: history.now,
            canUndo: history.canUndo,
            canRedo: history.canRedo,
            undo: history.undo,
            redo: history.redo,
            reset: () => history.set(undefined),
            save: () => {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(history.state)
                    );
                }
            },
            restore: () => {
                if (typeof localStorage === 'undefined') return;
                const raw = localStorage.getItem(storageKey);
                if (!raw) return;
                try {
                    history.replace(JSON.parse(raw) as HistoryState);
                } catch {
                    // ignore
                }
            },
            hasSaved: () =>
                typeof localStorage !== 'undefined' &&
                localStorage.getItem(storageKey) !== null,
            importFile: async (file: File) => {
                const text = await file.text();
                try {
                    history.set(JSON.parse(text));
                } catch (e) {
                    console.error('Failed to import file', e);
                }
            },
            exportFile: () => {
                const blob = new Blob([JSON.stringify(history.now, null, 2)], {
                    type: 'application/json;charset=utf-8'
                });
                downloadBlob(blob, 'openCPQ.json');
            }
        }),
        [history, storageKey]
    );

    useEffect(() => {
        if (!rootRef.current) {
            return;
        }

        const el = rootRef.current;
        const onKey = (e: KeyboardEvent): void => {
            if (!e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                api.undo();
            } else if (e.key === 'Z' || (e.key === 'z' && e.shiftKey)) {
                e.preventDefault();
                api.redo();
            }
        };

        el.addEventListener('keydown', onKey);
        return () => el.removeEventListener('keydown', onKey);
    }, [api]);

    const updateTo = useCallback(
        (newValue: unknown) => history.set(newValue),
        [history]
    );

    const baseCtx = initialCtxProvider();
    const node = type.makeNode({
        ...baseCtx,
        value: history.now,
        updateTo
    } as Ctx);

    return (
        <div ref={rootRef} tabIndex={-1} className="cpq-root">
            {renderToolbar ? renderToolbar(api) : <DefaultToolbar api={api} />}
            <div className="cpq-root-body">{node.render()}</div>
        </div>
    );
}

function DefaultToolbar({ api }: { api: RootApi }): ReactNode {
    return (
        <nav className="cpq-toolbar">
            <div className="cpq-toolbar-group">
                <button
                    type="button"
                    className="cpq-btn"
                    disabled={!api.canUndo}
                    onClick={api.undo}
                >
                    ↶ Undo
                </button>
                <button
                    type="button"
                    className="cpq-btn"
                    disabled={!api.canRedo}
                    onClick={api.redo}
                >
                    ↷ Redo
                </button>
                <button
                    type="button"
                    className="cpq-btn"
                    disabled={!api.canUndo}
                    onClick={api.reset}
                >
                    ⟲ Reset
                </button>
            </div>
            <div className="cpq-toolbar-group">
                <button type="button" className="cpq-btn" onClick={api.save}>
                    💾 Save
                </button>
                <button
                    type="button"
                    className="cpq-btn"
                    disabled={!api.hasSaved()}
                    onClick={api.restore}
                >
                    📂 Restore
                </button>
            </div>
            <div className="cpq-toolbar-group">
                <label className="cpq-btn">
                    Import
                    <input
                        type="file"
                        style={{ display: 'none' }}
                        onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) void api.importFile(f);
                        }}
                    />
                </label>
                <button
                    type="button"
                    className="cpq-btn"
                    disabled={api.now === undefined}
                    onClick={api.exportFile}
                >
                    Export
                </button>
            </div>
        </nav>
    );
}
