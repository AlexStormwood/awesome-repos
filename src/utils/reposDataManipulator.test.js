import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { loadRecentlyAddedRepoData } from "./reposDataManipulator.js";

function fixture(t) {
	const directory = mkdtempSync(path.join(tmpdir(), "recent-repos-"));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	const git = (...args) => execFileSync("git", args, { cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
	git("init", "--initial-branch=main");
	git("config", "user.name", "Repository tests");
	git("config", "user.email", "tests@example.com");
	mkdirSync(path.join(directory, "data/repositories"), { recursive: true });
	const write = (id, description = "A repository") => writeFileSync(
		path.join(directory, `data/repositories/${id}.json`),
		JSON.stringify({ id, full_name: `owner/${id}`, description }),
	);
	const commit = () => {
		git("add", "--all");
		git("commit", "--allow-empty", "-m", "Update collection");
	};
	return { directory, git, write, commit };
}

test("recent additions ignore edits and deletions, respect limits, and refresh", async (t) => {
	const { directory, write, commit } = fixture(t);
	write(1);
	commit();
	write(2);
	commit();
	write(1, "Updated metadata");
	commit();
	assert.deepEqual((await loadRecentlyAddedRepoData(10, directory)).map((repo) => repo.id), [2, 1]);

	rmSync(path.join(directory, "data/repositories/2.json"));
	write(3);
	write(4);
	commit();
	assert.deepEqual((await loadRecentlyAddedRepoData(10, directory)).map((repo) => repo.id), [3, 4, 1]);
	assert.deepEqual((await loadRecentlyAddedRepoData(2, directory)).map((repo) => repo.id), [3, 4]);

	write(5);
	commit();
	assert.equal((await loadRecentlyAddedRepoData(10, directory))[0].id, 5);
});

test("merged submissions appear and restored files appear only once", async (t) => {
	const { directory, git, write, commit } = fixture(t);
	write(1);
	commit();
	git("checkout", "-b", "submission");
	write(2);
	commit();
	git("checkout", "main");
	write(3);
	commit();
	git("merge", "--no-ff", "submission", "-m", "Merge submission");
	assert.deepEqual((await loadRecentlyAddedRepoData(10, directory)).map((repo) => repo.id), [2, 3, 1]);

	rmSync(path.join(directory, "data/repositories/1.json"));
	commit();
	write(1);
	commit();
	assert.deepEqual((await loadRecentlyAddedRepoData(10, directory)).map((repo) => repo.id), [1, 2, 3]);
});

test("shallow deploy checkouts fetch history instead of treating all files as new", async (t) => {
	const { directory, git, write, commit } = fixture(t);
	write(1);
	commit();
	write(2);
	commit();
	write(1, "Recently edited, originally added first");
	commit();
	const cloneDirectory = path.join(directory, "shallow-clone");
	git("clone", "--depth=1", pathToFileURL(directory).href, cloneDirectory);
	assert.deepEqual((await loadRecentlyAddedRepoData(10, cloneDirectory)).map((repo) => repo.id), [2, 1]);
	assert.equal(execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
		cwd: cloneDirectory, encoding: "utf8",
	}).trim(), "false");
});
