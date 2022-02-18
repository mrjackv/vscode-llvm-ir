import { FoldingRange, Position, Range } from "vscode";

export interface LspStruct {
    version: number;
    assignments: Map<string, Position>;
    xrefs: Map<string, Range[]>;
    foldingRanges: FoldingRange[];
}
