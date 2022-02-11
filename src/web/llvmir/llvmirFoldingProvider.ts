import {
    CancellationToken,
    Event,
    FoldingContext,
    FoldingRange,
    FoldingRangeProvider,
    ProviderResult,
    TextDocument,
} from "vscode";
import { TokenStructProvider } from "./tokenStructProvider";

export class LLVMIRFoldingProvider implements FoldingRangeProvider {
    private tokenStructProvider: TokenStructProvider;

    constructor(tokenStructProvider: TokenStructProvider) {
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
