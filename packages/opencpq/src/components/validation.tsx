import type { ReactNode } from "react";
import { Type, Node } from "../core/base";
import type { Ctx } from "../core/types";
import type { ProblemMessage, ProblemLevel } from "../core/problems";
import { CUnit } from "./primitives";

export type ValidationCallbacks = {
    error: (msg: ReactNode) => void;
    warning: (msg: ReactNode) => void;
    info: (msg: ReactNode) => void;
};

export type ValidationTestFn<N extends Node = Node> = (
    node: N,
    callbacks: ValidationCallbacks,
    ctx: Ctx
) => void;

const iconFor: Record<ProblemLevel, string> = {
    error: "⛔",
    warning: "⚠",
    info: "ℹ"
};

export function renderValidation(messages: ProblemMessage[]): ReactNode {
    if (messages.length === 0) return null;
    return (
        <div className="cpq-validate">
            {messages.map(({ level, msg, fragment }, i) => (
                <div
                    key={i}
                    id={fragment}
                    className={`cpq-validate-${level}`}
                >
                    <span className="cpq-validate-icon" aria-hidden="true">
                        {iconFor[level]}
                    </span>{" "}
                    {msg}
                </div>
            ))}
        </div>
    );
}

export function renderWithValidation(
    inner: ReactNode,
    messages: ProblemMessage[]
): ReactNode {
    return (
        <div className="cpq-validated">
            {inner}
            {renderValidation(messages)}
        </div>
    );
}

export function CValidate(testFn: ValidationTestFn, type: Type = CUnit()): Type {
    return new Type("validate", function makeValidate(ctx) {
        return new ValidationNode(testFn, type.makeNode(ctx), ctx);
    });
}

export class ValidationNode extends Node {
    private readonly _innerNode: Node;
    private readonly _messages: ProblemMessage[];

    constructor(testFn: ValidationTestFn, innerNode: Node, ctx: Ctx) {
        super();
        this._innerNode = innerNode;
        const messages: ProblemMessage[] = [];
        const emit =
            (level: ProblemLevel) =>
            (msg: ReactNode): void => {
                messages.push(ctx.problems.add({ level, msg }));
            };
        testFn(
            this,
            {
                error: emit("error"),
                warning: emit("warning"),
                info: emit("info")
            },
            ctx
        );
        this._messages = messages;
    }

    get inner(): Node {
        return this._innerNode;
    }

    override get value(): unknown {
        return this._innerNode.value;
    }

    override render(): ReactNode {
        return renderWithValidation(this._innerNode.render(), this._messages);
    }
}

export function CValidationMessages(messages: ProblemMessage[]): Type {
    return new Type("validationMessages", function makeValidationMessages(ctx) {
        return new ValidationMessagesNode(messages.map(m => ctx.problems.add(m)));
    });
}

export class ValidationMessagesNode extends Node {
    private readonly _messages: ProblemMessage[];
    constructor(messages: ProblemMessage[]) {
        super();
        this._messages = messages;
    }
    override render(): ReactNode {
        return renderValidation(this._messages);
    }
}
