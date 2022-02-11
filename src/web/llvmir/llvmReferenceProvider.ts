import {
    CancellationToken,
    Location,
    Position,
    ProviderResult,
    ReferenceContext,
    ReferenceProvider,
    TextDocument,
} from "vscode";
import { TokenStructProvider } from "./tokenStructProvider";
import { Regexp } from "./Regexp";

export class LLVMReferenceProvider implements ReferenceProvider {
    private tokenStructProvider: TokenStructProvider;

    constructor(tokenStructProvider: TokenStructProvider) {
        this.tokenStructProvider = tokenStructProvider;
    }

    provideReferences(
        document: TextDocument,
        position: Position,
        context: ReferenceContext,
        token: CancellationToken
    ): ProviderResult<Location[]> {
        const documentMap = this.tokenStructProvider.getStruct(document);
        const varRange = document.getWordRangeAtPosition(position, Regexp.identifier);
        const varLabelRange = document.getWordRangeAtPosition(position, Regexp.label);
        if (varRange !== undefined) {
            const varXrefs = documentMap.xrefs.get(document.getText(varRange));
            return varXrefs !== undefined ? varXrefs.map((p) => new Location(document.uri, p)) : [];
        } else if (varLabelRange !== undefined) {
            const fixedName = `%${document.getText(varLabelRange)}`.replace(":", "");
            const varXrefs = documentMap.xrefs.get(fixedName);
            return varXrefs !== undefined ? varXrefs.map((p) => new Location(document.uri, p)) : [];
        } else {
            return [];
        }
    }
}
