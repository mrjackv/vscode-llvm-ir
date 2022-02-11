import { Position, TextDocument } from "vscode";
import { Regexp } from "./Regexp";
import { TokenStruct } from "./tokenStruct";

export namespace LLScanner {
    export function scanDocument(document: TextDocument): TokenStruct {
        const newMap = new Map<string, Position>();
        for (let i = 0; i < document.lineCount; i++) {
            let line = document.lineAt(i).text;
            let labelMatch = line.match(Regexp.label);
            let assignmentMatch = line.match(Regexp.assignment);
            if (labelMatch !== null && labelMatch.index !== undefined) {
                let pos = new Position(i, labelMatch.index);
                newMap.set("%" + labelMatch[1], pos);
            } else if (assignmentMatch !== null && assignmentMatch.index !== undefined) {
                let pos = new Position(i, assignmentMatch.index);
                newMap.set(assignmentMatch[1], pos);
            }
        }
        return { version: document.version, assignments: newMap };
    }
}
