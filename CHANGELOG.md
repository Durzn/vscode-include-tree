# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-06-04

- Added buttons for collapsing and expanding trees
- Added setting to disable jumping to files when clicking on them

## [1.3.2] - 2025-05-09

- Fixed issue with command "Show include tree" throwing an exception
- New behavior: Active document is used for include tree

## [1.3.1] - 2025-05-07

- Invalidating cache after changing settings
- Commandline should now be able to handle longer input strings for compiler calls
- Excluding folders is now recursive
- Added a periodic scan of the workspace if enabled in the settings (currently fixed at once every 5 minutes)

## [1.3.0] - 2025-05-06

- Added possibility to cache files in directory list
- When using compile_commands.json, only the first entry of a file will be used, even if it occurs in multiple targets

## [1.2.2] - 2025-05-02

- Updated README about the recent changes in the extension

## [1.2.1] - 2025-05-01

- Tweaked behavior with automatic mode and compile_commands.json
- Now using vscode.fs instead of normal fs module

## [1.2.0] - 2025-05-01

- Added support for compile_commands.json files

## [1.1.4] - 2025-05-01

- Made paths in workspace relative

## [1.1.3] - 2025-04-29

- Removed usage of -fmax-include-depth flag for gcc

## [1.1.2] - 2025-04-29

- Only use directories that have header files for additional include paths when scanning the workspace

## [1.1.1] - 2025-04-28

- Added an icon the the Include Tree view to scan workspace files

## [1.1.0] - 2025-04-28

- Added option to scan workspace folders for include paths
- Added additional include path settings
- Added scan command to detect changes in folders

## [1.0.0] - 2025-04-25

### Added

- Added support for gcc, g++, clang and clang++