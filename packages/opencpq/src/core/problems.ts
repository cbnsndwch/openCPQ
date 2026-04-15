import type { ReactNode } from 'react';

export type ProblemLevel = 'error' | 'warning' | 'info';

export interface ProblemMessage {
    level: ProblemLevel;
    msg: ReactNode;
    fragment?: string;
}

export class Problems {
    private readonly _problemList: ProblemMessage[] = [];

    add(problem: ProblemMessage): ProblemMessage {
        const stored: ProblemMessage = {
            ...problem,
            fragment: `problem_${this._problemList.length}`
        };
        this._problemList.push(stored);
        return stored;
    }

    empty(): boolean {
        return this._problemList.length === 0;
    }

    mapProblems<R>(fn: (p: ProblemMessage, i: number) => R): R[] {
        return this._problemList.map(fn);
    }

    get list(): readonly ProblemMessage[] {
        return this._problemList;
    }
}
