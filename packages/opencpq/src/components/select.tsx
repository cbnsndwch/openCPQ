import type { ReactNode } from "react";
import { Type, Node } from "../core/base";
import type { Ctx } from "../core/types";
import type { ProblemMessage } from "../core/problems";
import { CValidate, renderWithValidation } from "./validation";
import { CUnit } from "./primitives";
import { ConfirmOrRetractButton } from "./confirm-retract";

export type CaseMode = "plain" | "warning" | "error" | "hidden";

export interface Case {
    name: string;
    label: ReactNode;
    type: Type;
    mode: CaseMode;
    isDefault: boolean;
    messages?: ProblemMessage[];
}

export interface SelectValue {
    $case: string;
    $detail?: unknown;
}

export type RawCases =
    | Case
    | undefined
    | RawCases[]
    | ((ctx: Ctx) => RawCases);

export function ccase(
    name: string,
    label: ReactNode = name,
    type: Type = CUnit()
): Case {
    return { name, label, type, mode: "plain", isDefault: false };
}

export function cdefault(c: Case): Case {
    return { ...c, isDefault: true };
}

export function csel($case: string, $detail?: unknown): SelectValue {
    return { $case, $detail };
}

function processCases(ctx: Ctx, rawCases: RawCases): Case[] {
    const result: Case[] = [];
    function process(c: RawCases): void {
        if (c === undefined) return;
        if (Array.isArray(c)) {
            c.forEach(process);
        } else if (typeof c === "function") {
            process(c(ctx));
        } else {
            result.push(c);
        }
    }
    process(rawCases);
    return result;
}

const modes: CaseMode[] = ["plain", "warning", "error", "hidden"];
const modeIdx = (m: CaseMode): number => modes.indexOf(m);

function findCaseWithBestMode(cases: Case[]): Case | undefined {
    let i = modes.length;
    let best: Case | undefined;
    for (const c of cases) {
        const idx = modeIdx(c.mode);
        if (idx < i) {
            i = idx;
            best = c;
        }
    }
    return best;
}

export function CSelect(rawCases: RawCases): Type {
    return new Type("select", function makeSelect(ctx) {
        const { problems } = ctx;
        let { value } = ctx as Ctx & { value?: SelectValue };
        const { updateTo } = ctx;
        const cases = processCases(ctx, rawCases);
        const defaultCase =
            cases.find(x => x.isDefault) ??
            findCaseWithBestMode(cases) ??
            cases[0];
        const userSelected = value !== undefined;
        if (!userSelected && defaultCase) {
            value = csel(defaultCase.name);
        }
        const { $case: caseName = "", $detail: detail } = value ?? {};
        const getCase = (name: string): Case | undefined =>
            cases.find(x => x.name === name);
        const updateCase = (newCaseName: string): void => {
            updateTo(csel(newCaseName));
        };
        const updateDetail = (newDetail: unknown): void => {
            updateTo(csel(caseName, newDetail));
        };
        let currentCase = getCase(caseName);
        if (currentCase === undefined) {
            currentCase = {
                name: caseName,
                label: `unknown option: ${caseName}`,
                type: CUnit(),
                mode: "error",
                isDefault: false
            };
        }
        const { mode, messages: caseMessages = [] } = currentCase;
        const messages = caseMessages.map(m => problems.add(m));
        const detailNode = currentCase.type.makeNode({
            ...ctx,
            value: detail,
            updateTo: updateDetail
        });
        const retract = (): void => updateTo(undefined);
        return new SelectNode({
            cases,
            caseName,
            currentCase,
            userSelected,
            retract,
            mode,
            messages,
            detailNode,
            updateCase
        });
    });
}

interface SelectNodeOptions {
    cases: Case[];
    caseName: string;
    currentCase: Case;
    userSelected: boolean;
    retract: () => void;
    mode: CaseMode;
    messages: ProblemMessage[];
    detailNode: Node;
    updateCase: (name: string) => void;
}

export class SelectNode extends Node {
    constructor(options: SelectNodeOptions) {
        super(options as unknown as Record<string, unknown>);
    }

    private get opts(): SelectNodeOptions {
        return this.__options as unknown as SelectNodeOptions;
    }

    get caseName(): string {
        return this.opts.caseName;
    }

    override get value(): string {
        return this.caseName;
    }

    get label(): ReactNode {
        return this.opts.currentCase.label;
    }

    get currentCase(): Case {
        return this.opts.currentCase;
    }

    get detail(): Node {
        return this.opts.detailNode;
    }

    override render(): ReactNode {
        const {
            cases,
            caseName,
            currentCase,
            userSelected,
            retract,
            mode,
            messages,
            detailNode,
            updateCase
        } = this.opts;
        const visibleCases = cases.filter(c => c.mode !== "hidden");
        const menu = renderWithValidation(
            <span className="cpq-select-control">
                <select
                    className={`cpq-select cpq-select-mode-${mode}`}
                    value={caseName}
                    onChange={e => updateCase(e.target.value)}
                >
                    {visibleCases.map(c => (
                        <option
                            key={c.name}
                            value={c.name}
                            className={`cpq-select-option cpq-option-mode-${c.mode}`}
                        >
                            {typeof c.label === "string" || typeof c.label === "number"
                                ? c.label
                                : c.name}
                        </option>
                    ))}
                </select>
                <ConfirmOrRetractButton
                    userSelected={userSelected}
                    confirm={() => updateCase(currentCase.name)}
                    retract={retract}
                />
            </span>,
            messages
        );
        const detail = detailNode.render();
        return (
            <div className="cpq-select-wrapper">
                {menu}
                {detail !== null && detail !== undefined && (
                    <div className="cpq-select-detail">{detail}</div>
                )}
            </div>
        );
    }
}

export function unansweredCase(label: ReactNode): Case {
    return cdefault(
        ccase(
            "unanswered",
            label,
            CValidate((_node, { warning }) => warning("No value selected."))
        )
    );
}

export interface EitherOptions {
    defaultValue?: boolean;
    disabled?: boolean;
}

interface EitherNodeOptions {
    userSelected: boolean;
    retract: () => void;
    choice: boolean;
    detailNode: Node;
    updateChoice: (newChoice: boolean) => void;
    disabled: boolean;
}

export function CEither(
    rawOptions: EitherOptions = {},
    thenType?: Type,
    elseType?: Type
): Type {
    return new Type("either", function makeEither(ctx) {
        const { value: rawValue = {}, updateTo } = ctx as Ctx & {
            value?: { $case?: boolean; $detail?: unknown };
        };
        const defaultValue = rawOptions.defaultValue ?? false;
        const disabled = rawOptions.disabled ?? false;
        const { $case: choiceRaw, $detail: detail } = rawValue ?? {};
        const userSelected = choiceRaw !== undefined;
        const choice = userSelected ? Boolean(choiceRaw) : defaultValue;
        const detailType = (choice ? thenType : elseType) ?? CUnit();
        const retract = (): void => updateTo(undefined);
        const updateChoice = (newChoice: boolean): void => {
            updateTo({ $case: newChoice });
        };
        const updateDetail = (newDetail: unknown): void => {
            updateTo({ $case: choice, $detail: newDetail });
        };
        const detailNode = detailType.makeNode({
            ...ctx,
            value: detail,
            updateTo: updateDetail
        });
        return new EitherNode({
            userSelected,
            retract,
            choice,
            detailNode,
            updateChoice,
            disabled
        });
    });
}

export class EitherNode extends Node {
    constructor(options: EitherNodeOptions) {
        super(options as unknown as Record<string, unknown>);
    }

    private get opts(): EitherNodeOptions {
        return this.__options as unknown as EitherNodeOptions;
    }

    get choice(): boolean {
        return this.opts.choice;
    }

    override get value(): boolean {
        return this.choice;
    }

    get detail(): Node {
        return this.opts.detailNode;
    }

    override render(): ReactNode {
        const { disabled, userSelected, retract, choice, detailNode, updateChoice } =
            this.opts;
        return (
            <div className="cpq-either">
                <span>
                    <input
                        type="checkbox"
                        checked={choice}
                        onChange={e => updateChoice(e.target.checked)}
                        disabled={disabled}
                    />
                    <ConfirmOrRetractButton
                        userSelected={userSelected}
                        confirm={() => updateChoice(choice)}
                        retract={retract}
                        size="xs"
                    />
                </span>
                {detailNode.render()}
            </div>
        );
    }
}
