/**
 * Serialize/deserialize complex JS data (including aliased and circular
 * structures) to/from strings. Roughly equivalent to the structured clone
 * algorithm for a subset of types: undefined, null, boolean, number, string,
 * Number, Boolean, String, Date, Array (including sparse), plain Object.
 */

function serializeString(s: string): string {
    return `"${s.replace(/[\\"]/g, "\\$&")}"`;
}

function deserializeString(s: string): string {
    return s.substring(1, s.length - 1).replace(/\\(.)/g, "$1");
}

const SEEN = Symbol("seen");
const ALIASED = Symbol("aliased");

type AliasState = typeof SEEN | typeof ALIASED | number;

export function serialize(root: unknown): string {
    const aliasInfo = new Map<object, AliasState>();

    function preprocess(o: unknown): void {
        if (typeof o === "object" && o !== null) {
            const n = aliasInfo.get(o);
            if (n === undefined) {
                aliasInfo.set(o, SEEN);
                for (const k of Object.keys(o)) {
                    preprocess((o as Record<string, unknown>)[k]);
                }
            } else if (n === SEEN) {
                aliasInfo.set(o, ALIASED);
            }
        }
    }
    preprocess(root);

    let labelCounter = 0;
    const out: (string | number)[] = [];

    function handle(o: unknown): void {
        switch (typeof o) {
            case "undefined":
                out.push("undefined");
                return;
            case "boolean":
            case "number":
                out.push(String(o));
                return;
            case "string":
                out.push(serializeString(o));
                return;
            case "object": {
                if (o === null) {
                    out.push("null");
                    return;
                }
                const lookup = aliasInfo.get(o as object);
                if (lookup === SEEN) {
                    // non-aliased, fall through
                } else if (lookup === ALIASED) {
                    const label = labelCounter++;
                    out.push("#", label);
                    aliasInfo.set(o as object, label);
                } else if (typeof lookup === "number") {
                    out.push("^", lookup);
                    return;
                }

                const ctor = (o as object).constructor;
                if (ctor === Number) {
                    out.push("N:", (o as { valueOf(): number }).valueOf());
                    return;
                }
                if (ctor === Boolean) {
                    out.push(
                        "B:",
                        String((o as { valueOf(): boolean }).valueOf())
                    );
                    return;
                }
                if (ctor === String) {
                    out.push(
                        "S:",
                        serializeString(
                            (o as { valueOf(): string }).valueOf()
                        )
                    );
                    return;
                }
                if (ctor === Date) {
                    out.push("D:", (o as Date).valueOf());
                    return;
                }
                if (Array.isArray(o)) {
                    const len = o.length;
                    out.push("[");
                    for (let i = 0; i < len; i++) {
                        if (Object.prototype.hasOwnProperty.call(o, i)) {
                            handle(o[i]);
                        }
                        out.push(";");
                    }
                    out.push("]");
                    return;
                }
                if (ctor === Object) {
                    out.push("{");
                    for (const k of Object.keys(o as object)) {
                        out.push(serializeString(k), ":");
                        handle((o as Record<string, unknown>)[k]);
                        out.push(";");
                    }
                    out.push("}");
                    return;
                }
                throw new Error(
                    `serialization not supported for class ${ctor?.name ?? "<unknown>"}`
                );
            }
            default:
                throw new Error(`serialization not supported for type '${typeof o}'`);
        }
    }

    handle(root);
    return out.join("");
}

const tokenRE =
    /^(?:undefined|null|false|true|[NBSD]:|[{}[\];:#^]|"(?:[^\\"]|\\.)*"|[-+]?(?:Infinity|(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][-+]?[0-9]+)?))/;

function isStringToken(t: string): boolean {
    return t[0] === '"';
}
function isNumberToken(t: string): boolean {
    const c = t[0]!;
    return (c >= "0" && c <= "9") || c === "." || c === "-" || c === "+";
}
function isLabelToken(t: string): boolean {
    return /^[0-9]+$/.test(t);
}

export function deserialize(s: string): unknown {
    let offset = 0;
    let next: string | null = null;

    function pushBack(token: string): void {
        if (next !== null) throw "Internal parser error: duplicate push-back.";
        next = token;
    }

    function nextToken(): string {
        if (next !== null) {
            const result = next;
            next = null;
            return result;
        }
        const rest = s.substring(offset);
        const match = tokenRE.exec(rest);
        if (!match) throw "Could not read token.";
        const result = match[0];
        offset += result.length;
        return result;
    }

    function expectNextToken(what: string, test: (t: string) => boolean): string {
        const result = nextToken();
        if (!test(result)) {
            pushBack(result);
            throw `${what[0]!.toUpperCase() + what.substr(1)} expected.`;
        }
        return result;
    }

    function expectDelimiter(delim: string): void {
        expectNextToken(`'${delim}'`, t => t === delim);
    }

    function lookAhead(): string {
        const result = nextToken();
        pushBack(result);
        return result;
    }

    const references = new Map<string, unknown>();

    function parse(label?: string): unknown {
        function register<T>(o: T): T {
            if (label !== undefined) references.set(label, o);
            return o;
        }
        const token = nextToken();
        switch (token) {
            case "undefined":
                return undefined;
            case "null":
                return null;
            case "false":
                return false;
            case "true":
                return true;
            case "N:":
                return register(
                    new Number(parseFloat(expectNextToken("number", isNumberToken)))
                );
            case "S:":
                return register(
                    new String(
                        deserializeString(expectNextToken("string", isStringToken))
                    )
                );
            case "B:":
                return register(
                    new Boolean(
                        expectNextToken(
                            "boolean",
                            t => t === "true" || t === "false"
                        ) === "true"
                    )
                );
            case "D:":
                return register(
                    new Date(
                        parseInt(
                            expectNextToken("integer", t => /^[-+]?[0-9]+$/.test(t))
                        )
                    )
                );
            case "{": {
                const o = register<Record<string, unknown>>({});
                for (;;) {
                    if (lookAhead() === "}") {
                        nextToken();
                        return o;
                    }
                    const key = expectNextToken("string (key in object)", isStringToken);
                    expectDelimiter(":");
                    o[deserializeString(key)] = parse();
                    expectDelimiter(";");
                }
            }
            case "[": {
                const a = register<unknown[]>([]);
                for (let n = 0; ; n++) {
                    const t = nextToken();
                    if (t === ";") {
                        continue;
                    }
                    if (t === "]") {
                        a.length = n;
                        return a;
                    }
                    pushBack(t);
                    a[n] = parse();
                    expectDelimiter(";");
                }
            }
            case "#":
                return parse(expectNextToken("label", isLabelToken));
            case "^": {
                const ref = expectNextToken("label", isLabelToken);
                const value = references.get(ref);
                if (value === undefined) {
                    throw `Dangling reference «${ref}».`;
                }
                return value;
            }
            default:
                if (isStringToken(token)) return deserializeString(token);
                if (isNumberToken(token)) return parseFloat(token);
                pushBack(token);
                throw "Value expected.";
        }
    }

    try {
        const result = parse();
        if (offset !== s.length) throw `Found extra text after parsed value.`;
        return result;
    } catch (e) {
        if (typeof e !== "string") throw e;
        const pending = next as string | null;
        if (pending !== null) offset -= pending.length;
        throw new Error(
            `Cannot parse serialized value at offset ${offset} looking at «${
                s.substr(offset, 10) + (s.length > offset + 10 ? "..." : "")
            }»:\n${e}`
        );
    }
}
