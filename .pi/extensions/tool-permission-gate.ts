import {
	type ExtensionAPI,
	type ExtensionContext,
	type ToolCallEvent,
	isToolCallEventType,
} from "@earendil-works/pi-coding-agent";

type PermissionDecision = "allow_once" | "allow_session" | "deny";

const allowOnceLabel = "Allow once";
const allowSessionLabel = "Allow for session";
const denyLabel = "Deny";

const sessionAllowed = new Set<string>();

function formatPreview(value: string, maxLength = 1200): string {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength)}\n... (${value.length - maxLength} more chars)`;
}

function getPermissionKey(event: ToolCallEvent): string | undefined {
	if (isToolCallEventType("bash", event)) {
		return `bash:${event.input.command}`;
	}
	if (isToolCallEventType("edit", event)) {
		return `edit:${event.input.path}`;
	}
	if (isToolCallEventType("write", event)) {
		return `write:${event.input.path}`;
	}
	return undefined;
}

function getPermissionPrompt(event: ToolCallEvent): string | undefined {
	if (isToolCallEventType("bash", event)) {
		const timeout = event.input.timeout ? `\nTimeout: ${event.input.timeout}s` : "";
		return `Allow bash command?\n\n${formatPreview(event.input.command)}${timeout}`;
	}
	if (isToolCallEventType("edit", event)) {
		return `Allow file edit?\n\nPath: ${event.input.path}\nEdits: ${event.input.edits.length}`;
	}
	if (isToolCallEventType("write", event)) {
		return `Allow file write?\n\nPath: ${event.input.path}\nBytes: ${event.input.content.length}`;
	}
	return undefined;
}

function mapChoice(choice: string | undefined): PermissionDecision {
	if (choice === allowOnceLabel) return "allow_once";
	if (choice === allowSessionLabel) return "allow_session";
	return "deny";
}

async function askPermission(prompt: string, ctx: ExtensionContext): Promise<PermissionDecision> {
	if (!ctx.hasUI) {
		return "deny";
	}

	return mapChoice(await ctx.ui.select(prompt, [allowOnceLabel, allowSessionLabel, denyLabel]));
}

export default function toolPermissionGate(pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		const key = getPermissionKey(event);
		if (!key) return undefined;

		if (sessionAllowed.has(key)) {
			return undefined;
		}

		const prompt = getPermissionPrompt(event);
		if (!prompt) return undefined;

		const decision = await askPermission(prompt, ctx);
		if (decision === "allow_session") {
			sessionAllowed.add(key);
			return undefined;
		}
		if (decision === "allow_once") {
			return undefined;
		}

		return {
			block: true,
			reason: ctx.hasUI ? "Tool call blocked by user" : "Tool call blocked because no permission UI is available",
		};
	});
}
