import type { FC } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx } from '../core/types';

import { ConfirmOrRetractButton } from './confirm-retract';
import { HBox } from './display';

function cls(...parts: (string | undefined | false | null)[]): string {
    return parts.filter(Boolean).join(' ');
}

interface PrimitiveBase {
    readonly userSelected: boolean;
    readonly retract: () => void;
    readonly updateTo: (v: unknown) => void;
}

// --- String -----------------------------------------------------------------

export interface StringNode extends PrimitiveBase {
    readonly kind: 'string';
    readonly raw: unknown;
    readonly defaultValue: string;
    readonly text: string;
    readonly className?: string;
    readonly value: string;
}

interface StringOptions {
    defaultValue?: string;
    className?: string;
}

export function string(options: StringOptions = {}): Type {
    return new Type('string', function makeString(ctx: Ctx) {
        const { value, updateTo } = ctx;
        const retract = (): void => updateTo(undefined);
        const userSelected = value !== undefined;
        const defaultValue = String(options.defaultValue ?? '');
        const text =
            value === undefined || value === '' ? defaultValue : String(value);
        return makeDataNode<StringNode>({
            kind: 'string',
            raw: value,
            defaultValue,
            text,
            className: options.className,
            userSelected,
            retract,
            updateTo,
            value: text
        });
    });
}

const StringInputView: FC<{
    kind: 'string' | 'textarea';
    node: StringNode | TextareaNode;
}> = ({ kind, node }) => {
    const { raw, updateTo, defaultValue, className, userSelected, retract } =
        node;
    const baseClass =
        kind === 'textarea'
            ? 'cpq-primitive cpq-textarea'
            : 'cpq-primitive cpq-string';
    const inputValue = (raw as string | undefined) ?? '';
    return (
        <div className={cls(baseClass, className)}>
            {kind === 'textarea' ? (
                <textarea
                    className="cpq-input"
                    value={inputValue}
                    placeholder={defaultValue}
                    onChange={e => updateTo(e.target.value)}
                />
            ) : (
                <input
                    type="text"
                    className="cpq-input"
                    value={inputValue}
                    placeholder={defaultValue}
                    onChange={e => updateTo(e.target.value)}
                />
            )}
            <ConfirmOrRetractButton
                userSelected={userSelected}
                confirm={() => updateTo(defaultValue)}
                retract={retract}
            />
        </div>
    );
};

const StringView: FC<{ node: StringNode }> = ({ node }) => (
    <StringInputView kind="string" node={node} />
);
registerView('string', StringView);

// --- Textarea ---------------------------------------------------------------

export interface TextareaNode extends PrimitiveBase {
    readonly kind: 'textarea';
    readonly raw: unknown;
    readonly defaultValue: string;
    readonly text: string;
    readonly className?: string;
    readonly value: string;
}

export function textarea(options: StringOptions = {}): Type {
    return new Type('textarea', function makeTextarea(ctx: Ctx) {
        const { value, updateTo } = ctx;
        const retract = (): void => updateTo(undefined);
        const userSelected = value !== undefined;
        const defaultValue = String(options.defaultValue ?? '');
        const text =
            value === undefined || value === '' ? defaultValue : String(value);
        return makeDataNode<TextareaNode>({
            kind: 'textarea',
            raw: value,
            defaultValue,
            text,
            className: options.className,
            userSelected,
            retract,
            updateTo,
            value: text
        });
    });
}

const TextareaView: FC<{ node: TextareaNode }> = ({ node }) => (
    <StringInputView kind="textarea" node={node} />
);
registerView('textarea', TextareaView);

// --- Integer ----------------------------------------------------------------

export interface IntegerNode extends PrimitiveBase {
    readonly kind: 'integer';
    readonly raw: unknown;
    readonly defaultValue: string;
    readonly text: string;
    readonly className?: string;
    readonly value: number;
}

interface NumericOptions {
    defaultValue?: number | string;
    className?: string;
}

export function integer(options: NumericOptions = {}): Type {
    return new Type('integer', function makeInteger(ctx: Ctx) {
        const { value, updateTo } = ctx;
        const retract = (): void => updateTo(undefined);
        const userSelected = value !== undefined;
        const defaultValue =
            typeof options.defaultValue === 'number'
                ? options.defaultValue.toFixed(0)
                : String(options.defaultValue ?? '');
        const raw =
            value !== undefined && typeof value !== 'string'
                ? String(value)
                : value;
        const text =
            raw === undefined || raw === '' ? defaultValue : String(raw);
        return makeDataNode<IntegerNode>({
            kind: 'integer',
            raw,
            defaultValue,
            text,
            className: cls('cpq-integer', options.className),
            userSelected,
            retract,
            updateTo,
            value: parseInt(text, 10)
        });
    });
}

const IntegerView: FC<{ node: IntegerNode }> = ({ node }) => (
    <div>
        <StringInputView kind="string" node={node as unknown as StringNode} />
        {/[^0-9]/.test(node.text) ? (
            <div className="cpq-validate cpq-validate-error">
                Input contains non-digits.
            </div>
        ) : null}
    </div>
);
registerView('integer', IntegerView);

// --- Number (float) ---------------------------------------------------------

export interface NumberNode extends PrimitiveBase {
    readonly kind: 'number';
    readonly raw: unknown;
    readonly defaultValue: string;
    readonly text: string;
    readonly className?: string;
    readonly value: number;
}

export function number(options: NumericOptions = {}): Type {
    return new Type('number', function makeNumber(ctx: Ctx) {
        const { value, updateTo } = ctx;
        const retract = (): void => updateTo(undefined);
        const userSelected = value !== undefined;
        const defaultValue =
            typeof options.defaultValue === 'number'
                ? String(options.defaultValue)
                : String(options.defaultValue ?? '');
        const raw =
            value !== undefined && typeof value !== 'string'
                ? String(value)
                : value;
        const text =
            raw === undefined || raw === '' ? defaultValue : String(raw);
        return makeDataNode<NumberNode>({
            kind: 'number',
            raw,
            defaultValue,
            text,
            className: cls('cpq-number', options.className),
            userSelected,
            retract,
            updateTo,
            value: parseFloat(text)
        });
    });
}

const NumberView: FC<{ node: NumberNode }> = ({ node }) => (
    <StringInputView kind="string" node={node as unknown as StringNode} />
);
registerView('number', NumberView);

// --- Date / Time shared helpers --------------------------------------------

function toDateInputValue(d: Date | undefined): string {
    if (!d || isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function toTimeInputValue(d: Date | undefined): string {
    if (!d || isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function coerceDate(v: unknown): Date | undefined {
    if (v === undefined || v === null) return undefined;
    if (v instanceof Date) return v;
    if (typeof v === 'string' || typeof v === 'number') {
        const d = new Date(v);
        return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
}

interface DateTimeOptions {
    defaultValue?: unknown;
}

// --- Date -------------------------------------------------------------------

export interface DateNode extends PrimitiveBase {
    readonly kind: 'date';
    readonly raw: unknown;
    readonly value: Date | undefined;
}

export function date(options: DateTimeOptions = {}): Type {
    return new Type('date', function makeDate(ctx: Ctx) {
        const { value, updateTo } = ctx;
        const retract = (): void => updateTo(undefined);
        const userSelected = value !== undefined;
        const resolved = coerceDate(value) ?? coerceDate(options.defaultValue);
        return makeDataNode<DateNode>({
            kind: 'date',
            raw: value,
            userSelected,
            retract,
            updateTo,
            value: resolved
        });
    });
}

const DateView: FC<{ node: DateNode }> = ({ node }) => {
    const { raw, updateTo, userSelected, value } = node;
    return (
        <HBox>
            <input
                type="date"
                className="cpq-input cpq-date"
                value={toDateInputValue(value)}
                onChange={e => {
                    const v = e.target.value;
                    updateTo(v === '' ? undefined : new Date(v));
                }}
            />
            {(raw !== undefined || value !== undefined) && (
                <ConfirmOrRetractButton
                    userSelected={userSelected}
                    confirm={() => updateTo(value)}
                    retract={() => updateTo(undefined)}
                />
            )}
        </HBox>
    );
};
registerView('date', DateView);

// --- Time -------------------------------------------------------------------

export interface TimeNode extends PrimitiveBase {
    readonly kind: 'time';
    readonly raw: unknown;
    readonly value: Date | undefined;
}

export function time(options: DateTimeOptions = {}): Type {
    return new Type('time', function makeTime(ctx: Ctx) {
        const { value, updateTo } = ctx;
        const retract = (): void => updateTo(undefined);
        const userSelected = value !== undefined;
        const resolved = coerceDate(value) ?? coerceDate(options.defaultValue);
        return makeDataNode<TimeNode>({
            kind: 'time',
            raw: value,
            userSelected,
            retract,
            updateTo,
            value: resolved
        });
    });
}

const TimeView: FC<{ node: TimeNode }> = ({ node }) => {
    const { raw, updateTo, userSelected, value } = node;
    return (
        <HBox>
            <input
                type="time"
                className="cpq-input cpq-time"
                value={toTimeInputValue(value)}
                onChange={e => {
                    const v = e.target.value;
                    if (v === '') {
                        updateTo(undefined);
                        return;
                    }
                    const [hh, mm] = v.split(':').map(Number);
                    const d = new Date();
                    d.setHours(hh ?? 0, mm ?? 0, 0, 0);
                    updateTo(d);
                }}
            />
            {(raw !== undefined || value !== undefined) && (
                <ConfirmOrRetractButton
                    userSelected={userSelected}
                    confirm={() => updateTo(value)}
                    retract={() => updateTo(undefined)}
                />
            )}
        </HBox>
    );
};
registerView('time', TimeView);

// --- Boolean ----------------------------------------------------------------

interface BooleanOptions {
    defaultValue?: boolean;
    disabled?: boolean;
    yes?: string;
    no?: string;
}

export interface BooleanNode extends PrimitiveBase {
    readonly kind: 'boolean';
    readonly value: boolean;
    readonly disabled: boolean;
    readonly yes: string;
    readonly no: string;
}

export function boolean(options: BooleanOptions = {}): Type {
    return new Type('boolean', function makeBoolean(ctx: Ctx) {
        const { value, updateTo } = ctx;
        const retract = (): void => updateTo(undefined);
        const userSelected = value !== undefined;
        const resolved = Boolean(value ?? options.defaultValue ?? false);
        return makeDataNode<BooleanNode>({
            kind: 'boolean',
            userSelected,
            retract,
            updateTo,
            value: resolved,
            disabled: options.disabled ?? false,
            yes: options.yes ?? 'yes',
            no: options.no ?? 'no'
        });
    });
}

const BooleanView: FC<{ node: BooleanNode }> = ({ node }) => {
    const { userSelected, retract, disabled, updateTo, value } = node;
    return (
        <span className="cpq-boolean">
            <input
                type="checkbox"
                checked={value}
                onChange={e => updateTo(e.target.checked)}
                disabled={disabled}
            />
            <ConfirmOrRetractButton
                userSelected={userSelected}
                confirm={() => updateTo(value)}
                retract={retract}
                size="xs"
            />
        </span>
    );
};
registerView('boolean', BooleanView);

// --- Unit (empty) -----------------------------------------------------------

export interface UnitNode {
    readonly kind: 'unit';
}

export function unit(): Type {
    return new Type('unit', function makeUnit(_ctx: Ctx) {
        return makeDataNode<UnitNode>({ kind: 'unit' });
    });
}

const UnitView: FC<{ node: UnitNode }> = () => null;
registerView('unit', UnitView);
