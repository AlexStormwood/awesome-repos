import path from "node:path";
import fs from "node:fs";

export async function loadAllRepoData(){
	let repoDataDir = path.resolve(process.cwd(), "src", "data", "repos");

	// Logic for this "read all JSON files in dir and combine them into an array" bit
	// is from here: https://stackoverflow.com/questions/54615185/read-multiple-json-files-into-an-array-of-objects-in-javascript
	let loadedData = fs.readdirSync(repoDataDir)
	.filter(name => path.extname(name) === '.json')
	.map(name => JSON.parse(fs.readFileSync(path.resolve(repoDataDir, name), {encoding: "utf-8"})));

	// console.log(loadedData);
	return loadedData;
}

export async function addOneRepo(newRepoDataObj){

}