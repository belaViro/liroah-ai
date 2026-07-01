import { existsSync } from "node:fs";
import { delimiter, win32 } from "node:path";
import { spawn, spawnSync } from "child_process";
import { APP_NAME, getBinDir } from "../config.ts";

export interface ShellConfig {
	shell: string;
	args: string[];
	commandTransport?: "argv" | "stdin";
}

const GIT_BASH_PATH_ENV = `${APP_NAME.toUpperCase()}_GIT_BASH_PATH`;

function normalizeWin32Path(path: string): string {
	return win32.normalize(path.replace(/\//g, "\\")).toLowerCase();
}

function addUniquePath(paths: string[], path: string): void {
	const normalizedPath = normalizeWin32Path(path);
	if (!paths.some((candidate) => normalizeWin32Path(candidate) === normalizedPath)) {
		paths.push(win32.normalize(path));
	}
}

function isLegacyWslBashPath(path: string): boolean {
	const normalized = normalizeWin32Path(path);
	return /^[a-z]:\\windows\\(?:system32|sysnative)\\bash\.exe$/.test(normalized);
}

function isWindowsAppsBashPath(path: string): boolean {
	return normalizeWin32Path(path).endsWith("\\appdata\\local\\microsoft\\windowsapps\\bash.exe");
}

export function isIgnoredWindowsPathBash(path: string): boolean {
	return isLegacyWslBashPath(path) || isWindowsAppsBashPath(path);
}

function getBashShellConfig(shell: string): ShellConfig {
	return isLegacyWslBashPath(shell) ? { shell, args: ["-s"], commandTransport: "stdin" } : { shell, args: ["-c"] };
}

function isPathInCurrentWorkingDirectory(path: string): boolean {
	const cwd = normalizeWin32Path(process.cwd());
	const normalizedPath = normalizeWin32Path(path);
	const pathDir = normalizeWin32Path(win32.dirname(normalizedPath));
	return pathDir === cwd || normalizedPath.startsWith(`${cwd}\\`);
}

function findExecutablesOnPath(executable: string): string[] {
	const paths: string[] = [];
	try {
		const result = spawnSync("where.exe", [executable], {
			encoding: "utf-8",
			timeout: 5000,
			windowsHide: true,
		});
		if (result.status === 0 && result.stdout) {
			for (const candidate of result.stdout.trim().split(/\r?\n/)) {
				if (candidate && existsSync(candidate) && !isPathInCurrentWorkingDirectory(candidate)) {
					addUniquePath(paths, candidate);
				}
			}
		}
	} catch {
		// Ignore errors
	}
	return paths;
}

export function getGitBashCandidatesFromGitPath(gitPath: string): string[] {
	const gitDir = win32.dirname(gitPath);
	const normalizedGitDir = normalizeWin32Path(gitDir);
	const candidates: string[] = [];
	if (normalizedGitDir.endsWith("\\git\\cmd")) {
		addUniquePath(candidates, win32.join(gitDir, "..", "bin", "bash.exe"));
	}
	if (normalizedGitDir.endsWith("\\git\\mingw64\\bin") || normalizedGitDir.endsWith("\\git\\usr\\bin")) {
		addUniquePath(candidates, win32.join(gitDir, "..", "..", "bin", "bash.exe"));
	}
	addUniquePath(candidates, win32.join(gitDir, "..", "bin", "bash.exe"));
	addUniquePath(candidates, win32.join(gitDir, "..", "..", "bin", "bash.exe"));
	addUniquePath(candidates, win32.join(gitDir, "bash.exe"));
	return candidates;
}

function findGitExecutables(): string[] {
	const paths: string[] = [];
	const programFiles = process.env.ProgramFiles;
	if (programFiles) {
		addUniquePath(paths, win32.join(programFiles, "Git", "cmd", "git.exe"));
	}
	const programFilesX86 = process.env["ProgramFiles(x86)"];
	if (programFilesX86) {
		addUniquePath(paths, win32.join(programFilesX86, "Git", "cmd", "git.exe"));
	}

	for (const executable of ["git.exe", "git"]) {
		for (const candidate of findExecutablesOnPath(executable)) {
			addUniquePath(paths, candidate);
		}
	}

	return paths.filter((path) => existsSync(path));
}

function getConfiguredGitBashPath(): string | undefined {
	const configuredPath = process.env[GIT_BASH_PATH_ENV]?.trim();
	if (!configuredPath) {
		return undefined;
	}
	if (existsSync(configuredPath)) {
		return configuredPath;
	}
	throw new Error(`${GIT_BASH_PATH_ENV} points to missing Git Bash path: ${configuredPath}`);
}

function findGitBash(): { shellPath: string | null; searchedPaths: string[] } {
	const configuredPath = getConfiguredGitBashPath();
	if (configuredPath) {
		return { shellPath: configuredPath, searchedPaths: [configuredPath] };
	}

	const searchedPaths: string[] = [];
	for (const gitPath of findGitExecutables()) {
		for (const candidate of getGitBashCandidatesFromGitPath(gitPath)) {
			addUniquePath(searchedPaths, candidate);
		}
	}

	const programFiles = process.env.ProgramFiles;
	if (programFiles) {
		addUniquePath(searchedPaths, win32.join(programFiles, "Git", "bin", "bash.exe"));
	}
	const programFilesX86 = process.env["ProgramFiles(x86)"];
	if (programFilesX86) {
		addUniquePath(searchedPaths, win32.join(programFilesX86, "Git", "bin", "bash.exe"));
	}

	for (const candidate of searchedPaths) {
		if (existsSync(candidate)) {
			return { shellPath: candidate, searchedPaths };
		}
	}

	return { shellPath: null, searchedPaths };
}

/**
 * Find bash executable on PATH (cross-platform)
 */
function findBashOnPath(): string | null {
	if (process.platform === "win32") {
		for (const candidate of findExecutablesOnPath("bash.exe")) {
			if (!isIgnoredWindowsPathBash(candidate)) {
				return candidate;
			}
		}
		return null;
	}

	// Unix: Use 'which' and trust its output (handles Termux and special filesystems)
	try {
		const result = spawnSync("which", ["bash"], { encoding: "utf-8", timeout: 5000 });
		if (result.status === 0 && result.stdout) {
			const firstMatch = result.stdout.trim().split(/\r?\n/)[0];
			if (firstMatch) {
				return firstMatch;
			}
		}
	} catch {
		// Ignore errors
	}
	return null;
}
/**
 * Resolve shell configuration based on platform and an optional explicit shell path.
 * Resolution order:
 * 1. User-specified shellPath
 * 2. On Windows: Git Bash in known locations, then bash on PATH
 * 3. On Unix: /bin/bash, then bash on PATH, then fallback to sh
 */
export function getShellConfig(customShellPath?: string): ShellConfig {
	// 1. Check user-specified shell path
	if (customShellPath) {
		if (existsSync(customShellPath)) {
			return getBashShellConfig(customShellPath);
		}
		throw new Error(`Custom shell path not found: ${customShellPath}`);
	}

	if (process.platform === "win32") {
		// 2. Try Git Bash via git.exe, including non-default Git installation paths.
		const gitBash = findGitBash();
		if (gitBash.shellPath) {
			return getBashShellConfig(gitBash.shellPath);
		}

		// 3. Fallback: search bash.exe on PATH, skipping Windows WSL stubs.
		const bashOnPath = findBashOnPath();
		if (bashOnPath) {
			return getBashShellConfig(bashOnPath);
		}

		throw new Error(
			`No bash shell found. Options:\n` +
				`  1. Install Git for Windows: https://git-scm.com/download/win\n` +
				`  2. Set ${GIT_BASH_PATH_ENV} to your Git Bash path\n` +
				`  3. Add Git Bash, Cygwin, or MSYS2 bash to PATH\n\n` +
				`Searched Git Bash in:\n${gitBash.searchedPaths.map((path) => `  ${path}`).join("\n")}`,
		);
	}

	// Unix: try /bin/bash, then bash on PATH, then fallback to sh
	if (existsSync("/bin/bash")) {
		return getBashShellConfig("/bin/bash");
	}

	const bashOnPath = findBashOnPath();
	if (bashOnPath) {
		return getBashShellConfig(bashOnPath);
	}

	return { shell: "sh", args: ["-c"] };
}

export function getShellEnv(): NodeJS.ProcessEnv {
	const binDir = getBinDir();
	const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
	const currentPath = process.env[pathKey] ?? "";
	const pathEntries = currentPath.split(delimiter).filter(Boolean);
	const hasBinDir = pathEntries.includes(binDir);
	const updatedPath = hasBinDir ? currentPath : [binDir, currentPath].filter(Boolean).join(delimiter);

	return {
		...process.env,
		[pathKey]: updatedPath,
	};
}

/**
 * Sanitize binary output for display/storage.
 * Removes characters that crash string-width or cause display issues:
 * - Control characters (except tab, newline, carriage return)
 * - Lone surrogates
 * - Unicode Format characters (crash string-width due to a bug)
 * - Characters with undefined code points
 */
export function sanitizeBinaryOutput(str: string): string {
	// Use Array.from to properly iterate over code points (not code units)
	// This handles surrogate pairs correctly and catches edge cases where
	// codePointAt() might return undefined
	return Array.from(str)
		.filter((char) => {
			// Filter out characters that cause string-width to crash
			// This includes:
			// - Unicode format characters
			// - Lone surrogates (already filtered by Array.from)
			// - Control chars except \t \n \r
			// - Characters with undefined code points

			const code = char.codePointAt(0);

			// Skip if code point is undefined (edge case with invalid strings)
			if (code === undefined) return false;

			// Allow tab, newline, carriage return
			if (code === 0x09 || code === 0x0a || code === 0x0d) return true;

			// Filter out control characters (0x00-0x1F, except 0x09, 0x0a, 0x0x0d)
			if (code <= 0x1f) return false;

			// Filter out Unicode format characters
			if (code >= 0xfff9 && code <= 0xfffb) return false;

			return true;
		})
		.join("");
}

/**
 * Detached child processes must be tracked so they can be killed on parent
 * shutdown signals (SIGHUP/SIGTERM).
 */
const trackedDetachedChildPids = new Set<number>();

export function trackDetachedChildPid(pid: number): void {
	trackedDetachedChildPids.add(pid);
}

export function untrackDetachedChildPid(pid: number): void {
	trackedDetachedChildPids.delete(pid);
}

export function killTrackedDetachedChildren(): void {
	for (const pid of trackedDetachedChildPids) {
		killProcessTree(pid);
	}
	trackedDetachedChildPids.clear();
}

/**
 * Kill a process and all its children (cross-platform)
 */
export function killProcessTree(pid: number): void {
	if (process.platform === "win32") {
		// Use taskkill on Windows to kill process tree
		try {
			spawn("taskkill", ["/F", "/T", "/PID", String(pid)], {
				stdio: "ignore",
				detached: true,
				windowsHide: true,
			});
		} catch {
			// Ignore errors if taskkill fails
		}
	} else {
		// Use SIGKILL on Unix/Linux/Mac
		try {
			process.kill(-pid, "SIGKILL");
		} catch {
			// Fallback to killing just the child if process group kill fails
			try {
				process.kill(pid, "SIGKILL");
			} catch {
				// Process already dead
			}
		}
	}
}
