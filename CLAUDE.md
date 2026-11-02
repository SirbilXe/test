# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is a near-empty scaffold repository (single `INIT` commit containing only `init.txt`, `.gitignore`, `.gitattributes`). There is no application code, build system, linter, or test suite yet — update this file once a stack is chosen.

## Git conventions

- Branches: work happens on `develop`; `master` is the other local branch.
- The remote is named `GitHub_>_SirbilXe` (not `origin`), pointing to `https://github.com/SirbilXe/test.git`. Quote the remote name in shell commands, e.g. `git push "GitHub_>_SirbilXe" develop`, since `>` is a redirection character.
- Git LFS is configured for `*.zip` and `*.mp4` (see `.gitattributes`); Git LFS must be installed for these files to check out correctly.
- `.idea/` (JetBrains IDE settings) is ignored.
