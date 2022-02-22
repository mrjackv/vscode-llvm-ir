//
// This file is distributed under the MIT License. See LICENSE.md for details.
//

import * as vscode from "vscode";
import { LLVMIRDefinitionProvider } from "./llvmir/llvmirDefinitionProvider";
import { LLVMIRFoldingProvider } from "./llvmir/llvmirFoldingProvider";
import { LLVMReferenceProvider } from "./llvmir/llvmReferenceProvider";
import { LspStructProvider } from "./llvmir/lspStructProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "revng-vscode-llvm-ir" is now active in the web extension host!');

    const llvmirDocumentFilter: vscode.DocumentFilter = { pattern: "**/*.ll" };
    const lsp = new LspStructProvider();

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(llvmirDocumentFilter, new LLVMIRDefinitionProvider(lsp)),
        vscode.languages.registerReferenceProvider(llvmirDocumentFilter, new LLVMReferenceProvider(lsp)),
        vscode.languages.registerFoldingRangeProvider(llvmirDocumentFilter, new LLVMIRFoldingProvider(lsp))
    );
}

export function deactivate() {}
