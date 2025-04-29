import * as vscode from 'vscode';
import { configCache } from './ConfigCache';
import IncludeTreeDataProvider from './TreeView/IncludeTreeDataProvider';
import { Commands, Constants, Settings } from './Constants';
import { ExtensionMode } from './ConfigAccess';
import { includeTreeGlobals } from './Globals';
import { FileSystemHandler } from './Util/FileSystemHandler';

async function scanWorkspace() {
	let workspaceFolders = vscode.workspace.workspaceFolders;
	let foldersInWorkspaces: string[] = [];
	if (!workspaceFolders) { return foldersInWorkspaces; };

	for (let workspace of workspaceFolders) {
		for await (const file of FileSystemHandler.getFolders(workspace.uri, ['.h', '.hpp', '.hxx', '.hh'])) {
			foldersInWorkspaces.push(file.fsPath);
		}
	}

	return foldersInWorkspaces;
}


async function onConfigChange(event: vscode.ConfigurationChangeEvent) {
	configCache.onConfigChange();

	if (event.affectsConfiguration(Settings.SCANWORKSPACE)) {
		if (configCache.scanWorkspaceForIncludes) {
			includeTreeGlobals.workspaceIncludes = await scanWorkspace();
		}
		else {
			includeTreeGlobals.workspaceIncludes = [];
		}
		onEditorChange();
	}

	vscode.commands.executeCommand('setContext', Constants.EXTENSION_NAME + '.extensionMode', configCache.extensionMode.toString());
}

function onEditorChange() {
	if (configCache.extensionMode === ExtensionMode.AUTOMATIC) {
		const allowedLanguages: string[] = ['c', 'cpp'];
		if (!vscode.window.activeTextEditor) { return; }
		if (!vscode.window.activeTextEditor.document) { return; }
		if (!allowedLanguages.includes(vscode.window.activeTextEditor.document.languageId)) { return; }
		vscode.commands.executeCommand(Commands.SHOW, vscode.window.activeTextEditor.document.uri);
	}
}

async function onStartup() {
	await vscode.commands.executeCommand(Commands.SCAN);
	onEditorChange();
}

export function activate(context: vscode.ExtensionContext) {

	includeTreeGlobals.outputChannel = vscode.window.createOutputChannel(`${Constants.EXTENSION_NAME}`);
	const includeTreeDataProvider = new IncludeTreeDataProvider();

	vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
		if (event.affectsConfiguration(Constants.EXTENSION_NAME)) {
			onConfigChange(event);
		}
	});
	vscode.window.registerTreeDataProvider(Constants.EXTENSION_NAME + '.includeTree', includeTreeDataProvider);
	vscode.commands.registerCommand(Commands.SHOW, async (fileUri: vscode.Uri) => {
		const compiler = configCache.compiler;
		const includeTree = await compiler.buildTree(fileUri, includeTreeGlobals.workspaceIncludes.concat(configCache.additionalIncludes));
		includeTreeDataProvider.setIncludeTree(includeTree);
	});
	vscode.commands.registerCommand(Constants.EXTENSION_NAME + '.open', (filePath: string) => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
	});
	vscode.commands.registerCommand(Commands.SCAN, async () => {
		if (configCache.scanWorkspaceForIncludes) {
			includeTreeGlobals.workspaceIncludes = await scanWorkspace();
		}
	});

	vscode.window.onDidChangeActiveTextEditor(onEditorChange);
	vscode.workspace.onDidSaveTextDocument(onEditorChange);

	/* Trigger extension on startup */
	onStartup();
}

// This method is called when your extension is deactivated
export function deactivate() { }
