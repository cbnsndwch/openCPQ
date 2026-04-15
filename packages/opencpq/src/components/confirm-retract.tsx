import type { ReactNode } from "react";

export type ConfirmRetractSize = "xs" | "sm" | "md" | "lg";

export function ConfirmOrRetractButton({
    userSelected,
    confirm,
    retract,
    size = "md"
}: {
    userSelected: boolean;
    confirm: () => void;
    retract: () => void;
    size?: ConfirmRetractSize;
}): ReactNode {
    if (userSelected) {
        return (
            <button
                type="button"
                className={`cpq-btn cpq-btn-dim cpq-btn-${size}`}
                onClick={retract}
                aria-label="Retract user selection"
                title="Retract"
            >
                ×
            </button>
        );
    }
    return (
        <button
            type="button"
            className={`cpq-btn cpq-btn-dim cpq-btn-${size}`}
            onClick={confirm}
            aria-label="Confirm default"
            title="Confirm"
        >
            ✓
        </button>
    );
}
