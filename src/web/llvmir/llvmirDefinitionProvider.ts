import {
    CancellationToken,
    Definition,
    DefinitionProvider,
    Location,
    LocationLink,
    Position,
    ProviderResult,
    TextDocument,
} from "vscode";
import { TokenStructProvider } from "./tokenStructProvider";
import { Regexp } from "./Regexp";

export class LLVMIRDefinitionProvider implements DefinitionProvider {
    private tokenStructProvider: TokenStructProvider;

    constructor(tokenStructProvider: TokenStructProvider) {
        this.tokenStructProvider = tokenStructProvider;
    }

    provideDefinition(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): ProviderResult<Definition | LocationLink[]> {
        const documentMap = this.tokenStructProvider.getStruct(document);
        const varRange = document.getWordRangeAtPosition(position, Regexp.identifier);
        const varName = document.getText(varRange);
        let varPosition: Position | undefined;
        if (varName !== undefined) {
            varPosition = documentMap.assignments.get(varName);
        }
        return varPosition !== undefined ? new Location(document.uri, varPosition) : [];
    }
}
