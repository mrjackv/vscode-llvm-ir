import {
    CancellationToken,
    FoldingContext,
    FoldingRange,
    FoldingRangeProvider,
    ProviderResult,
    TextDocument,
} from "vscode";
import { LspStructProvider } from "./lspStructProvider";

export class LLVMIRFoldingProvider implements FoldingRangeProvider {
    private tokenStructProvider: LspStructProvider;

    constructor(tokenStructProvider: LspStructProvider) {
        this.tokenStructProvider = tokenStructProvider;
    }

    provideFoldingRanges(
        document: TextDocument,
        context: FoldingContext,
        token: CancellationToken
    ): ProviderResult<FoldingRange[]> {
        const documentMap = this.tokenStructProvider.getStruct(document);
        return documentMap.foldingRanges;
    }
}
