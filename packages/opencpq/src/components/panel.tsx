import type { FC, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { INode } from '../core/types';

export interface PanelOptions {
    header?: ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
    className?: string;
}

export interface PanelNode {
    readonly kind: 'panel';
    readonly opts: PanelOptions;
    readonly inner: INode;
}

export function panel(options: PanelOptions, type: Type): Type {
    return new Type('panel', function makePanel(ctx) {
        return makeDataNode<PanelNode>({
            kind: 'panel',
            opts: options,
            inner: type.makeNode(ctx)
        });
    });
}

const PanelView: FC<{ node: PanelNode }> = ({ node }) => {
    const {
        opts: { header, collapsible, defaultOpen = true, className },
        inner
    } = node;
    const body = inner.render();
    if (collapsible) {
        return (
            <details
                open={defaultOpen}
                className={`cpq-panel cpq-panel-collapsible ${className ?? ''}`}
            >
                {header !== undefined && <summary>{header}</summary>}
                <div className="cpq-panel-body">{body}</div>
            </details>
        );
    }
    return (
        <section className={`cpq-panel ${className ?? ''}`}>
            {header !== undefined && (
                <header className="cpq-panel-header">{header}</header>
            )}
            <div className="cpq-panel-body">{body}</div>
        </section>
    );
};
registerView('panel', PanelView);
