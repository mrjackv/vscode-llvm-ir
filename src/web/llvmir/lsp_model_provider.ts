//
// This file is distributed under the MIT License. See LICENSE.md for details.
//

import { FoldingRange, FoldingRangeKind, Position, Range, TextDocument, Uri } from "vscode";
import { FunctionInfo, LspModel } from "./lsp_model";
import { Regexp } from "./regexp";

export class LspModelProvider {
    private documentMap: Map<Uri, LspModel>;

    constructor() {
        this.documentMap = new Map<Uri, LspModel>();
    }

    public getModel(document: TextDocument): LspModel {
        const documentMap = this.documentMap.get(document.uri);
        if (documentMap !== undefined && document.version === documentMap.version) {
            return documentMap;
        } else {
            const newDocumentMap = this.scanDocument(document);
            this.documentMap.set(document.uri, newDocumentMap);
            return newDocumentMap;
        }
    }

    private scanDocument(document: TextDocument): LspModel {
        const res: LspModel = new LspModel(document.version);
        let lastFunction: FunctionInfo | undefined;
        let lastLabelLine: number | undefined = undefined;
        for (let i = 0; i < document.lineCount; i++) {
            // Split at the first ';' to exclude comments
            const line = document.lineAt(i).text.split(";", 2)[0];

            // For each line we first check for line-long declarations
            // if we find them we skip looking for values/users
            const labelMatch = line.match(Regexp.label);
            const defineMatch = line.match(Regexp.define);
            const declareMatch = line.match(Regexp.declare);
            const closeMatch = line.match(Regexp.close);

            if (defineMatch !== null && defineMatch.index !== null && defineMatch.groups !== undefined) {
                // Line is define, we add the funcid to the global values and parse
                // the parameters as local values
                const funcid = defineMatch.groups["funcid"];
                const args = defineMatch.groups["args"];

                // TODO: use the 'open' capture
                if (line.endsWith("{")) {
                    lastFunction = new FunctionInfo(i);
                    res.functions.set(funcid, lastFunction);

                    // Take the arguments of the function and add them to the values
                    const argsOffset = line.indexOf(args);
                    const argsMatch = Array.from(args.matchAll(Regexp.argument));
                    argsMatch.forEach((am) => {
                        if (am.index !== undefined && am.groups !== undefined && lastFunction !== undefined) {
                            const pos = new Position(i, argsOffset + am.index);
                            lastFunction.values.set(am.groups["value"], pos);
                        }
                    });
                }
            } else if (labelMatch !== null && labelMatch.index !== undefined && labelMatch.groups !== undefined) {
                // If a label is found, we add a '%' to make it coherent w.r.t. jump instructions
                const pos = new Position(i, labelMatch.index);
                if (lastFunction !== undefined) {
                    lastFunction.values.set("%" + labelMatch.groups["label"], pos);
                }
                if (lastLabelLine !== undefined) {
                    // When a new label is found, add a folding range for the previous
                    res.foldingRanges.push(new FoldingRange(lastLabelLine, i - 1, FoldingRangeKind.Region));
                }
                lastLabelLine = i;
            } else if (closeMatch !== null) {
                if (lastFunction !== undefined) {
                    // When a close bracket is detected wrap up the function definition
                    // * Add a folding range for the function
                    // * Add the line end
                    // * undefine lastFunction to return to the 'global' context only
                    // * If there is an 'open' label, close it
                    res.foldingRanges.push(new FoldingRange(lastFunction.lineStart, i, FoldingRangeKind.Region));
                    lastFunction.lineEnd = i;
                    lastFunction = undefined;

                    if (lastLabelLine !== undefined) {
                        res.foldingRanges.push(new FoldingRange(lastLabelLine, i, FoldingRangeKind.Region));
                    }
                }
            } else if (declareMatch !== null && declareMatch.groups !== undefined) {
                // Treat declarations as global values
                const funcid = declareMatch.groups["funcid"];
                const offset = line.indexOf(funcid);
                res.global.values.set(funcid, new Position(i, offset));
            } else {
                // If none of these apply search for values/users
                const identifierMatches = Array.from(line.matchAll(Regexp.refOrAss));

                identifierMatches.forEach((am) => {
                    if (am.index !== undefined && am.groups !== undefined) {
                        const pos = new Position(i, am.index);
                        if (am.groups["value"] !== undefined) {
                            const varname = am.groups["value"];
                            if (varname.startsWith("%") && lastFunction !== undefined) {
                                lastFunction.values.set(varname, pos);
                            } else {
                                res.global.values.set(varname, pos);
                            }
                        } else if (am.groups["user"] !== undefined) {
                            const varname = am.groups["user"];
                            if (varname.startsWith("%") && lastFunction !== undefined) {
                                this.addUser(lastFunction.users, varname, i, am.index, am.groups["user"]);
                            } else {
                                this.addUser(res.global.users, varname, i, am.index, am.groups["user"]);
                            }
                        }
                    }
                });
            }
        }
        return res;
    }

    private addUser(users: Map<string, Range[]>, key: string, lineNum: number, index: number, matchString: string) {
        const value = users.get(key);
        const newRange = new Range(lineNum, index, lineNum, index + matchString.length);
        if (value !== undefined) {
            value.push(newRange);
            users.set(key, value);
        } else {
            users.set(key, [newRange]);
        }
    }
}
