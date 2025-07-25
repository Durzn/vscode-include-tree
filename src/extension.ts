import * as vscode from 'vscode';
import { configCache } from './ConfigCache';
import IncludeTreeDataProvider from './TreeView/IncludeTreeDataProvider';
import { Commands, Constants, Contexts, Settings } from './Constants';
import { ExtensionMode } from './ConfigAccess';
import { CacheStatus, includeTreeGlobals, TreeMode } from './Globals';
import { FileSystemHandler, normalizePath } from './Util/FileSystemHandler';
import IncludeTree from './IncludeTree';
import IncludeTreeItem from './TreeView/IncludeTreeItem';
import Include from './Include';

const VALID_HEADER_EXTENSIONS: string[] = ['.h', '.hpp', '.hxx', '.hh'];
const VALID_SOURCE_EXTENSIONS: string[] = ['.c', '.cpp', '.cxx', '.cc'];


function setPinState(pinned: boolean) {
	vscode.commands.executeCommand('setContext', Contexts.PINNED, pinned);
	includeTreeGlobals.isFilePinned = pinned;
}

function setTreeMode(includeTreeView: vscode.TreeView<IncludeTreeItem>, mode: TreeMode, show: boolean = true) {
	vscode.commands.executeCommand('setContext', Contexts.TREE_MODE, mode);
	includeTreeGlobals.treeMode = mode;
	updateTreeViewTitle(includeTreeView);
	if (show) {
		vscode.commands.executeCommand(Commands.SHOW);
	}
}

async function scanWorkspace() {
	let workspaceFolders = vscode.workspace.workspaceFolders;
	let foldersInWorkspaces: string[] = [];
	if (!workspaceFolders) { return foldersInWorkspaces; };

	for (let workspace of workspaceFolders) {
		for await (const file of FileSystemHandler.getFolders(workspace.uri, VALID_HEADER_EXTENSIONS.concat(VALID_SOURCE_EXTENSIONS))) {
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
		if (!includeTreeGlobals.isFilePinned) {
			vscode.commands.executeCommand(Commands.SHOW, vscode.window.activeTextEditor.document.uri);
		}
	}
}

async function onStartup(includeTreeView: vscode.TreeView<IncludeTreeItem>) {
	setTreeMode(includeTreeView, TreeMode.WHOAMIINCLUDING, false);
	setPinState(false);

	await scanCompileCommands();
	await vscode.commands.executeCommand(Commands.SCAN);
	await vscode.commands.executeCommand(Commands.BUILD_CACHE);

	onEditorChange();
}

function getWhoIsIncludingMe(fileUri: vscode.Uri): IncludeTree {
	let includingFiles = new Map<string, Include>();

	for (const [rootFileUri, includeTree] of includeTreeGlobals.includeTrees) {
		// Find all files in this tree that directly include our target file
		const directIncluders = findDirectIncluders(includeTree, fileUri.fsPath);

		for (const includer of directIncluders) {
			// Use normalized path as the key to prevent duplicates
			const normalizedKey = normalizePath(includer.fsPath);
			if (!includingFiles.has(normalizedKey)) {
				includingFiles.set(normalizedKey, new Include(includer));
			}
		}
	}
	const rootNode = new Include(fileUri, [...includingFiles.values()]);
	return new IncludeTree([rootNode]);
}

// Helper function to find all files that directly include the target file
function findDirectIncluders(includeTree: IncludeTree, targetFilePath: string): vscode.Uri[] {
	const includers: vscode.Uri[] = [];
	const normalizedTarget = normalizePath(targetFilePath);

	function searchIncludes(includes: Include[]) {
		for (const include of includes) {
			// Check if this include directly includes our target file
			const directlyIncludesTarget = include.includes.some(child =>
				normalizePath(child.fileUri.fsPath) === normalizedTarget
			);

			if (directlyIncludesTarget) {
				includers.push(include.fileUri);
			}

			// Recursively search in nested includes
			if (include.includes.length > 0) {
				searchIncludes(include.includes);
			}
		}
	}

	searchIncludes(includeTree.includes);
	return includers;
}

async function buildIncludeTreeIncluding(fileUri: vscode.Uri): Promise<IncludeTree | undefined> {
	const compiler = configCache.compiler;
	const cwd = vscode.workspace.getWorkspaceFolder(fileUri);
	if (!cwd) { return undefined; }
	const includesOfFile = await getIncludesOfFile(fileUri, configCache.extensionMode);
	return await compiler.buildTree(cwd.uri.fsPath, fileUri, includesOfFile);
}

async function buildIncludeTreeIncluders(fileUri: vscode.Uri): Promise<IncludeTree | undefined> {
	let includeTree = undefined;
	let includingFiles = new Map<string, Include>();

	for (const [rootFileUri, includeTree] of includeTreeGlobals.includeTrees) {
		// Find all files in this tree that directly include our target file
		const directIncluders = findDirectIncluders(includeTree, fileUri.fsPath);

		for (const includer of directIncluders) {
			// Use normalized path as the key to prevent duplicates
			const normalizedKey = normalizePath(includer.fsPath);
			if (!includingFiles.has(normalizedKey)) {
				includingFiles.set(normalizedKey, new Include(includer));
			}
		}
	}
	const rootNode = new Include(fileUri, [...includingFiles.values()]);
	if (rootNode.includes.length > 0) {
		includeTree = new IncludeTree([rootNode]);
	}
	return includeTree;
}

async function buildIncludeTree(fileUri: vscode.Uri, mode: TreeMode) {
	if (mode === TreeMode.WHOAMIINCLUDING) {
		return buildIncludeTreeIncluding(fileUri);
	}
	return buildIncludeTreeIncluders(fileUri);
}


function updateTreeViewTitle(includeTreeView: vscode.TreeView<IncludeTreeItem>) {
	const modeText = includeTreeGlobals.treeMode === TreeMode.WHOAMIINCLUDING
		? "Including View"
		: "Includers View";
	includeTreeView.title = `Include Tree - ${modeText}`;
}

/**
 * Create a composite key so IncludeTrees for all views can be stored
 * @param filePath 
 * @param mode 
 * @returns 
 */
function getIncludeTreeCacheKey(filePath: string, mode: TreeMode): string {
	return `${filePath}::${mode}`;
}

function getCachedTree(fileUri: vscode.Uri, mode: TreeMode): IncludeTree | undefined {
	const key = getIncludeTreeCacheKey(fileUri.fsPath, mode);
	return includeTreeGlobals.includeTrees.get(key);
}

export function activate(context: vscode.ExtensionContext) {

	includeTreeGlobals.outputChannel = vscode.window.createOutputChannel(`${Constants.EXTENSION_NAME}`);
	const includeTreeDataProvider = new IncludeTreeDataProvider();
	const includeTreeView = vscode.window.createTreeView(Constants.EXTENSION_NAME + '.includeTree', { treeDataProvider: includeTreeDataProvider });
	includeTreeView.onDidExpandElement(e => {
		includeTreeDataProvider.setExpansionState(e.element.include.id, true);
	});
	includeTreeView.onDidCollapseElement(e => {
		includeTreeDataProvider.setExpansionState(e.element.include.id, false);
	});

	vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
		if (event.affectsConfiguration(Constants.EXTENSION_NAME)) {
			onConfigChange(event);
		}
	});
	vscode.commands.registerCommand(Commands.SHOW, async (fileUri: vscode.Uri) => {
		if (!fileUri) {
			if (vscode.window.activeTextEditor) {
				if (vscode.window.activeTextEditor.document.uri.scheme === "file") {
					fileUri = vscode.window.activeTextEditor.document.uri;
				}
			}
		}
		if (!fileUri) {
			return;
		}
		const mode = includeTreeGlobals.treeMode;
		let includeTree = getCachedTree(fileUri, mode);
		if (!includeTree) {
			includeTree = await buildIncludeTree(fileUri, mode);
		}
		includeTreeDataProvider.setIncludeTree(includeTree);
	});
	vscode.commands.registerCommand(Commands.OPEN, (filePath: vscode.Uri) => {
		if (configCache.openFilesOnClick) {
			vscode.commands.executeCommand('vscode.open', filePath);
		}
	});
	vscode.commands.registerCommand(Commands.SCAN, async () => {
		if (configCache.scanWorkspaceForIncludes) {
			includeTreeGlobals.workspaceIncludes = await scanWorkspace();
		}
	});
	vscode.commands.registerCommand(Commands.BUILD_CACHE, async () => {
		includeTreeGlobals.cacheStatus = CacheStatus.BUILDING;
		const newCache = new Map<string, IncludeTree>();

		try {
			includeTreeGlobals.includeTrees.clear();

			// Get all resolved files from cached directories (including glob patterns)
			const resolvedFiles = await configCache.configAccess.getResolvedCachedFiles(
				VALID_HEADER_EXTENSIONS.concat(VALID_SOURCE_EXTENSIONS)
			);

			// Process each resolved file
			for (const fileUri of resolvedFiles) {
				try {
					let includeTree = undefined;
					if (includeTreeGlobals.treeMode === TreeMode.WHOISINCLUDINGME) {
						includeTree = await buildIncludeTreeIncluders(fileUri);
					}
					else {
						includeTree = await buildIncludeTreeIncluding(fileUri);
					}
					if (includeTree) {
						const includeKey = getIncludeTreeCacheKey(fileUri.fsPath, includeTreeGlobals.treeMode);
						newCache.set(includeKey, includeTree);
					}
				} catch (error) {
					console.error(`Error processing file ${fileUri.fsPath}:`, error);
					// Continue processing other files even if one fails
				}
			}

			console.log(`Cache built successfully with ${resolvedFiles.length} files processed.`);

		} catch (error) {
			console.error('Error building cache:', error);
			vscode.window.showErrorMessage(`Failed to build include tree cache: ${error}`);
		}
		includeTreeGlobals.includeTrees = newCache;
		includeTreeGlobals.cacheStatus = CacheStatus.BUILT;
	});
	vscode.commands.registerCommand(Commands.COLLAPSE_TREE, async () => {
		includeTreeDataProvider.clearExpansionState();
		includeTreeDataProvider.refresh();
		vscode.commands.executeCommand('workbench.actions.treeView.include-tree.includeTree.collapseAll');
	});
	vscode.commands.registerCommand(Commands.EXPAND_TREE_1, async () => {
		await expandTree(includeTreeView, includeTreeDataProvider, 1);
	});
	vscode.commands.registerCommand(Commands.PIN, () => {
		setPinState(true);
	});
	vscode.commands.registerCommand(Commands.UNPIN, () => {
		setPinState(false);
	});
	vscode.commands.registerCommand(Commands.CHANGE_TO_WHO_AM_I_INCLUDING, () => {
		setTreeMode(includeTreeView, TreeMode.WHOAMIINCLUDING);
	});
	vscode.commands.registerCommand(Commands.CHANGE_TO_WHO_IS_INCLUDING_ME, () => {
		setTreeMode(includeTreeView, TreeMode.WHOISINCLUDINGME);
	});


	vscode.window.onDidChangeActiveTextEditor(onEditorChange);
	vscode.workspace.onDidSaveTextDocument(onEditorChange);

	/* Trigger extension on startup */
	onStartup(includeTreeView);
}

async function expandTree(includeTreeView: vscode.TreeView<IncludeTreeItem>, includeTreeDataProvider: IncludeTreeDataProvider, expand: boolean | number) {
	const expandableElements = includeTreeDataProvider.getExpandableElements();
	for (const element of expandableElements) {
		await includeTreeView.reveal(element, { select: false, expand: expand, focus: false });
	}
}

setInterval(() => {
	vscode.commands.executeCommand(Commands.SCAN);
}, 5 * 60 * 1000 /* Scan once every 5 minutes */);

/**
 * Periodically re-build the cache
 * While this does not give instant feedback for changes, the overall experience with the extension should be better.
 * FileWatchers on a potentially large amount of files can cause the system to run out of handles.
 * FileWatchers are not guaranteed to throw an event on change, the OS may throw this even away.
 * Includes of files should not change that often so it seems to be a worthy tradeoff.
 */
setInterval(() => {
	vscode.commands.executeCommand(Commands.BUILD_CACHE);
}, 2 * 60 * 1000 /* Scan once every 2 minutes */);

// This method is called when your extension is deactivated
export function deactivate() { }
