import type { ReactNode } from "react";
import { Type, Node } from "../core/base";
import type { Ctx } from "../core/types";
import { ConfirmOrRetractButton } from "./confirm-retract";
import { HBox } from "./display";

export class PrimitiveValueNode extends Node {}

interface SimpleOptions {
    value?: unknown;
    updateTo: (v: unknown) => void;
    retract: () => void;
    userSelected: boolean;
    defaultValue?: unknown;
    className?: string;
    [key: string]: unknown;
}

function makeSimpleType<N extends PrimitiveValueNode>(
    name: string,
    NodeClass: new (options: SimpleOptions) => N
) {
    return (options: Record<string, unknown> = {}) =>
        new Type(name, function makeSimpleNode(ctx: Ctx) {
            const { value, updateTo } = ctx;
            const retract = (): void => updateTo(undefined);
            const userSelected = value !== undefined;
            return new NodeClass({
                ...options,
                value,
                updateTo,
                retract,
                userSelected
            } as SimpleOptions);
        });
}

function cls(...parts: (string | undefined | false | null)[]): string {
    return parts.filter(Boolean).join(" ");
}

// --- String -----------------------------------------------------------------

export class StringNode extends PrimitiveValueNode {
    get text(): string {
        const { defaultValue = "", value } = this.__options as SimpleOptions;
        if (value === undefined || value === "") return String(defaultValue);
        return String(value);
    }

    override get value(): unknown {
        return this.text;
    }

    override render(): ReactNode {
        const { value, updateTo, defaultValue = "", className, userSelected, retract } =
            this.__options as SimpleOptions;
        return (
            <div className={cls("cpq-primitive cpq-string", className)}>
                <input
                    type="text"
                    className="cpq-input"
                    value={(value as string | undefined) ?? ""}
                    placeholder={String(defaultValue)}
                    onChange={e => updateTo(e.target.value)}
                />
                <ConfirmOrRetractButton
                    userSelected={userSelected}
                    confirm={() => updateTo(defaultValue)}
                    retract={retract}
                />
            </div>
        );
    }
}
export const CString = makeSimpleType("string", StringNode);

// --- Textarea ---------------------------------------------------------------

export class TextareaNode extends StringNode {
    override render(): ReactNode {
        const { value, updateTo, defaultValue = "", className, userSelected, retract } =
            this.__options as SimpleOptions;
        return (
            <div className={cls("cpq-primitive cpq-textarea", className)}>
                <textarea
                    className="cpq-input"
                    value={(value as string | undefined) ?? ""}
                    placeholder={String(defaultValue)}
                    onChange={e => updateTo(e.target.value)}
                />
                <ConfirmOrRetractButton
                    userSelected={userSelected}
                    confirm={() => updateTo(defaultValue)}
                    retract={retract}
                />
            </div>
        );
    }
}
export const CTextarea = makeSimpleType("textarea", TextareaNode);

// --- Integer ----------------------------------------------------------------

export class IntegerNode extends StringNode {
    constructor(options: SimpleOptions) {
        const normalized = { ...options };
        normalized.className = cls("cpq-integer", options.className);
        if (typeof options.defaultValue === "number") {
            normalized.defaultValue = options.defaultValue.toFixed(0);
        }
        if (options.value !== undefined && typeof options.value !== "string") {
            normalized.value = String(options.value);
        }
        super(normalized);
    }

    override get value(): unknown {
        return parseInt(this.text, 10);
    }

    override render(): ReactNode {
        return (
            <div>
                {super.render()}
                {/[^0-9]/.test(this.text) ? (
                    <div className="cpq-validate cpq-validate-error">
                        Input contains non-digits.
                    </div>
                ) : null}
            </div>
        );
    }
}
export const CInteger = makeSimpleType("integer", IntegerNode);

// --- Number (float) ---------------------------------------------------------

export class NumberNode extends StringNode {
    constructor(options: SimpleOptions) {
        const normalized = { ...options };
        normalized.className = cls("cpq-number", options.className);
        if (typeof options.defaultValue === "number") {
            normalized.defaultValue = String(options.defaultValue);
        }
        if (options.value !== undefined && typeof options.value !== "string") {
            normalized.value = String(options.value);
        }
        super(normalized);
    }

    override get value(): unknown {
        return parseFloat(this.text);
    }
}
export const CNumber = makeSimpleType("number", NumberNode);

// --- Date -------------------------------------------------------------------

function toDateInputValue(d: Date | undefined): string {
    if (!d || isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function toTimeInputValue(d: Date | undefined): string {
    if (!d || isNaN(d.getTime())) return "";
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
}

function coerceDate(v: unknown): Date | undefined {
    if (v === undefined || v === null) return undefined;
    if (v instanceof Date) return v;
    if (typeof v === "string" || typeof v === "number") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
}

export class DateNode extends PrimitiveValueNode {
    override get value(): Date | undefined {
        const { value, defaultValue } = this.__options as SimpleOptions;
        return coerceDate(value) ?? coerceDate(defaultValue);
    }

    override render(): ReactNode {
        const { value, updateTo, userSelected } = this.__options as SimpleOptions;
        return (
            <HBox>
                <input
                    type="date"
                    className="cpq-input cpq-date"
                    value={toDateInputValue(this.value)}
                    onChange={e => {
                        const v = e.target.value;
                        updateTo(v === "" ? undefined : new Date(v));
                    }}
                />
                {(value !== undefined || this.value !== undefined) && (
                    <ConfirmOrRetractButton
                        userSelected={userSelected}
                        confirm={() => updateTo(this.value)}
                        retract={() => updateTo(undefined)}
                    />
                )}
            </HBox>
        );
    }
}
export const CDate = makeSimpleType("date", DateNode);

// --- Time -------------------------------------------------------------------

export class TimeNode extends PrimitiveValueNode {
    override get value(): Date | undefined {
        const { value, defaultValue } = this.__options as SimpleOptions;
        return coerceDate(value) ?? coerceDate(defaultValue);
    }

    override render(): ReactNode {
        const { value, updateTo, userSelected } = this.__options as SimpleOptions;
        return (
            <HBox>
                <input
                    type="time"
                    className="cpq-input cpq-time"
                    value={toTimeInputValue(this.value)}
                    onChange={e => {
                        const v = e.target.value;
                        if (v === "") {
                            updateTo(undefined);
                            return;
                        }
                        const [hh, mm] = v.split(":").map(Number);
                        const d = new Date();
                        d.setHours(hh ?? 0, mm ?? 0, 0, 0);
                        updateTo(d);
                    }}
                />
                {(value !== undefined || this.value !== undefined) && (
                    <ConfirmOrRetractButton
                        userSelected={userSelected}
                        confirm={() => updateTo(this.value)}
                        retract={() => updateTo(undefined)}
                    />
                )}
            </HBox>
        );
    }
}
export const CTime = makeSimpleType("time", TimeNode);

// --- Boolean ----------------------------------------------------------------

interface BooleanOptions extends SimpleOptions {
    disabled?: boolean;
    yes?: string;
    no?: string;
}

export class BooleanNode extends PrimitiveValueNode {
    override get value(): boolean {
        const { defaultValue = false, value = defaultValue } =
            this.__options as BooleanOptions;
        return Boolean(value);
    }

    override render(): ReactNode {
        const { userSelected, retract, disabled = false, updateTo } =
            this.__options as BooleanOptions;
        return (
            <span className="cpq-boolean">
                <input
                    type="checkbox"
                    checked={this.value}
                    onChange={e => updateTo(e.target.checked)}
                    disabled={disabled}
                />
                <ConfirmOrRetractButton
                    userSelected={userSelected}
                    confirm={() => updateTo(this.value)}
                    retract={retract}
                    size="xs"
                />
            </span>
        );
    }

    renderResult(): ReactNode {
        const { yes = "yes", no = "no" } = this.__options as BooleanOptions;
        return <span>{this.value ? yes : no}</span>;
    }
}
export const CBoolean = makeSimpleType("boolean", BooleanNode);

// --- Unit (empty) -----------------------------------------------------------

export class UnitNode extends Node {
    override render(): ReactNode {
        return null;
    }
}
export const CUnit = (): Type =>
    new Type("unit", function makeUnit(_ctx: Ctx) {
        return new UnitNode();
    });
