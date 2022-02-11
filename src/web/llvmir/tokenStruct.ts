import { Position } from "vscode";

export interface TokenStruct {
    version: number;
    assignments: Map<string, Position>;
}
