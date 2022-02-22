//
// This file is distributed under the MIT License. See LICENSE.md for details.
//

import * as vscode from "vscode";
import { LLVMIRDefinitionProvider } from "./llvmir/definition_provider";
import { LLVMIRFoldingProvider } from "./llvmir/folding_provider";
import { LLVMReferenceProvider } from "./llvmir/reference_provider";
import { LspModelProvider } from "./llvmir/lsp_model_provider";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "revng-vscode-llvm-ir" is now active in the web extension host!');

    const llvmirDocumentFilter: vscode.DocumentFilter = { pattern: "**/*.ll" };
    const lsp = new LspModelProvider();

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(llvmirDocumentFilter, new LLVMIRDefinitionProvider(lsp)),
        vscode.languages.registerReferenceProvider(llvmirDocumentFilter, new LLVMReferenceProvider(lsp)),
        vscode.languages.registerFoldingRangeProvider(llvmirDocumentFilter, new LLVMIRFoldingProvider(lsp))
    );
}

export function deactivate() {}
