export abstract class Path {
    abstract toString(): string;

    ext(name: string | number): Path {
        return new SubPath(this, String(name));
    }
}

class RootPath extends Path {
    override toString(): string {
        return '';
    }
}

class SubPath extends Path {
    private readonly _asString: string;

    constructor(parent: Path, name: string) {
        super();
        this._asString = `${parent.toString()}/${name}`;
    }

    override toString(): string {
        return this._asString;
    }
}

export const rootPath: Path = new RootPath();
