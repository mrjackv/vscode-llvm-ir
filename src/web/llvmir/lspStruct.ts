import { FoldingRange, Position, Range } from "vscode";

export class LspStruct {
    public version: number;
    public global: VariablesStruct;
    public functions: Map<string, VariablesStruct>;
    public foldingRanges: FoldingRange[];
    public functionMarkers: FunctionMarker[];

    constructor(version: number) {
        this.version = version;
        this.global = new VariablesStruct();
        this.functions = new Map<string, VariablesStruct>();
        this.foldingRanges = [];
        this.functionMarkers = [];
    }
}

export class VariablesStruct {
    public assignments: Map<string, Position>;
    public xrefs: Map<string, Range[]>;

    constructor() {
        this.assignments = new Map<string, Position>();
        this.xrefs = new Map<string, Range[]>();
    }
}

export interface FunctionMarker {
    start: number;
    end: number;
    name: string;
}

export function getFunctionFromLine(fms: FunctionMarker[], line: number): FunctionMarker | undefined {
    return fms.find((fm) => fm.start <= line && fm.end >= line);
}
