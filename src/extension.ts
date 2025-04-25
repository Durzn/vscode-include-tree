// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { configCache } from './ConfigCache';
import IncludeTreeDataProvider from './TreeView/IncludeTreeDataProvider';
import { Commands, Constants } from './Constants';
import { ExtensionMode } from './ConfigAccess';
import { includeTreeGlobals } from './Globals';


function onConfigChange() {
	configCache.onConfigChange();
	vscode.commands.executeCommand('setContext', Constants.EXTENSION_NAME + '.extensionMode', configCache.extensionMode.toString());
}

function onEditorChange() {
	if (configCache.extensionMode === ExtensionMode.AUTOMATIC) {
		const allowedLanguages: string[] = ['c', 'cpp'];
		if (!vscode.window.activeTextEditor) { return; }
		if (!vscode.window.activeTextEditor.document) { return; }
		if (!allowedLanguages.includes(vscode.window.activeTextEditor.document.languageId)) { return; }
		vscode.commands.executeCommand(Commands.UPDATE, vscode.window.activeTextEditor.document.uri);
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	includeTreeGlobals.outputChannel = vscode.window.createOutputChannel(`${Constants.EXTENSION_NAME}`);
	const includeTreeDataProvider = new IncludeTreeDataProvider();

	vscode.workspace.onDidChangeConfiguration(onConfigChange);
	vscode.window.registerTreeDataProvider(Constants.EXTENSION_NAME + '.includeTree', includeTreeDataProvider);
	vscode.commands.registerCommand(Commands.UPDATE, async (fileUri: vscode.Uri) => {
		const compiler = configCache.compiler;
		const includeTree = await compiler.buildTree(fileUri);
		includeTreeDataProvider.setIncludeTree(includeTree);
	});
	vscode.commands.registerCommand(Constants.EXTENSION_NAME + '.open', (filePath: string) => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
	});

	vscode.window.onDidChangeActiveTextEditor(onEditorChange);
	vscode.workspace.onDidSaveTextDocument(onEditorChange);

	/* Trigger extension on startup */
	onEditorChange();
}

// This method is called when your extension is deactivated
export function deactivate() { }
