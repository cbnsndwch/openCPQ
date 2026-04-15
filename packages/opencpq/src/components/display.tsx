import type { ReactNode } from 'react';

export function HBox({ children }: { children?: ReactNode }): ReactNode {
    return <div className="cpq-hbox">{children}</div>;
}
