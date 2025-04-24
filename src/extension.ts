// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ConfigCache, { configCache } from './ConfigCache';
import IncludeTreeDataProvider from './TreeView/IncludeTreeDataProvider';
import { Commands, Constants } from './Constants';


function onConfigChange() {
	configCache.onConfigChange();
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	vscode.workspace.onDidChangeConfiguration(onConfigChange);
	const includeTreeDataProvider = new IncludeTreeDataProvider();
	vscode.window.registerTreeDataProvider(Constants.EXTENSION_NAME + '.includeTree', includeTreeDataProvider);
	vscode.commands.registerCommand(Commands.REFRESH, () => {
		includeTreeDataProvider.refresh();
	});
	vscode.commands.registerCommand(Commands.UPDATE, async (fileUri: vscode.Uri) => {
		const compiler = configCache.compiler;
		const includeTree = await compiler.buildTree(fileUri);
		includeTreeDataProvider.setIncludeTree(includeTree);
	});
}

// This method is called when your extension is deactivated
export function deactivate() { }
