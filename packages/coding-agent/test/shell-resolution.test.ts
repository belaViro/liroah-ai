import { describe, expect, it } from "vitest";
import { getGitBashCandidatesFromGitPath, isIgnoredWindowsPathBash } from "../src/utils/shell.ts";

describe("shell resolution", () => {
	it("derives Git Bash candidates from Git for Windows executables", () => {
		expect(getGitBashCandidatesFromGitPath("D:\\Tools\\Git\\cmd\\git.exe")[0]).toBe("D:\\Tools\\Git\\bin\\bash.exe");
		expect(getGitBashCandidatesFromGitPath("D:\\Tools\\Git\\mingw64\\bin\\git.exe")[0]).toBe(
			"D:\\Tools\\Git\\bin\\bash.exe",
		);
		expect(getGitBashCandidatesFromGitPath("D:\\Tools\\Git\\usr\\bin\\git.exe")[0]).toBe(
			"D:\\Tools\\Git\\bin\\bash.exe",
		);
	});

	it("ignores Windows bash stubs during PATH fallback", () => {
		expect(isIgnoredWindowsPathBash("C:\\Windows\\System32\\bash.exe")).toBe(true);
		expect(isIgnoredWindowsPathBash("C:\\Windows\\Sysnative\\bash.exe")).toBe(true);
		expect(isIgnoredWindowsPathBash("C:\\Users\\test\\AppData\\Local\\Microsoft\\WindowsApps\\bash.exe")).toBe(true);
		expect(isIgnoredWindowsPathBash("D:\\Tools\\Git\\bin\\bash.exe")).toBe(false);
	});
});
