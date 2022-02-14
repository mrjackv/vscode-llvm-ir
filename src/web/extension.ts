import * as vscode from "vscode";
import { LLVMIRDefinitionProvider } from "./llvmir/llvmirDefinitionProvider";
import { LLVMIRFoldingProvider } from "./llvmir/llvmirFoldingProvider";
import { LLVMReferenceProvider } from "./llvmir/llvmReferenceProvider";
import { TokenStructProvider } from "./llvmir/tokenStructProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "revng-vscode-llvm-ir" is now active in the web extension host!');

    const llvmirDocumentFilter: vscode.DocumentFilter = { pattern: "**/*.ll" };
    const tsp = new TokenStructProvider();

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(llvmirDocumentFilter, new LLVMIRDefinitionProvider(tsp)),
        vscode.languages.registerReferenceProvider(llvmirDocumentFilter, new LLVMReferenceProvider(tsp)),
        vscode.languages.registerFoldingRangeProvider(llvmirDocumentFilter, new LLVMIRFoldingProvider(tsp))
    );
}

export function deactivate() {}
