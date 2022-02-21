import { CancellationToken, DefinitionProvider, Location, Position, TextDocument, Uri } from "vscode";
import { getFunctionFromLine } from "./lspStruct";
import { LspStructProvider } from "./lspStructProvider";
import { Regexp } from "./Regexp";

export class LLVMIRDefinitionProvider implements DefinitionProvider {
    private lspStructProvider: LspStructProvider;

    constructor(tokenStructProvider: LspStructProvider) {
        this.lspStructProvider = tokenStructProvider;
    }

    provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Location | undefined {
        const lspStruct = this.lspStructProvider.getStruct(document);
        const varRange = document.getWordRangeAtPosition(position, Regexp.identifier);
        const varName = document.getText(varRange);
        const functionMarker = getFunctionFromLine(lspStruct.functionMarkers, position.line);
        if (varName !== undefined) {
            if (functionMarker !== undefined) {
                const functionMap = lspStruct.functions.get(functionMarker.name);
                return this.transform(document.uri, varName, lspStruct.global.assignments, functionMap?.assignments);
            } else {
                return this.transform(document.uri, varName, lspStruct.global.assignments, undefined);
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
        let globalPosition = globals.get(varName);
        return globalPosition !== undefined ? new Location(uri, globalPosition) : undefined;
    }
}
