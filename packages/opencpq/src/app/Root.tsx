import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    type ReactNode
} from "react";
import type { Type } from "../core/base";
import type { Ctx } from "../core/types";
import { downloadBlob } from "./download";

interface HistoryState {
    now: unknown;
    past: unknown[];
    future: unknown[];
}

type HistoryAction =
    | { kind: "set"; value: unknown }
    | { kind: "undo" }
    | { kind: "redo" }
    | { kind: "reset" }
    | { kind: "replace"; state: HistoryState };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
    const { now, past, future } = state;
    switch (action.kind) {
        case "set":
            return { now: action.value, past: [now, ...past], future: [] };
        case "undo":
            if (past.length === 0) return state;
            return {
                now: past[0],
                past: past.slice(1),
                future: [now, ...future]
            };
        case "redo":
            if (future.length === 0) return state;
            return {
                now: future[0],
                past: [now, ...past],
                future: future.slice(1)
            };
        case "reset":
            return { now: undefined, past: [now, ...past], future: [] };
        case "replace":
            return action.state;
    }
}

const STORAGE_KEY = "openCPQ";

export interface RootProps {
    type: Type;
    initialValue?: unknown;
    initialCtxProvider: () => Omit<Ctx, "value" | "updateTo">;
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
    const [state, dispatch] = useReducer(historyReducer, {
        now: initialValue,
        past: [],
        future: []
    });
    const rootRef = useRef<HTMLDivElement>(null);

    const api: RootApi = useMemo(
        () => ({
            now: state.now,
            canUndo: state.past.length > 0,
            canRedo: state.future.length > 0,
            undo: () => dispatch({ kind: "undo" }),
            redo: () => dispatch({ kind: "redo" }),
            reset: () => dispatch({ kind: "reset" }),
            save: () => {
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem(storageKey, JSON.stringify(state));
                }
            },
            restore: () => {
                if (typeof localStorage === "undefined") return;
                const raw = localStorage.getItem(storageKey);
                if (!raw) return;
                try {
                    dispatch({ kind: "replace", state: JSON.parse(raw) });
                } catch {
                    // ignore
                }
            },
            hasSaved: () =>
                typeof localStorage !== "undefined" &&
                localStorage.getItem(storageKey) !== null,
            importFile: async (file: File) => {
                const text = await file.text();
                try {
                    dispatch({ kind: "set", value: JSON.parse(text) });
                } catch (e) {
                    console.error("Failed to import file", e);
                }
            },
            exportFile: () => {
                const blob = new Blob([JSON.stringify(state.now, null, 2)], {
                    type: "application/json;charset=utf-8"
                });
                downloadBlob(blob, "openCPQ.json");
            }
        }),
        [state, storageKey]
    );

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const onKey = (e: KeyboardEvent): void => {
            if (!e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                api.undo();
            } else if (e.key === "Z" || (e.key === "z" && e.shiftKey)) {
                e.preventDefault();
                api.redo();
            }
        };
        el.addEventListener("keydown", onKey);
        return () => el.removeEventListener("keydown", onKey);
    }, [api]);

    const updateTo = useCallback(
        (newValue: unknown) => dispatch({ kind: "set", value: newValue }),
        []
    );

    const baseCtx = initialCtxProvider();
    const node = type.makeNode({
        ...baseCtx,
        value: state.now,
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
                        style={{ display: "none" }}
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
