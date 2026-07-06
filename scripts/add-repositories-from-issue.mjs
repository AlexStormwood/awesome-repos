import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const repositoryDirectory = "data/repositories";
const issueBody = process.env.ISSUE_BODY ?? "";
const issueNumber = process.env.ISSUE_NUMBER ?? "unknown";
const commentFile = process.env.COMMENT_FILE;
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
const apiBaseUrl = process.env.GITHUB_API_URL ?? "https://api.github.com";

function writeComment(markdown) {
	if (commentFile) {
		writeFileSync(commentFile, `${markdown.trim()}\n`, "utf8");
	}
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getIssueSection(body, heading) {
	const pattern = new RegExp(
		`(?:^|\\r?\\n)###\\s+${escapeRegExp(heading)}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n###\\s+|$)`,
		"i",
	);
	const match = body.match(pattern);
	const value = match?.[1]?.trim() ?? "";

	return value === "_No response_" ? "" : value;
}

function normalizeLine(value) {
	return value
		.trim()
		.replace(/^[-*]\s+/, "")
		.replace(/^`+|`+$/g, "")
		.replace(/^["']|["']$/g, "")
		.trim();
}

export function parseListIds(value) {
	const selectedIssueFormOptions = [
		...value.matchAll(/\[([A-Za-z0-9_-]+)\](?=\s*(?:,|\r?\n|$))/g),
	].map((match) => match[1]);

	if (selectedIssueFormOptions.length > 0) {
		return [...new Set(selectedIssueFormOptions)].sort((a, b) => a.localeCompare(b));
	}

	return [
		...new Set(
			value
				.split(/[\n,]/)
				.map(normalizeLine)
				.filter(Boolean),
		),
	].sort((a, b) => a.localeCompare(b));
}

function normalizeRepoName(value) {
	return value.replace(/\.git$/i, "").replace(/[),.;]+$/g, "");
}

function parseRepositoryReferences(value) {
	const repositories = new Map();
	const githubUrlPattern =
		/(?:https?:\/\/)?github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)(?:[/?#][^\s]*)?/gi;

	for (const match of value.matchAll(githubUrlPattern)) {
		const owner = match[1];
		const repo = normalizeRepoName(match[2]);
		repositories.set(`${owner.toLowerCase()}/${repo.toLowerCase()}`, { owner, repo });
	}

	for (const line of value.split(/\r?\n/)) {
		const normalizedLine = normalizeLine(line);
		const ownerRepoMatch = normalizedLine.match(
			/^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/,
		);

		if (!ownerRepoMatch) {
			continue;
		}

		const owner = ownerRepoMatch[1];
		const repo = normalizeRepoName(ownerRepoMatch[2]);
		repositories.set(`${owner.toLowerCase()}/${repo.toLowerCase()}`, { owner, repo });
	}

	return [...repositories.values()];
}

function getKnownListIds() {
	const lists = JSON.parse(readFileSync("data/lists.json", "utf8"));
	return new Set(lists.map((list) => list.id));
}

function getListIdsSection(body) {
	return getIssueSection(body, "Lists") || getIssueSection(body, "List IDs");
}

async function fetchGitHubJson(path) {
	const headers = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${apiBaseUrl}${path}`, { headers });

	if (!response.ok) {
		const message = await response.text();
		throw new Error(`GitHub API request failed for ${path}: ${response.status} ${message}`);
	}

	return response.json();
}

async function getRepositoryData(owner, repo) {
	const repository = await fetchGitHubJson(`/repos/${owner}/${repo}`);

	return {
		owner: repository.owner.login,
		owner_type: repository.owner.type,
		homepage: repository.homepage ?? "",
		url: repository.html_url,
		description: repository.description ?? "",
		name: repository.name,
		full_name: repository.full_name,
		id: repository.id,
		topics: repository.topics ?? [],
		lists: [],
		license: repository.license,
	};
}

function validateListIds(listIds, knownListIds) {
	const unknownListIds = listIds.filter((listId) => !knownListIds.has(listId));

	if (unknownListIds.length > 0) {
		throw new Error(
			`Unknown list ID${unknownListIds.length === 1 ? "" : "s"}: ${unknownListIds.join(", ")}`,
		);
	}
}

function makeMarkdownList(values) {
	if (values.length === 0) {
		return "- None";
	}

	return values.map((value) => `- ${value}`).join("\n");
}

export async function main() {
	const repositoryUrlsSection = getIssueSection(issueBody, "Repository URLs");
	const listIdsSection = getListIdsSection(issueBody);
	const repositories = parseRepositoryReferences(repositoryUrlsSection);
	const listIds = parseListIds(listIdsSection);

	if (repositories.length === 0) {
		throw new Error("No GitHub repository URLs were found in the Repository URLs section.");
	}

	if (listIds.length === 0) {
		throw new Error("No list IDs were found in the Lists section.");
	}

	const knownListIds = getKnownListIds();
	validateListIds(listIds, knownListIds);
	mkdirSync(repositoryDirectory, { recursive: true });

	const created = [];
	const skipped = [];

	for (const { owner, repo } of repositories) {
		const repositoryData = await getRepositoryData(owner, repo);
		const filepath = join(repositoryDirectory, `${repositoryData.id}.json`);

		try {
			readFileSync(filepath, "utf8");
			skipped.push(`${repositoryData.full_name} (${repositoryData.id}) already exists`);
			continue;
		} catch (error) {
			if (error.code !== "ENOENT") {
				throw error;
			}
		}

		repositoryData.lists = listIds;
		writeFileSync(filepath, `${JSON.stringify(repositoryData, null, 4)}\n`, "utf8");
		created.push(`${repositoryData.full_name} (${repositoryData.id})`);
	}

	writeComment(`
Repository submission processed for issue #${issueNumber}.

Created:
${makeMarkdownList(created)}

Skipped:
${makeMarkdownList(skipped)}

Applied list IDs:
${makeMarkdownList(listIds)}
`);

	console.log(
		JSON.stringify(
			{
				issueNumber,
				submittedRepositories: repositories.length,
				created: created.length,
				skipped: skipped.length,
				listIds,
			},
			null,
			2,
		),
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		await main();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);

		writeComment(`
Repository submission failed for issue #${issueNumber}.

${message}
`);

		console.error(message);
		process.exit(1);
	}
}
