import { Position, Range } from "vscode";

export interface TokenStruct {
    version: number;
    assignments: Map<string, Position>;
    xrefs: Map<string, Range[]>;
}
