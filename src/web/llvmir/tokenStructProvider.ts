import { Position, Range, TextDocument, Uri } from "vscode";
import { Regexp } from "./Regexp";
import { TokenStruct } from "./tokenStruct";

export class TokenStructProvider {
    private tokenMap: Map<Uri, TokenStruct>;

    constructor() {
        this.tokenMap = new Map<Uri, TokenStruct>();
    }

    getStruct(document: TextDocument): TokenStruct {
        const documentMap = this.tokenMap.get(document.uri);
        if (documentMap !== undefined && document.version === documentMap.version) {
            return documentMap;
        } else {
            const newDocumentMap = this.scanDocument(document);
            this.tokenMap.set(document.uri, newDocumentMap);
            return newDocumentMap;
        }
    }

    scanDocument(document: TextDocument): TokenStruct {
        const assMap = new Map<string, Position>();
        const xrefMap = new Map<string, Range[]>();
        for (let i = 0; i < document.lineCount; i++) {
            let line = document.lineAt(i).text;
            let labelMatch = line.match(Regexp.label);
            let assignmentMatch = line.match(Regexp.assignment);
            let isAssignment = false;
            if (labelMatch !== null && labelMatch.index !== undefined) {
                let pos = new Position(i, labelMatch.index);
                assMap.set("%" + labelMatch[1], pos);
            } else if (assignmentMatch !== null && assignmentMatch.index !== undefined) {
                let pos = new Position(i, assignmentMatch.index);
                assMap.set(assignmentMatch[1], pos);
                isAssignment = true;
            }

            let regexpIterator = line.matchAll(Regexp.identifier);
            if (isAssignment) {
                regexpIterator.next();
            }
            while (true) {
                let newMatch = regexpIterator.next();
                if (newMatch.value !== undefined) {
                    this.addXref(xrefMap, newMatch.value[0], i, newMatch);
                } else {
                    break;
                }
            }
        }
        return { version: document.version, assignments: assMap, xrefs: xrefMap };
    }

    private addXref(xrefMap: Map<string, Range[]>, key: string, lineNum: number, match: any) {
        let value = xrefMap.get(key);
        let newRange = new Range(
            new Position(lineNum, match.value.index),
            new Position(lineNum, match.value.index + match.value[0].length)
        );
        if (value !== undefined) {
            value.push(newRange);
            xrefMap.set(key, value);
        } else {
            xrefMap.set(key, [newRange]);
        }
    }
}
