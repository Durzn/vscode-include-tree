import * as vscode from 'vscode';
import * as path from 'path';
import { FileSystemHandler, normalizePath } from './Util/FileSystemHandler';

export enum ExtensionMode {
    MANUAL = "manual",
    AUTOMATIC = "automatic"
}

export default class ConfigAccess {
    constructor() { }

    private getConfiguration() {
        return vscode.workspace.getConfiguration("include-tree", null);
    }

    public getCompilerPath(): string {
        return this.getConfiguration().get("compilerPath", "");
    }

    public getExtensionMode(): ExtensionMode {
        const config = this.getConfiguration();
        let extensionMode: string = config.get("extensionMode", ExtensionMode.AUTOMATIC);
        return <ExtensionMode>extensionMode;
    }

    public getMaxIncludeDepth(): number {
        return this.getConfiguration().get("includeDepth", 20);
    }

    public getScanWorkspaceForIncludes(): boolean {
        return this.getConfiguration().get("scanWorkspaceForIncludes", true);
    }

    public getAdditionalIncludes(): string[] {
        let paths = this.getConfiguration().get("additionalIncludes", []);

        return paths.map((path: string) => {
            return FileSystemHandler.resolveWorkspaceFolder(path);
        });
    }

    public getExcludedIncludes(): string[] {
        let paths = this.getConfiguration().get("excludedIncludes", []);

        return paths.map((path: string) => {
            return FileSystemHandler.resolveWorkspaceFolder(path);
        });
    }

    public getCompileCommandsPath(): string {
        let path = this.getConfiguration().get("compileCommandsPath", "");
        return FileSystemHandler.resolveWorkspaceFolder(path);
    }

    public getCachedDirectories(): string[] {
        let paths = this.getConfiguration().get("cachedDirectories", []);

        return paths.map((path: string) => {
            return FileSystemHandler.resolveWorkspaceFolder(path);
        });
    }

    /**
     * Get cached directories with glob pattern resolution
     * Returns an array of resolved file URIs that match the configured patterns
     */
    public async getResolvedCachedFiles(validExtensions: string[] = []): Promise<vscode.Uri[]> {
        const cachedDirectories = this.getCachedDirectories();
        const resolvedFiles: vscode.Uri[] = [];

        for (const directory of cachedDirectories) {
            const files = await this.resolveDirectoryOrGlob(directory, validExtensions);
            resolvedFiles.push(...files);
        }

        // Remove duplicates using normalized paths
        const uniqueFiles = new Map<string, vscode.Uri>();
        for (const file of resolvedFiles) {
            const normalizedKey = normalizePath(file.fsPath);
            if (!uniqueFiles.has(normalizedKey)) {
                uniqueFiles.set(normalizedKey, file);
            }
        }

        return Array.from(uniqueFiles.values());
    }

    /**
     * Resolve a directory path or glob pattern to actual file URIs
     */
    private async resolveDirectoryOrGlob(directoryOrPattern: string, validExtensions: string[]): Promise<vscode.Uri[]> {
        // Check if it's a glob pattern
        if (this.isGlobPattern(directoryOrPattern)) {
            return await this.resolveGlobPattern(directoryOrPattern, validExtensions);
        } else {
            return await this.resolveDirectory(directoryOrPattern, validExtensions);
        }
    }

    /**
     * Check if a string contains glob pattern characters (* or **)
     */
    private isGlobPattern(pattern: string): boolean {
        return pattern.includes('*');
    }

    /**
     * Resolve a glob pattern to file URIs
     */
    private async resolveGlobPattern(globPattern: string, validExtensions: string[]): Promise<vscode.Uri[]> {
        try {
            const normalizedPattern = globPattern.replace(/\\/g, '/');
            let searchPattern: vscode.GlobPattern | undefined = undefined;

            // If the pattern starts with an absolute path, convert to relative pattern
            if (path.isAbsolute(normalizedPattern)) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                    for (const wsFolder of workspaceFolders) {
                        const wsPath = wsFolder.uri.fsPath.replace(/\\/g, '/');
                        if (normalizedPattern.startsWith(wsPath)) {
                            const relativePattern = normalizedPattern.substring(wsPath.length).replace(/^\/+/, '');
                            searchPattern = new vscode.RelativePattern(wsFolder, relativePattern);
                            break;
                        }
                    }
                }
            }

            // Fallback: treat as relative pattern from first workspace folder
            if (!searchPattern && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                searchPattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], normalizedPattern);
            }

            if (!searchPattern) {
                console.warn(`Could not resolve glob pattern: ${globPattern} - no workspace folders available`);
                return [];
            }

            // Find all matching files
            const matchingFiles = await vscode.workspace.findFiles(searchPattern);

            // Filter for valid extensions if specified
            if (validExtensions.length > 0) {
                return matchingFiles.filter(file =>
                    this.hasValidExtension(file.fsPath, validExtensions)
                );
            }

            return matchingFiles;

        } catch (error) {
            console.error(`Error resolving glob pattern ${globPattern}:`, error);
            return [];
        }
    }

    /**
     * Resolve a regular directory to file URIs
     */
    private async resolveDirectory(directory: string, validExtensions: string[]): Promise<vscode.Uri[]> {
        try {
            const directoryUri = vscode.Uri.file(directory);
            const files = (await vscode.workspace.fs.readDirectory(directoryUri))
                .filter(([name, type]) => type === vscode.FileType.File)
                .map(([name]) => vscode.Uri.joinPath(directoryUri, name));

            // Filter for valid extensions if specified
            if (validExtensions.length > 0) {
                return files.filter(file =>
                    this.hasValidExtension(file.fsPath, validExtensions)
                );
            }

            return files;

        } catch (error) {
            console.error(`Error resolving directory ${directory}:`, error);
            return [];
        }
    }

    /**
     * Check if a file has a valid extension
     */
    private hasValidExtension(filePath: string, validExtensions: string[]): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return validExtensions.includes(ext);
    }

    public getOpenFilesOnClick(): boolean {
        return this.getConfiguration().get("openFilesOnClick", true);
    }
}

export { ConfigAccess };