import type { ReactNode } from "react";
import type { Problems, ProblemLevel } from "../core/problems";
import { View } from "../domain/workbench";

const iconFor: Record<ProblemLevel, string> = {
    error: "⛔",
    warning: "⚠",
    info: "ℹ"
};

export function renderProblems(problems: Problems): ReactNode {
    const rows = problems.list.filter(p => p.level !== "info");
    if (rows.length === 0) {
        return (
            <div className="cpq-validate cpq-validate-info">(no entries)</div>
        );
    }
    return (
        <table className="cpq-problems">
            <tbody>
                {rows.map(({ level, msg, fragment }, i) => (
                    <tr key={i}>
                        <td className={`cpq-problem-msg cpq-problem-${level}`}>
                            <span className="cpq-validate-icon" aria-hidden="true">
                                {iconFor[level]}
                            </span>{" "}
                            <a href={`#${fragment}`}>{msg}</a>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function VProblems({ problems }: { problems: Problems }): View {
    return new View("problems", () => renderProblems(problems));
}
