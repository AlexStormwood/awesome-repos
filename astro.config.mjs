// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { loadAllRepoData } from './src/utils/reposDataManipulator';

import listData from "./data/lists.json" with {type:"json"};

let data = await loadAllRepoData();
console.log(data[0])

//#region Topics list
let allRepoTopics = data.flatMap((repoObj) => {
	return repoObj.topics;
});

const countedTopicsList = {};

[...allRepoTopics].forEach((topic) => {
	// @ts-ignore
	countedTopicsList[topic] = (countedTopicsList[topic] || 0) + 1;
});

const sortedCountedTopicsList = Object.entries(countedTopicsList).map(([key, value]) => {
	return {[key]: value}
});

sortedCountedTopicsList.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]);

// console.log(countedTopicsList);

let topicsListAsSidebarLinks = [...sortedCountedTopicsList].map((topic) => {
	return {
		label: `${Object.keys(topic)[0]} (${Object.values(topic)[0]})`,
		link: "/topics/"+Object.keys(topic)[0]
	};
});

//#endregion



//#region Lists list

let allRepoLists = data.flatMap((repoObj) => {
	return repoObj.lists
});

const countedListsList = {};

[...allRepoLists].forEach((list) => {
	// @ts-ignore
	countedListsList[list] = (countedListsList[list] || 0) + 1;
});

const sortedCountedListsList = Object.entries(countedListsList).map(([key, value]) => {
	return {[key]: value}
});

// sortedCountedListsList.sort((a, b) => {
// 	console.log(Object.keys(b)[0] + " - " + Object.keys(a)[0]);
	
// 	return Object.keys(b)[0] - Object.keys(a)[0]
// });

let sortedListNamesList = sortedCountedListsList.map((listCounterObj) => Object.keys(listCounterObj)[0]);
sortedListNamesList = sortedListNamesList.sort();

// console.log(countedTopicsList);

let listsListAsSidebarLinks = [...sortedListNamesList].map((listName) => {
	return {
		// @ts-ignore
		label: `${listData.find((listObj) => listObj.id == listName ).name} (${sortedCountedListsList.find((listCountObj) => Object.keys(listCountObj)[0] == [listName])[listName]})`,
		link: "/lists/"+listName
	};
});


//#endregion

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "Alex Stormwood's Lists of Awesome Repositories",
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/AlexStormwood/awesome-repos' }],
			sidebar: [
				{
					label: `Total Repositories: ${data.length}`,
					items: []
				},
				{
					label: `Lists (${listsListAsSidebarLinks.length})`,
					collapsed: false,
					items: listsListAsSidebarLinks
				},
				{
					label: `Topics (${topicsListAsSidebarLinks.length})`,
					collapsed: true,
					items: topicsListAsSidebarLinks
				}
			],
			tableOfContents: false,
			customCss: [
				"./src/styles/custom.css"
			]
		}),
	],
});