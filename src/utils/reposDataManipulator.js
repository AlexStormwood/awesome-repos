import path from "node:path";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function loadAllRepoData(){
	let repoDataDir = path.resolve(process.cwd(), "data", "repositories");

	// Logic for this "read all JSON files in dir and combine them into an array" bit
	// is from here: https://stackoverflow.com/questions/54615185/read-multiple-json-files-into-an-array-of-objects-in-javascript
	let loadedData = fs.readdirSync(repoDataDir)
	.filter(name => path.extname(name) === '.json')
	.map(name => JSON.parse(fs.readFileSync(path.resolve(repoDataDir, name), {encoding: "utf-8"})));

	// console.log(loadedData);
	return loadedData;
}

export async function loadRecentlyAddedRepoData(limit = 10, rootDirectory = process.cwd()) {
	if (!Number.isInteger(limit) || limit < 0) {
		throw new RangeError("The recent repository limit must be a non-negative integer.");
	}
	if (limit === 0) return [];

	const git = async (args) => {
		const { stdout } = await execFileAsync("git", args, {
			cwd: rootDirectory,
			encoding: "utf8",
			timeout: 60_000,
		});
		return stdout;
	};

	// A shallow boundary looks like an initial commit adding every existing file.
	// Restore history before reading additions so deploys don't show false results.
	if ((await git(["rev-parse", "--is-shallow-repository"])).trim() === "true") {
		console.info("Fetching Git history for recently added repositories…");
		await git(["fetch", "--unshallow"]);
	}

	// First-parent history records when a submission landed on this branch.
	// Only additions count; metadata edits must not bump a repository to the top.
	const addedFiles = (await git([
		"log", "--first-parent", "--diff-filter=A", "--format=", "--name-only",
		"--", "data/repositories/*.json",
	])).split("\n");
	const recentRepositories = [];
	const seen = new Set();

	for (const filename of addedFiles) {
		if (!/^data\/repositories\/[^/]+\.json$/.test(filename) || seen.has(filename)) continue;
		seen.add(filename);
		const filepath = path.resolve(rootDirectory, filename);
		// Deleted repositories can still appear in the history of additions.
		if (!fs.existsSync(filepath)) continue;
		recentRepositories.push(JSON.parse(fs.readFileSync(filepath, "utf8")));
		if (recentRepositories.length === limit) break;
	}

	return recentRepositories;
}

export async function addOneRepo(newRepoDataObj){

}
