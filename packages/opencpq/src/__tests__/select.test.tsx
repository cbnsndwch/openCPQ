import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
    CSelect,
    ccase,
    cdefault,
    SelectNode
} from "../components/select";
import { CString } from "../components/primitives";
import { rootPath } from "../core/path";
import { Problems } from "../core/problems";
import type { Ctx } from "../core/types";

function baseCtx(value: unknown, updateTo: (v: unknown) => void): Ctx {
    return {
        path: rootPath,
        problems: new Problems(),
        value,
        updateTo
    } as Ctx;
}

describe("CSelect", () => {
    const type = CSelect([
        cdefault(ccase("a", "Option A")),
        ccase("b", "Option B", CString()),
        ccase("c", "Option C")
    ]);

    it("picks the default case when no value is set", () => {
        const updateTo = vi.fn();
        const node = type.makeNode(baseCtx(undefined, updateTo)) as SelectNode;
        expect(node.caseName).toBe("a");
    });

    it("honors an explicit user selection", () => {
        const updateTo = vi.fn();
        const node = type.makeNode(
            baseCtx({ $case: "b", $detail: "hello" }, updateTo)
        ) as SelectNode;
        expect(node.caseName).toBe("b");
    });

    it("renders all visible options", () => {
        const updateTo = vi.fn();
        const node = type.makeNode(baseCtx(undefined, updateTo)) as SelectNode;
        render(<>{node.render()}</>);
        expect(screen.getByText("Option A")).toBeDefined();
        expect(screen.getByText("Option B")).toBeDefined();
        expect(screen.getByText("Option C")).toBeDefined();
    });
});
