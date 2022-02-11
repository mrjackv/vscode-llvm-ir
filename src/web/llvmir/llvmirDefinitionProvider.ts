import {
    CancellationToken,
    Definition,
    DefinitionProvider,
    Location,
    LocationLink,
    Position,
    ProviderResult,
    TextDocument,
    Uri,
} from "vscode";
import { LLScanner } from "./llScanner";
import { Regexp } from "./Regexp";
import { TokenStruct } from "./tokenStruct";

export class LLVMIRDefinitionProvider implements DefinitionProvider {
    private tokenMap: Map<Uri, TokenStruct>;

    constructor() {
        this.tokenMap = new Map<Uri, TokenStruct>();
    }

    provideDefinition(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): ProviderResult<Definition | LocationLink[]> {
        const documentMap = this.tokenMap.get(document.uri);
        const varRange = document.getWordRangeAtPosition(position, Regexp.identifier);
        const varName = document.getText(varRange);
        let varPosition: Position | undefined;
        if (documentMap !== undefined && document.version === documentMap.version && varName !== undefined) {
            varPosition = documentMap.assignments.get(varName);
        } else {
            const newDocumentMap = LLScanner.scanDocument(document);
            this.tokenMap.set(document.uri, newDocumentMap);
            varPosition = newDocumentMap.assignments.get(varName);
        }
        return varPosition !== undefined ? new Location(document.uri, varPosition) : [];
    }
}
