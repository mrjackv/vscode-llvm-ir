//
// This file is distributed under the MIT License. See LICENSE.md for details.
//

import { CancellationToken, DefinitionProvider, Location, Position, TextDocument, Uri } from "vscode";
import { getFunctionFromLine } from "./lsp_model";
import { LspModelProvider } from "./lsp_model_provider";
import { Regexp } from "./regexp";

export class LLVMIRDefinitionProvider implements DefinitionProvider {
    private lspModelProvider: LspModelProvider;

    constructor(tokenModelProvider: LspModelProvider) {
        this.lspModelProvider = tokenModelProvider;
    }

    provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Location | undefined {
        const lspModel = this.lspModelProvider.getModel(document);
        const varRange = document.getWordRangeAtPosition(position, Regexp.identifier);
        const varName = document.getText(varRange);
        const functionInfo = getFunctionFromLine(lspModel, position.line);
        if (varName !== undefined) {
            if (functionInfo !== undefined) {
                return this.transform(document.uri, varName, lspModel.global.values, functionInfo.info.values);
            } else {
                return this.transform(document.uri, varName, lspModel.global.values, undefined);
            }
        }
        return undefined;
    }

    private transform(
        uri: Uri,
        varName: string,
        globals: Map<string, Position>,
        locals: Map<string, Position> | undefined
    ): Location | undefined {
        let localPosition;
        if (locals !== undefined) {
            localPosition = locals.get(varName);
        }

        if (localPosition !== undefined) {
            return new Location(uri, localPosition);
        }
        const globalPosition = globals.get(varName);
        return globalPosition !== undefined ? new Location(uri, globalPosition) : undefined;
    }
}
