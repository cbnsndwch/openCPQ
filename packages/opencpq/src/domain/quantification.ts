import type { ReactNode } from "react";
import type { Type } from "../core/base";
import type { Ctx } from "../core/types";
import { CInteger } from "../components/primitives";
import { CMultiplying } from "../core/linear-aggregation";
import { CValidate } from "../components/validation";
import { CGroup, cUnlabelledMember } from "../components/group";
import type { MemberDecl } from "../components/group";
import type { ValidationNode } from "../components/validation";
import { ccolumn, CTable } from "../components/table";
import type { CTableOptions } from "../components/table";

export function CQuantified(type: Type): Type {
    return CGroup((ctx: Ctx) => {
        const { value } = ctx as Ctx & { value?: { quantity?: unknown } };
        const quantity = value?.quantity;
        const members: MemberDecl[] = [
            cUnlabelledMember(
                "quantity",
                CValidate((node, { error }) => {
                    const v = (node as unknown as ValidationNode).inner.value;
                    if (typeof v !== "number" || isNaN(v) || v < 1) {
                        error("Enter a positive whole number.");
                    }
                }, CInteger({ defaultValue: 1, className: "cpq-quantity" }))
            ),
            cUnlabelledMember(
                "value",
                CMultiplying(
                    quantity === "" || quantity == null
                        ? 1
                        : Number(quantity),
                    type
                )
            )
        ];
        return members;
    });
}

export function CQuantifiedList(
    options: CTableOptions,
    label: ReactNode,
    type: Type
): Type {
    const opts: CTableOptions = {
        ...options,
        defaultValue: options.defaultValue ?? [undefined]
    };
    return CTable(
        opts,
        [ccolumn("quantity", "#"), ccolumn("value", label)],
        CQuantified(type)
    );
}
