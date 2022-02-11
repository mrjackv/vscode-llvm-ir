import * as vscode from "vscode";
import { LLVMIRDefinitionProvider } from "./llvmir/llvmirDefinitionProvider";
import { LLVMReferenceProvider } from "./llvmir/llvmReferenceProvider";
import { TokenStructProvider } from "./llvmir/tokenStructProvider";
import { ModelDocumentFoldingProvider } from "./model/modelDocumentFoldingProvider";
import { ModelDocumentLinkProvider } from "./model/modelDocumentLinkProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "revng-toolbox" is now active in the web extension host!');

    const modelDocumentFilter: vscode.DocumentFilter = { pattern: "**/*.revng.yml" };
    const llvmirDocumentFilter: vscode.DocumentFilter = { pattern: "**/*.ll" };
    const tsp = new TokenStructProvider();

    context.subscriptions.push(
        vscode.languages.registerDocumentLinkProvider(modelDocumentFilter, new ModelDocumentLinkProvider()),
        vscode.languages.registerFoldingRangeProvider(modelDocumentFilter, new ModelDocumentFoldingProvider()),
        vscode.languages.registerDefinitionProvider(llvmirDocumentFilter, new LLVMIRDefinitionProvider(tsp)),
        vscode.languages.registerReferenceProvider(llvmirDocumentFilter, new LLVMReferenceProvider(tsp))
    );
}

export function deactivate() {}
