export enum Constants {
    EXTENSION_NAME = 'include-tree'
}

export enum Commands {
    SHOW = Constants.EXTENSION_NAME + '.show',
    SCAN = Constants.EXTENSION_NAME + '.scanWorkspace',
    BUILD_CACHE = Constants.EXTENSION_NAME + '.createCache',
    OPEN = Constants.EXTENSION_NAME + '.open'
}

export enum Settings {
    SCAN_WORKSPACE = Constants.EXTENSION_NAME + '.scanWorkspaceForIncludes',
    EXTENSION_MODE = Constants.EXTENSION_NAME + '.extensionMode',
    COMPILE_COMMANDS_PATH = Constants.EXTENSION_NAME + '.compileCommandsPath',
    BUILD_CACHE = Constants.EXTENSION_NAME + '.cachedDirectories'
}