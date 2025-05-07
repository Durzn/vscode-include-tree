import * as vscode from 'vscode';
import { configCache } from './ConfigCache';
import IncludeTreeDataProvider from './TreeView/IncludeTreeDataProvider';
import { Commands, Constants, Settings } from './Constants';
import { ExtensionMode } from './ConfigAccess';
import { includeTreeGlobals } from './Globals';
import { FileSystemHandler } from './Util/FileSystemHandler';
import IncludeTree from './IncludeTree';

const VALID_HEADER_EXTENSIONS = ['.h', '.hpp', '.hxx', '.hh'];

async function scanWorkspace() {
	let workspaceFolders = vscode.workspace.workspaceFolders;
	let foldersInWorkspaces: string[] = [];
	if (!workspaceFolders) { return foldersInWorkspaces; };

	for (let workspace of workspaceFolders) {
		for await (const file of FileSystemHandler.getFolders(workspace.uri, VALID_HEADER_EXTENSIONS)) {
			foldersInWorkspaces.push("./" + vscode.workspace.asRelativePath(file.fsPath));
		}
	}

	return foldersInWorkspaces;
}

async function scanCompileCommands() {
	if (configCache.resolvedCompileCommandsPath === "") {
		includeTreeGlobals.parsedCompileCommandsJson = undefined;
	}
	else {
		let fileUri = vscode.Uri.file(configCache.resolvedCompileCommandsPath);
		try {
			/* Check if file exists */
			await vscode.workspace.fs.stat(fileUri);
			let parsedFile = await vscode.workspace.fs.readFile(vscode.Uri.file(configCache.resolvedCompileCommandsPath));
			includeTreeGlobals.parsedCompileCommandsJson = JSON.parse(parsedFile.toString());
		}
		catch {
			includeTreeGlobals.parsedCompileCommandsJson = undefined;
		}
	}
}

async function onConfigChange(event: vscode.ConfigurationChangeEvent) {
	configCache.onConfigChange();

	if (event.affectsConfiguration(Constants.EXTENSION_NAME)) {
		if (event.affectsConfiguration(Settings.SCAN_WORKSPACE)) {
			if (configCache.scanWorkspaceForIncludes) {
				includeTreeGlobals.workspaceIncludes = await scanWorkspace();
			}
			else {
				includeTreeGlobals.workspaceIncludes = [];
			}
		}
		if (event.affectsConfiguration(Settings.COMPILE_COMMANDS_PATH) || event.affectsConfiguration(Settings.EXTENSION_MODE)) {
			await scanCompileCommands();
		}
		if (event.affectsConfiguration(Settings.EXTENSION_MODE)) {
			vscode.commands.executeCommand('setContext', Settings.EXTENSION_MODE, configCache.extensionMode.toString());
		}
		if (event.affectsConfiguration(Settings.BUILD_CACHE)) {
			vscode.commands.executeCommand(Commands.BUILD_CACHE);
		}

		onEditorChange();
	}
}

function parseFileFromCommand(command: string): string {
	const regex = /-c\s\S+/g;
	const matches = command.match(regex);
	if (!matches) {
		return "";
	}
	return matches[0].slice(3, matches[0].length);
}

function parseIncludesFromCommand(command: string): string[] {
	const regex = /-I\S+/g;
	const matches = command.match(regex);
	if (!matches) {
		return [];
	}
	return matches.map((match) => match.slice(2, match.length));
}

async function getIncludesOfFile(fileUri: vscode.Uri, extensionMode: ExtensionMode): Promise<string[]> {
	return new Promise(async (resolve) => {
		let includes = configCache.additionalIncludes;

		let fileExtension = FileSystemHandler.getFileExtension(fileUri);
		/* Header files are not listed in compile_commands.json and need special handling */
		if (VALID_HEADER_EXTENSIONS.includes(fileExtension)) {
			/* H file */
			if (configCache.scanWorkspaceForIncludes) {
				includes = includes.concat(includeTreeGlobals.workspaceIncludes);
			}
		}
		else {
			/* C file */
			if (includeTreeGlobals.parsedCompileCommandsJson === undefined) {
				if (configCache.scanWorkspaceForIncludes) {
					includes = includes.concat(includeTreeGlobals.workspaceIncludes);
				}
			}
			else {
				/* compile_commands exists => Use that */
				for (let i = 0; i < includeTreeGlobals.parsedCompileCommandsJson.length; i++) {
					const currentParameter = includeTreeGlobals.parsedCompileCommandsJson[i];
					let commandFile = vscode.Uri.file(parseFileFromCommand(currentParameter.command));
					if (commandFile.fsPath === fileUri.fsPath) {
						includes = includes.concat(parseIncludesFromCommand(currentParameter.command));
						/* If there are multiple targets in a compile_commands.json, they still hopefully have the same includes. */
						break;
					}
				}
			}
		}
		for (let exclude of configCache.excludedIncludes) {
			let includeIndex = -1;
			do {
				exclude = FileSystemHandler.resolveWorkspaceFolder(exclude);
				includeIndex = includes.findIndex((include) => {
					const normalizedExclude = vscode.Uri.file(exclude).fsPath;
					const normalizedInclude = vscode.Uri.file(include).fsPath;
					const pathIncluded = normalizedInclude.includes(normalizedExclude);
					return pathIncluded;
				});
				if (includeIndex !== -1) { includes.splice(includeIndex, 1); }
			} while (includeIndex !== -1);
		}

		return resolve(includes);
	});
}

function onEditorChange() {
	const allowedLanguages: string[] = ['c', 'cpp'];
	if (configCache.extensionMode !== ExtensionMode.MANUAL) {
		if (!vscode.window.activeTextEditor) { return; }
		if (!vscode.window.activeTextEditor.document) { return; }
		if (!allowedLanguages.includes(vscode.window.activeTextEditor.document.languageId)) { return; }
		vscode.commands.executeCommand(Commands.SHOW, vscode.window.activeTextEditor.document.uri);
	}
}

async function onStartup() {
	await scanCompileCommands();
	await vscode.commands.executeCommand(Commands.SCAN);
	await vscode.commands.executeCommand(Commands.BUILD_CACHE);
	onEditorChange();
}

async function buildIncludeTree(fileUri: vscode.Uri): Promise<IncludeTree | undefined> {
	const compiler = configCache.compiler;
	const cwd = vscode.workspace.getWorkspaceFolder(fileUri);
	if (!cwd) { return undefined; }
	const includesOfFile = await getIncludesOfFile(fileUri, configCache.extensionMode);
	const includeTree = await compiler.buildTree(cwd.uri.fsPath, fileUri, includesOfFile);

	return includeTree;
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
		let includeTree = includeTreeGlobals.fileCache.get(fileUri.fsPath);
		if (!includeTree) {
			includeTree = await buildIncludeTree(fileUri);
		}
		includeTreeDataProvider.setIncludeTree(includeTree);
	});
	vscode.commands.registerCommand(Commands.OPEN, (filePath: vscode.Uri) => {
		vscode.commands.executeCommand('vscode.open', filePath);
	});
	vscode.commands.registerCommand(Commands.SCAN, async () => {
		if (configCache.scanWorkspaceForIncludes) {
			includeTreeGlobals.workspaceIncludes = await scanWorkspace();
		}
	});
	vscode.commands.registerCommand(Commands.BUILD_CACHE, async () => {
		includeTreeGlobals.fileCache = new Map();
		for (let directory of configCache.cachedDirectories) {
			const directoryUri = vscode.Uri.file(directory);
			let files = (await vscode.workspace.fs.readDirectory(directoryUri)).filter((file) => {
				return file[1] === vscode.FileType.File;
			});
			for (let file of files) {
				const fileUri = vscode.Uri.joinPath(directoryUri, file[0]);
				const includeTree = await buildIncludeTree(fileUri);
				includeTreeGlobals.fileCache.set(fileUri.fsPath, includeTree);
			}
		}
	});

	vscode.window.onDidChangeActiveTextEditor(onEditorChange);
	vscode.workspace.onDidSaveTextDocument(onEditorChange);

	/* Trigger extension on startup */
	onStartup();
}

// This method is called when your extension is deactivated
export function deactivate() { }
