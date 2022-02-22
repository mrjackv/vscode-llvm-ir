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
            const line = document.lineAt(i).text.split(";", 2)[0];
            const labelMatch = line.match(Regexp.label);
            const defineMatch = line.match(Regexp.define);
            const declareMatch = line.match(Regexp.declare);
            const closeMatch = line.match(Regexp.close);
            let skip = true;
            if (defineMatch !== null && defineMatch.index !== null && defineMatch.groups !== undefined) {
                const funcid = defineMatch.groups["funcid"];
                const args = defineMatch.groups["args"];
                const hasBody = line.endsWith("{");
                if (hasBody) {
                    lastFunction = new FunctionInfo(i);
                    res.functions.set(funcid, lastFunction);
                    const argsMatch = Array.from(args.matchAll(Regexp.argument));
                    argsMatch.forEach((am) => {
                        if (am.index !== undefined && am.groups !== undefined && lastFunction !== undefined) {
                            const pos = new Position(i, am.index);
                            lastFunction.values.set(am.groups["ass"], pos);
                        }
                    });
                }
            } else if (labelMatch !== null && labelMatch.index !== undefined && labelMatch.groups !== undefined) {
                const pos = new Position(i, labelMatch.index);
                if (lastFunction !== undefined) {
                    lastFunction.values.set("%" + labelMatch.groups["label"], pos);
                }
                if (lastLabelLine !== undefined) {
                    res.foldingRanges.push(new FoldingRange(lastLabelLine, i - 1, FoldingRangeKind.Region));
                }
                lastLabelLine = i;
            } else if (closeMatch !== null) {
                if (lastFunction !== undefined) {
                    res.foldingRanges.push(new FoldingRange(lastFunction.lineStart, i, FoldingRangeKind.Region));
                    lastFunction.lineEnd = i;
                    lastFunction = undefined;
                }
            } else if (declareMatch !== null && declareMatch.groups !== undefined) {
                const funcid = declareMatch.groups["funcid"];
                const offset = line.indexOf(funcid);
                res.global.values.set(funcid, new Position(i, offset));
            } else {
                skip = false;
            }

            if (!skip) {
                const identifierMatches = Array.from(line.matchAll(Regexp.refOrAss));

                identifierMatches.forEach((am) => {
                    if (am.index !== undefined && am.groups !== undefined) {
                        const pos = new Position(i, am.index);
                        if (am.groups["ass"] !== undefined) {
                            const varname = am.groups["ass"];
                            if (varname.startsWith("%")) {
                                if (lastFunction !== undefined) {
                                    lastFunction.values.set(varname, pos);
                                }
                            } else {
                                res.global.values.set(varname, pos);
                            }
                        } else if (am.groups["ref"] !== undefined) {
                            const varname = am.groups["ref"];
                            if (varname.startsWith("%")) {
                                if (lastFunction !== undefined) {
                                    this.addXref(lastFunction.users, varname, i, am.index, am.groups["ref"]);
                                }
                            } else {
                                this.addXref(res.global.users, varname, i, am.index, am.groups["ref"]);
                            }
                        }
                    }
                });
            }
        }
        return res;
    }

    private addXref(xrefMap: Map<string, Range[]>, key: string, lineNum: number, index: number, val: string) {
        const value = xrefMap.get(key);
        const newRange = new Range(new Position(lineNum, index), new Position(lineNum, index + val.length));
        if (value !== undefined) {
            value.push(newRange);
            xrefMap.set(key, value);
        } else {
            xrefMap.set(key, [newRange]);
        }
    }
}
