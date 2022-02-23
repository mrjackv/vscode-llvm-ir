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
import { getFunctionFromLine } from "./lsp_model";
import { LspModelProvider } from "./lsp_model_provider";
import { Regexp } from "./regexp";

export class LLVMReferenceProvider implements ReferenceProvider {
    private lspModelProvider: LspModelProvider;

    constructor(lspModelProvider: LspModelProvider) {
        this.lspModelProvider = lspModelProvider;
    }

    provideReferences(
        document: TextDocument,
        position: Position,
        context: ReferenceContext,
        token: CancellationToken
    ): ProviderResult<Location[]> {
        const lspModel = this.lspModelProvider.getModel(document);
        const varRange = document.getWordRangeAtPosition(position, Regexp.identifier);
        const labelRange = document.getWordRangeAtPosition(position, Regexp.label);
        const functionInfo = getFunctionFromLine(lspModel, position.line);
        if (varRange !== undefined) {
            const varName = document.getText(varRange);
            if (varName.startsWith("%") && functionInfo !== undefined) {
                return this.transform(document.uri, functionInfo.info.users.get(varName));
            } else {
                const varXrefs = lspModel.global.users.get(varName);
                return this.transform(document.uri, varXrefs);
            }
        } else if (labelRange !== undefined && functionInfo !== undefined) {
            const fixedName = `%${document.getText(labelRange)}`.replace(":", "");
            return this.transform(document.uri, functionInfo.info.users.get(fixedName));
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
