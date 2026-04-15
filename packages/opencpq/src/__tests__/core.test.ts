import { describe, it, expect } from "vitest";
import { Type, Node } from "../core/base";
import { rootPath } from "../core/path";
import { Problems } from "../core/problems";
import type { Ctx, Visitor } from "../core/types";

class FooNode extends Node {
    override get value(): string {
        return "foo";
    }
}

const CFoo = (): Type =>
    new Type("foo", () => new FooNode());

function baseCtx(overrides: Partial<Ctx> = {}): Ctx {
    return {
        path: rootPath,
        problems: new Problems(),
        updateTo: () => {},
        ...overrides
    } as Ctx;
}

describe("Type / Node", () => {
    it("factory produces nodes", () => {
        const n = CFoo().makeNode(baseCtx());
        expect(n).toBeInstanceOf(FooNode);
        expect(n.value).toBe("foo");
    });

    it("visitor dispatches by class name", () => {
        const n = CFoo().makeNode(baseCtx());
        const v: Visitor<string> = {
            unimplemented: () => "unimpl",
            foo: () => "visited-foo"
        };
        expect(n.visit(v)).toBe("visited-foo");
    });

    it("visitor falls back to unimplemented", () => {
        const n = CFoo().makeNode(baseCtx());
        const v: Visitor<string> = { unimplemented: () => "fallback" };
        expect(n.visit(v)).toBe("fallback");
    });
});

describe("rootPath", () => {
    it("extends cleanly", () => {
        expect(rootPath.toString()).toBe("");
        expect(rootPath.ext("a").toString()).toBe("/a");
        expect(rootPath.ext("a").ext("b").toString()).toBe("/a/b");
        expect(rootPath.ext(3).toString()).toBe("/3");
    });
});

describe("Problems", () => {
    it("records fragments per entry", () => {
        const p = new Problems();
        const m1 = p.add({ level: "error", msg: "x" });
        const m2 = p.add({ level: "warning", msg: "y" });
        expect(m1.fragment).toBe("problem_0");
        expect(m2.fragment).toBe("problem_1");
        expect(p.empty()).toBe(false);
    });
});
