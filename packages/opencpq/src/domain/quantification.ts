import type { ReactNode } from 'react';

import { group, unlabelledMember } from '../components/group';
import type { MemberDecl } from '../components/group';
import { integer } from '../components/primitives';
import { column, table } from '../components/table';
import type { TableOptions } from '../components/table';
import { validate } from '../components/validation';
import type { ValidationNode } from '../components/validation';
import type { Type } from '../core/base';
import { multiplying } from '../core/linear-aggregation';
import type { Ctx } from '../core/types';

export function quantified(type: Type): Type {
    return group((ctx: Ctx) => {
        const { value } = ctx as Ctx & { value?: { quantity?: unknown } };
        const quantity = value?.quantity;
        const members: MemberDecl[] = [
            unlabelledMember(
                'quantity',
                validate(
                    (node, { error }) => {
                        const v = (node as unknown as ValidationNode).inner
                            .value;
                        if (typeof v !== 'number' || isNaN(v) || v < 1) {
                            error('Enter a positive whole number.');
                        }
                    },
                    integer({ defaultValue: 1, className: 'cpq-quantity' })
                )
            ),
            unlabelledMember(
                'value',
                multiplying(
                    quantity === '' || quantity == null ? 1 : Number(quantity),
                    type
                )
            )
        ];
        return members;
    });
}

export function quantifiedList(
    options: TableOptions,
    label: ReactNode,
    type: Type
): Type {
    const opts: TableOptions = {
        ...options,
        defaultValue: options.defaultValue ?? [undefined]
    };
    return table(
        opts,
        [column('quantity', '#'), column('value', label)],
        quantified(type)
    );
}
