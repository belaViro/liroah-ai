# Windows Setup

Pi requires a bash shell on Windows. Checked locations (in order):

1. Custom path from `~/.pi/agent/settings.json`
2. Git Bash from `LIROAH_GIT_BASH_PATH`
3. Git Bash derived from `git.exe`, including non-default Git for Windows installation directories
4. Git Bash (`C:\Program Files\Git\bin\bash.exe`)
5. `bash.exe` on PATH (Cygwin, MSYS2); Windows WSL bash stubs are skipped

For most users, [Git for Windows](https://git-scm.com/download/win) is sufficient.

## Custom Shell Path

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

If Git for Windows is installed in a location that cannot be inferred from `git.exe`, set `LIROAH_GIT_BASH_PATH` to its `bash.exe` path.
