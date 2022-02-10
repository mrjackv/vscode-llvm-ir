import * as vscode from "vscode";
import { ModelDocumentFoldingProvider } from "./model/modelDocumentFoldingProvider";
import { ModelDocumentLinkProvider } from "./model/modelDocumentLinkProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "revng-toolbox" is now active in the web extension host!');

    const modelDocumentFilter: vscode.DocumentFilter = { pattern: "**/*.revng.yml" };
    vscode.languages.registerDocumentLinkProvider(modelDocumentFilter, new ModelDocumentLinkProvider());
    vscode.languages.registerFoldingRangeProvider(modelDocumentFilter, new ModelDocumentFoldingProvider());
}

export function deactivate() {}
