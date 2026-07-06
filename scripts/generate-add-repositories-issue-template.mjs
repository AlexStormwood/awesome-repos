import { readFileSync, writeFileSync } from "node:fs";

const listsPath = "data/lists.json";
const templatePath = ".github/ISSUE_TEMPLATE/add-repositories.yml";

function readLists() {
	return JSON.parse(readFileSync(listsPath, "utf8"));
}

function validateLists(lists) {
	if (!Array.isArray(lists)) {
		throw new Error(`${listsPath} must contain an array of lists.`);
	}

	const seenIds = new Set();
	const seenOptions = new Set();

	for (const [index, list] of lists.entries()) {
		if (!list || typeof list !== "object") {
			throw new Error(`List entry ${index} must be an object.`);
		}

		if (typeof list.id !== "string" || list.id.trim() === "") {
			throw new Error(`List entry ${index} must have a non-empty string id.`);
		}

		if (typeof list.name !== "string" || list.name.trim() === "") {
			throw new Error(`List entry ${list.id} must have a non-empty string name.`);
		}

		if (seenIds.has(list.id)) {
			throw new Error(`Duplicate list id: ${list.id}`);
		}

		const option = makeListOption(list);

		if (seenOptions.has(option)) {
			throw new Error(`Duplicate issue form option: ${option}`);
		}

		seenIds.add(list.id);
		seenOptions.add(option);
	}
}

function makeYamlString(value) {
	return JSON.stringify(value);
}

function makeListOption(list) {
	return `${list.name} [${list.id}]`;
}

function makeTemplate(lists) {
	const listOptions = lists
		.map((list) => `        - ${makeYamlString(makeListOption(list))}`)
		.join("\n");

	return `name: Add repositories
description: Suggest one or more repositories to add to the data set.
title: "Add repositories: "
labels: ["repo-submission"]
body:
  - type: markdown
    attributes:
      value: |
        Submit one or more GitHub repositories to add to this project. One issue can include several repository URLs; the automation will create one pull request for the whole batch.

  - type: textarea
    id: repository_urls
    attributes:
      label: Repository URLs
      description: Add one GitHub repository URL per line.
      placeholder: |
        https://github.com/owner/first-repo
        https://github.com/owner/second-repo
    validations:
      required: true

  - type: dropdown
    id: list_ids
    attributes:
      label: Lists
      description: Select one or more lists to apply to every submitted repository in this issue.
      multiple: true
      options:
${listOptions}
    validations:
      required: true

  - type: textarea
    id: notes
    attributes:
      label: Notes
      description: Optional context for maintainers.
    validations:
      required: false
`;
}

const lists = readLists();
validateLists(lists);
writeFileSync(templatePath, makeTemplate(lists), "utf8");

console.log(`Updated ${templatePath} with ${lists.length} list options.`);
