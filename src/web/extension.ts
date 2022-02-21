import * as vscode from "vscode";
import { LLVMIRDefinitionProvider } from "./llvmir/llvmirDefinitionProvider";
import { LLVMIRFoldingProvider } from "./llvmir/llvmirFoldingProvider";
import { LLVMReferenceProvider } from "./llvmir/llvmReferenceProvider";
import { LspStructProvider } from "./llvmir/lspStructProvider";

export function activate(context: vscode.ExtensionContext) {
    const llvmirDocumentFilter: vscode.DocumentFilter = { pattern: "**/*.ll" };
    const lsp = new LspStructProvider();

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(llvmirDocumentFilter, new LLVMIRDefinitionProvider(lsp)),
        vscode.languages.registerReferenceProvider(llvmirDocumentFilter, new LLVMReferenceProvider(lsp)),
        vscode.languages.registerFoldingRangeProvider(llvmirDocumentFilter, new LLVMIRFoldingProvider(lsp))
    );
}

export function deactivate() {}
