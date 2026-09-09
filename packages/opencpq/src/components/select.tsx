import type { ComponentType, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { ProblemMessage } from '../core/problems';
import type { Ctx, INode } from '../core/types';

import { ConfirmOrRetractButton } from './confirm-retract';
import { unit } from './primitives';
import { validate, renderWithValidation } from './validation';

export type OptionMode = 'plain' | 'warning' | 'error' | 'hidden';

export interface Option {
    name: string;
    label: ReactNode;
    type: Type;
    mode: OptionMode;
    isDefault: boolean;
    messages?: ProblemMessage[];
}

export interface SelectedValue {
    $option: string;
    $detail?: unknown;
}

export type RawOptions =
    | Option
    | undefined
    | RawOptions[]
    | ((ctx: Ctx) => RawOptions);

export function option(
    name: string,
    label: ReactNode = name,
    type: Type = unit()
): Option {
    return { name, label, type, mode: 'plain', isDefault: false };
}

export function defaultOption(o: Option): Option {
    return { ...o, isDefault: true };
}

export function selected($option: string, $detail?: unknown): SelectedValue {
    return { $option, $detail };
}

function processOptions(ctx: Ctx, rawOptions: RawOptions): Option[] {
    const result: Option[] = [];
    function process(o: RawOptions): void {
        if (o === undefined) return;
        if (Array.isArray(o)) {
            o.forEach(process);
        } else if (typeof o === 'function') {
            process(o(ctx));
        } else {
            result.push(o);
        }
    }
    process(rawOptions);
    return result;
}

const modes: OptionMode[] = ['plain', 'warning', 'error', 'hidden'];
const modeIdx = (m: OptionMode): number => modes.indexOf(m);

function findOptionWithBestMode(options: Option[]): Option | undefined {
    let i = modes.length;
    let best: Option | undefined;
    for (const o of options) {
        const idx = modeIdx(o.mode);
        if (idx < i) {
            i = idx;
            best = o;
        }
    }
    return best;
}

export interface SelectNode {
    readonly kind: 'select';
    readonly options: Option[];
    readonly optionName: string;
    readonly currentOption: Option;
    readonly userSelected: boolean;
    readonly mode: OptionMode;
    readonly messages: ProblemMessage[];
    readonly detail: INode;
    readonly retract: () => void;
    readonly updateOption: (name: string) => void;
    readonly value: string;
}

export function select(rawOptions: RawOptions): Type {
    return new Type('select', function makeSelect(ctx) {
        const { problems } = ctx;
        let { value } = ctx as Ctx & { value?: SelectedValue };
        const { updateTo } = ctx;
        const options = processOptions(ctx, rawOptions);
        const defaultOpt =
            options.find(x => x.isDefault) ??
            findOptionWithBestMode(options) ??
            options[0];
        const userSelected = value !== undefined;
        if (!userSelected && defaultOpt) {
            value = selected(defaultOpt.name);
        }
        const { $option: optionName = '', $detail: detail } = value ?? {};
        const getOption = (name: string): Option | undefined =>
            options.find(x => x.name === name);
        const updateOption = (newOptionName: string): void => {
            updateTo(selected(newOptionName));
        };
        const updateDetail = (newDetail: unknown): void => {
            updateTo(selected(optionName, newDetail));
        };
        let currentOption = getOption(optionName);
        if (currentOption === undefined) {
            currentOption = {
                name: optionName,
                label: `unknown option: ${optionName}`,
                type: unit(),
                mode: 'error',
                isDefault: false
            };
        }
        const { mode, messages: optionMessages = [] } = currentOption;
        const messages = optionMessages.map(m => problems.add(m));
        const detailNode = currentOption.type.makeNode({
            ...ctx,
            value: detail,
            updateTo: updateDetail
        });
        const retract = (): void => updateTo(undefined);
        return makeDataNode<SelectNode>({
            kind: 'select',
            options,
            optionName,
            currentOption,
            userSelected,
            mode,
            messages,
            detail: detailNode,
            retract,
            updateOption,
            value: optionName
        });
    });
}

const SelectView: ComponentType<{ node: SelectNode }> = ({ node }) => {
    const {
        options,
        optionName,
        currentOption,
        userSelected,
        retract,
        mode,
        messages,
        detail,
        updateOption
    } = node;
    const visibleOptions = options.filter(o => o.mode !== 'hidden');
    const menu = renderWithValidation(
        <span className="cpq-select-control">
            <select
                className={`cpq-select cpq-select-mode-${mode}`}
                value={optionName}
                onChange={e => updateOption(e.target.value)}
            >
                {visibleOptions.map(o => (
                    <option
                        key={o.name}
                        value={o.name}
                        className={`cpq-select-option cpq-option-mode-${o.mode}`}
                    >
                        {typeof o.label === 'string' ||
                        typeof o.label === 'number'
                            ? o.label
                            : o.name}
                    </option>
                ))}
            </select>
            <ConfirmOrRetractButton
                userSelected={userSelected}
                confirm={() => updateOption(currentOption.name)}
                retract={retract}
            />
        </span>,
        messages
    );
    const detailRendered = detail.render();
    return (
        <div className="cpq-select-wrapper">
            {menu}
            {detailRendered !== null && detailRendered !== undefined && (
                <div className="cpq-select-detail">{detailRendered}</div>
            )}
        </div>
    );
};
registerView('select', SelectView);

export function unansweredOption(label: ReactNode): Option {
    return defaultOption(
        option(
            'unanswered',
            label,
            validate((_node, { warning }) => warning('No value selected.'))
        )
    );
}

export interface EitherOptions {
    defaultValue?: boolean;
    disabled?: boolean;
}

export interface EitherNode {
    readonly kind: 'either';
    readonly userSelected: boolean;
    readonly choice: boolean;
    readonly disabled: boolean;
    readonly detail: INode;
    readonly retract: () => void;
    readonly updateChoice: (newChoice: boolean) => void;
    readonly value: boolean;
}

export function either(
    rawOptions: EitherOptions = {},
    thenType?: Type,
    elseType?: Type
): Type {
    return new Type('either', function makeEither(ctx) {
        const { value: rawValue = {}, updateTo } = ctx as Ctx & {
            value?: { $option?: boolean; $detail?: unknown };
        };
        const defaultValue = rawOptions.defaultValue ?? false;
        const disabled = rawOptions.disabled ?? false;
        const { $option: choiceRaw, $detail: detail } = rawValue ?? {};
        const userSelected = choiceRaw !== undefined;
        const choice = userSelected ? Boolean(choiceRaw) : defaultValue;
        const detailType = (choice ? thenType : elseType) ?? unit();
        const retract = (): void => updateTo(undefined);
        const updateChoice = (newChoice: boolean): void => {
            updateTo({ $option: newChoice });
        };
        const updateDetail = (newDetail: unknown): void => {
            updateTo({ $option: choice, $detail: newDetail });
        };
        const detailNode = detailType.makeNode({
            ...ctx,
            value: detail,
            updateTo: updateDetail
        });
        return makeDataNode<EitherNode>({
            kind: 'either',
            userSelected,
            choice,
            disabled,
            detail: detailNode,
            retract,
            updateChoice,
            value: choice
        });
    });
}

const EitherView: ComponentType<{ node: EitherNode }> = ({ node }) => {
    const { disabled, userSelected, retract, choice, detail, updateChoice } =
        node;
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
            {detail.render()}
        </div>
    );
};
registerView('either', EitherView);
