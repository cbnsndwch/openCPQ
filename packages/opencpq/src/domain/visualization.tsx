import type { ReactNode } from "react";
import { Type } from "../core/base";
import type { Ctx } from "../core/types";
import { CSideEffect } from "../core/util";
import { View } from "./workbench";

export interface ImageSpec {
    url: string;
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
}

export type RawImageSpec =
    | ImageSpec
    | undefined
    | RawImageSpec[]
    | ((ctx: Ctx) => RawImageSpec);

export interface Renderable {
    render(): ReactNode;
}

export class SVGImage implements Renderable {
    constructor(private readonly _options: ImageSpec) {}
    render(): ReactNode {
        const { url, x, y, width, height } = this._options;
        return (
            <image
                xlinkHref={`resources/${url}`}
                x={x}
                y={y}
                width={width}
                height={height}
            />
        );
    }
}

export function CImage(spec: RawImageSpec, type: Type): Type {
    return CSideEffect((_node, ctx) => {
        const vis = ctx.visualization as VisualizationContainer;
        function processSpec(s: RawImageSpec): void {
            if (s === undefined) return;
            if (typeof s === "function") {
                processSpec(s(ctx));
            } else if (Array.isArray(s)) {
                s.forEach(processSpec);
            } else {
                vis.add(new SVGImage(s));
            }
        }
        processSpec(spec);
    }, type);
}

export class VisualizationContainer implements Renderable {
    protected readonly _children: Renderable[] = [];
    private readonly _renderWrapper: (children: ReactNode[]) => ReactNode;

    constructor(renderWrapper: (children: ReactNode[]) => ReactNode) {
        this._renderWrapper = renderWrapper;
    }

    add(child: Renderable): void {
        this._children.push(child);
    }

    render(): ReactNode {
        return this._renderWrapper(this._children.map(c => c.render()));
    }
}

export function CWrapVisualization(
    renderWrapper: (children: ReactNode[]) => ReactNode,
    type: Type
): Type {
    return new Type("visualizationWrapper", function makeVisualizationWrapper(ctx) {
        const sub = new VisualizationContainer(renderWrapper);
        (ctx.visualization as VisualizationContainer).add(sub);
        return type.makeNode({ ...ctx, visualization: sub });
    });
}

export function CTransform(spec: string, type: Type): Type {
    return CWrapVisualization(
        (children: ReactNode[]) => <g transform={spec}>{children}</g>,
        type
    );
}

export function CSVGRoot(
    { width, height }: { width: number | string; height: number | string },
    type: Type
): Type {
    return CWrapVisualization(
        (children: ReactNode[]) => (
            <svg width={width} height={height}>
                {children}
            </svg>
        ),
        type
    );
}

export class Visualization extends VisualizationContainer {
    constructor() {
        super((children: ReactNode[]) => (
            <div className="cpq-visualization">{children}</div>
        ));
    }
}

export function VVisualization(ctx: { visualization: Visualization }): View {
    return new View("visualization", () => ctx.visualization.render());
}
