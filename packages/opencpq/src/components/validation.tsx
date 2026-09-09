import type { ComponentType, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { ProblemMessage, ProblemLevel } from '../core/problems';
import type { Ctx, INode } from '../core/types';

import { unit } from './primitives';

export type ValidationCallbacks = {
    error: (msg: ReactNode) => void;
    warning: (msg: ReactNode) => void;
    info: (msg: ReactNode) => void;
};

export type ValidationTestFn<N extends INode = INode> = (
    node: N,
    callbacks: ValidationCallbacks,
    ctx: Ctx
) => void;

const iconFor: Record<ProblemLevel, string> = {
    error: '⛔',
    warning: '⚠',
    info: 'ℹ'
};

export function renderValidation(messages: ProblemMessage[]): ReactNode {
    if (messages.length === 0) return null;
    return (
        <div className="cpq-validate">
            {messages.map(({ level, msg, fragment }, i) => (
                <div key={i} id={fragment} className={`cpq-validate-${level}`}>
                    <span className="cpq-validate-icon" aria-hidden="true">
                        {iconFor[level]}
                    </span>{' '}
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

export interface ValidationNode {
    readonly kind: 'validate';
    readonly inner: INode;
    readonly messages: ProblemMessage[];
    readonly value: unknown;
}

export function validate(testFn: ValidationTestFn, type: Type = unit()): Type {
    return new Type('validate', function makeValidate(ctx) {
        const innerNode = type.makeNode(ctx);
        const messages: ProblemMessage[] = [];
        const emit =
            (level: ProblemLevel) =>
            (msg: ReactNode): void => {
                messages.push(ctx.problems.add({ level, msg }));
            };
        const node = makeDataNode<ValidationNode>({
            kind: 'validate',
            inner: innerNode,
            messages,
            value: innerNode.value
        });
        testFn(
            node,
            {
                error: emit('error'),
                warning: emit('warning'),
                info: emit('info')
            },
            ctx
        );
        return node;
    });
}

const ValidationView: ComponentType<{ node: ValidationNode }> = ({ node }) =>
    renderWithValidation(node.inner.render(), node.messages);
registerView('validate', ValidationView);

export interface ValidationMessagesNode {
    readonly kind: 'validationMessages';
    readonly messages: ProblemMessage[];
}

export function validationMessages(messages: ProblemMessage[]): Type {
    return new Type('validationMessages', function makeValidationMessages(ctx) {
        return makeDataNode<ValidationMessagesNode>({
            kind: 'validationMessages',
            messages: messages.map(m => ctx.problems.add(m))
        });
    });
}

const ValidationMessagesView: ComponentType<{
    node: ValidationMessagesNode;
}> = ({ node }) => <>{renderValidation(node.messages)}</>;
registerView('validationMessages', ValidationMessagesView);
