import { Type } from "./base";
import type { Ctx } from "./types";

export interface Aggregator<TAdd extends unknown[] = unknown[]> {
    add(...args: TAdd): void;
    multiplying(factor: number): Aggregator<TAdd>;
    closeMultiplying(factor: number, child: Aggregator<TAdd>): void;
    subAggregator(): Aggregator<TAdd>;
    closeSubAggregator(sub: Aggregator<TAdd>): void;
}

abstract class SimpleAdderBase implements Aggregator<[number?]> {
    abstract add(n?: number): void;

    multiplying(factor: number): SimpleMultiplyingAdder {
        return new SimpleMultiplyingAdder(this, factor);
    }
    closeMultiplying(_factor: number, _child: Aggregator<[number?]>): void {
        // no-op
    }
    subAggregator(): SimpleAdder {
        return new SimpleAdder();
    }
    closeSubAggregator(sub: Aggregator<[number?]>): void {
        this.add((sub as SimpleAdder).get());
    }
}

export class SimpleAdder extends SimpleAdderBase {
    private _v = 0;
    get(): number {
        return this._v;
    }
    set(n: number): void {
        this._v = n;
    }
    override add(n: number = 1): void {
        this._v += n;
    }
}

class SimpleMultiplyingAdder extends SimpleAdderBase {
    constructor(
        private readonly _parent: SimpleAdderBase,
        private readonly _factor: number
    ) {
        super();
    }
    override add(n: number = 1): void {
        this._parent.add(this._factor * n);
    }
    override multiplying(factor: number): SimpleMultiplyingAdder {
        return new SimpleMultiplyingAdder(this._parent, this._factor * factor);
    }
}

abstract class NamedAdderBase implements Aggregator<[string, number?]> {
    abstract add(name: string, n?: number): void;

    multiplying(factor: number): NamedMultiplyingAdder {
        return new NamedMultiplyingAdder(this, factor);
    }
    closeMultiplying(_factor: number, _child: Aggregator<[string, number?]>): void {
        // no-op
    }
    subAggregator(): NamedAdder {
        return new NamedAdder();
    }
    closeSubAggregator(sub: Aggregator<[string, number?]>): void {
        (sub as NamedAdder).mapItems((name, n) => this.add(name, n));
    }
}

export class NamedAdder extends NamedAdderBase {
    private readonly _data: Record<string, number> = {};

    empty(): boolean {
        return Object.keys(this._data).length === 0;
    }

    mapItems<R>(
        fn: (name: string, n: number) => R,
        options: { sorted?: boolean } = {}
    ): R[] {
        const keys = Object.keys(this._data);
        if (options.sorted) keys.sort();
        return keys.map(k => fn(k, this._data[k]!));
    }

    get(name: string): number {
        return this._data[name] ?? 0;
    }

    set(name: string, n: number): void {
        if (n === 0) delete this._data[name];
        else this._data[name] = n;
    }

    override add(name: string, n: number = 1): void {
        this.set(name, this.get(name) + n);
    }
}

class NamedMultiplyingAdder extends NamedAdderBase {
    constructor(
        private readonly _parent: NamedAdderBase,
        private readonly _factor: number
    ) {
        super();
    }
    override add(name: string, n: number = 1): void {
        this._parent.add(name, this._factor * n);
    }
    override multiplying(factor: number): NamedMultiplyingAdder {
        return new NamedMultiplyingAdder(this._parent, this._factor * factor);
    }
}

/**
 * Ctx property `linearAggregators` is a list of ctx property names, each
 * holding an aggregator that multiplication factors are applied to.
 */
export function CLinearAggregation(
    name: string,
    AggregatorClass: new () => Aggregator,
    type: Type
): Type {
    return new Type("linearAggregation", function makeLinearAggregation(ctx) {
        const existing =
            (ctx.linearAggregators as string[] | undefined) ?? [];
        const subAggregators = existing.slice();
        if (!subAggregators.includes(name)) subAggregators.push(name);
        return type.makeNode({
            ...ctx,
            linearAggregators: subAggregators,
            [name]: new AggregatorClass()
        } as Ctx);
    });
}

export function CMultiplying(factor: number, type: Type): Type {
    return new Type("multiplying", function makeMultiplying(ctx) {
        const subCtx: Ctx = { ...ctx, quantity: factor };
        const linearAggregators =
            (ctx.linearAggregators as string[] | undefined) ?? [];
        for (const k of linearAggregators) {
            subCtx[k] = (ctx[k] as Aggregator).multiplying(factor);
        }
        const node = type.makeNode(subCtx);
        for (const k of linearAggregators.slice().reverse()) {
            (ctx[k] as Aggregator).closeMultiplying(
                factor,
                subCtx[k] as Aggregator
            );
        }
        return node;
    });
}
