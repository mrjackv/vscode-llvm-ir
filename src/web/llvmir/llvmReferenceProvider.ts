//
// This file is distributed under the MIT License. See LICENSE.md for details.
//

import {
    CancellationToken,
    Location,
    Position,
    ProviderResult,
    Range,
    ReferenceContext,
    ReferenceProvider,
    TextDocument,
    Uri,
} from "vscode";
import { getFunctionFromLine } from "./lspStruct";
import { LspStructProvider } from "./lspStructProvider";
import { Regexp } from "./Regexp";

export class LLVMReferenceProvider implements ReferenceProvider {
    private lspStructProvider: LspStructProvider;

    constructor(lspStructProvider: LspStructProvider) {
        this.lspStructProvider = lspStructProvider;
    }

    provideReferences(
        document: TextDocument,
        position: Position,
        context: ReferenceContext,
        token: CancellationToken
    ): ProviderResult<Location[]> {
        const lspStruct = this.lspStructProvider.getStruct(document);
        const varRange = document.getWordRangeAtPosition(position, Regexp.identifier);
        const labelRange = document.getWordRangeAtPosition(position, Regexp.label);
        const functionMarker = getFunctionFromLine(lspStruct.functionMarkers, position.line);
        if (varRange !== undefined) {
            const varName = document.getText(varRange);
            if (varName.startsWith("%") && functionMarker !== undefined) {
                const functionMap = lspStruct.functions.get(functionMarker.name);
                return this.transform(document.uri, functionMap?.xrefs?.get(varName));
            } else {
                const varXrefs = lspStruct.global.xrefs.get(varName);
                return this.transform(document.uri, varXrefs);
            }
        } else if (labelRange !== undefined && functionMarker !== undefined) {
            const fixedName = `%${document.getText(labelRange)}`.replace(":", "");
            const functionMap = lspStruct.functions.get(functionMarker.name);
            return this.transform(document.uri, functionMap?.xrefs?.get(fixedName));
        } else {
            return [];
        }
    }

    private transform(uri: Uri, res: Range[] | undefined): Location[] | [] {
        const ret = [];
        if (res !== undefined) {
            ret.push(...res.map((e) => new Location(uri, e)));
        }
        return ret;
    }
}
