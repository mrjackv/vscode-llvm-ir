import { FoldingRange, FoldingRangeKind, Position, Range, TextDocument, Uri } from "vscode";
import { Regexp } from "./Regexp";
import { LspStruct, VariablesStruct } from "./lspStruct";

export class LspStructProvider {
    private tokenMap: Map<Uri, LspStruct>;

    constructor() {
        this.tokenMap = new Map<Uri, LspStruct>();
    }

    getStruct(document: TextDocument): LspStruct {
        const documentMap = this.tokenMap.get(document.uri);
        if (documentMap !== undefined && document.version === documentMap.version) {
            return documentMap;
        } else {
            const newDocumentMap = this.scanDocument(document);
            this.tokenMap.set(document.uri, newDocumentMap);
            return newDocumentMap;
        }
    }

    scanDocument(document: TextDocument): LspStruct {
        const res: LspStruct = new LspStruct(document.version);
        let lastFunction: LastFunction | undefined;
        let lastLabelLine: number | undefined = undefined;
        for (let i = 0; i < document.lineCount; i++) {
            let line = document.lineAt(i).text.split(";", 2)[0];
            let labelMatch = line.match(Regexp.label);
            let defineMatch = line.match(Regexp.define);
            let closeMatch = line.match(Regexp.close);
            let skip = false;
            if (defineMatch !== null && defineMatch.index !== null && defineMatch.groups !== undefined) {
                let funcid = defineMatch.groups["funcid"];
                let args = defineMatch.groups["args"];
                let hasBody = line.endsWith("{");
                if (hasBody) {
                    let vs = new VariablesStruct();
                    lastFunction = { name: funcid, line: i, vs: vs };
                    res.functions.set(funcid, vs);
                    let argsMatch = Array.from(args.matchAll(Regexp.argument));
                    argsMatch.forEach((am) => {
                        if (am.index !== undefined && am.groups !== undefined) {
                            let pos = new Position(i, am.index);
                            vs.assignments.set(am.groups["ass"], pos);
                        }
                    });
                }
                skip = true;
            } else if (labelMatch !== null && labelMatch.index !== undefined && labelMatch.groups !== undefined) {
                let pos = new Position(i, labelMatch.index);
                if (lastFunction !== undefined) {
                    lastFunction.vs.assignments.set("%" + labelMatch.groups["label"], pos);
                }
                if (lastLabelLine !== undefined) {
                    res.foldingRanges.push(new FoldingRange(lastLabelLine, i - 1, FoldingRangeKind.Region));
                }
                skip = true;
                lastLabelLine = i;
            } else if (closeMatch !== null) {
                if (lastFunction !== undefined) {
                    res.foldingRanges.push(new FoldingRange(lastFunction.line, i, FoldingRangeKind.Region));
                    res.functionMarkers.push({ start: lastFunction.line, end: i, name: lastFunction.name });
                    res.functions.set(lastFunction.name, lastFunction.vs);
                    lastFunction = undefined;
                }
                skip = true;
            }

            if (!skip) {
                let identifierMatches = Array.from(line.matchAll(Regexp.refOrAss));

                identifierMatches.forEach((am) => {
                    if (am.index !== undefined && am.groups !== undefined) {
                        let pos = new Position(i, am.index);
                        if (am.groups["ass"] !== undefined) {
                            let varname = am.groups["ass"];
                            if (varname.startsWith("%")) {
                                if (lastFunction !== undefined) {
                                    lastFunction.vs.assignments.set(varname, pos);
                                }
                            } else {
                                res.global.assignments.set(varname, pos);
                            }
                        } else if (am.groups["ref"] !== undefined) {
                            let varname = am.groups["ref"];
                            if (varname.startsWith("%")) {
                                if (lastFunction !== undefined) {
                                    this.addXref(lastFunction.vs.xrefs, varname, i, am.index, am.groups["ref"]);
                                }
                            } else {
                                this.addXref(res.global.xrefs, varname, i, am.index, am.groups["ref"]);
                            }
                        }
                    }
                });
            }
        }
        return res;
    }

    private addXref(xrefMap: Map<string, Range[]>, key: string, lineNum: number, index: number, val: string) {
        let value = xrefMap.get(key);
        let newRange = new Range(new Position(lineNum, index), new Position(lineNum, index + val.length));
        if (value !== undefined) {
            value.push(newRange);
            xrefMap.set(key, value);
        } else {
            xrefMap.set(key, [newRange]);
        }
    }
}

interface LastFunction {
    name: string;
    line: number;
    vs: VariablesStruct;
}
