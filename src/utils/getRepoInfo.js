import { Octokit, App } from "octokit";

import path from "node:path";
import fs from "node:fs";

import { config } from "dotenv";
config();

// Create a personal access token at https://github.com/settings/tokens/new?scop9es=repo
// 5000 requests per hour!
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });


async function getExistingStars(){


	let targetJsonPath = path.resolve(process.cwd(), "src", "data", "repos.json");

	console.log(targetJsonPath);
	// return;

	// let response = await octokit.rest.repos.get({})

	// console.log(Object.keys(response.data));
	
	let allResponses = [];

	for (let index = 1; index < 9; index++) {
		let response = await octokit.request("GET /user/starred", {per_page: 100, page: index});

		allResponses = [
			...allResponses,
			...response.data
		]
	}
	// Will not get private repos, so number may be different to what you see on your own account.
	console.log(allResponses.length);

	let existingStarsImportantBits = [];

	for (const existingStarredRepo of allResponses) {

		// get the topics of each repo
		// 742 requests...

		existingStarsImportantBits.push({
			owner: existingStarredRepo.owner.login,
			owner_type: existingStarredRepo.owner.type,
			homepage: existingStarredRepo.homepage || "",
			url: existingStarredRepo.html_url,
			description: existingStarredRepo.description || "",
			name: existingStarredRepo.name,
			full_name: existingStarredRepo.full_name,
			id: existingStarredRepo.id,
			topics: [...existingStarredRepo.topics] || [],
			lists: [],
			license: existingStarredRepo.license || {}
		});
	}


	fs.writeFileSync(targetJsonPath, JSON.stringify(existingStarsImportantBits, null, 4));

	// let oneRepo = {
	// 	homepage: allResponses[0].homepage,
	// 	url: allResponses[0].html_url,
	// 	description: allResponses[0].description,
	// 	name: allResponses[0].name,
	// 	full_name: allResponses[0].full_name,
	// 	id: allResponses[0].id
	// }
	// console.log(oneRepo);
}

getExistingStars();

import data from "../data/repos.json" with { type:"json"};

async function calculateSandbox(){

	let allRepoTopics = data.flatMap((repoObj) => {
		return repoObj.topics
	});

	console.log(allRepoTopics);
}

// calculateSandbox();