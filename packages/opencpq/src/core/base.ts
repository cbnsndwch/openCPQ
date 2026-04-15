import type { ReactNode } from 'react';

import type { Ctx, INode, Visitor } from './types';

export type MakeNode<C extends Ctx = Ctx> = (ctx: C) => Node;

export class Type<C extends Ctx = Ctx> {
    readonly name: string;
    private readonly _factory: MakeNode<C>;

    constructor(name: string, factory: MakeNode<C>) {
        this.name = name;
        this._factory = factory;
    }

    makeNode(ctx: C): Node {
        return this._factory(ctx);
    }
}

export class Node implements INode {
    protected readonly __options: Record<string, unknown>;

    constructor(options: Record<string, unknown> = {}) {
        this.__options = options;
    }

    render(): ReactNode {
        return null;
    }

    get value(): unknown {
        return undefined;
    }

    /**
     * Walk the prototype chain. For the first class `FooNode` for which
     * `v.foo` is a function, call `v.foo(this)`. Otherwise `v.unimplemented(this)`.
     */
    visit<R>(v: Visitor<R>): R {
        let proto = Object.getPrototypeOf(this);
        while (proto && proto.constructor !== Node) {
            const name: string = proto.constructor.name;
            if (name.endsWith('Node')) {
                const prefix = name.slice(0, -4);
                const key =
                    prefix === prefix.toUpperCase()
                        ? prefix.toLowerCase()
                        : prefix[0]!.toLowerCase() + prefix.slice(1);
                const fn = v[key];
                if (typeof fn === 'function') {
                    return fn(this);
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
        return v.unimplemented(this);
    }
}
