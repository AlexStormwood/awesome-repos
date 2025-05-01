// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import data from "./src/data/repos.json";

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
		link: "/tags/"+Object.keys(topic)[0]
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

sortedCountedListsList.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]);

// console.log(countedTopicsList);

let listsListAsSidebarLinks = [...sortedCountedListsList].map((list) => {
	return {
		label: `${Object.keys(list)[0]} (${Object.values(list)[0]})`,
		link: "/lists/"+Object.keys(list)[0]
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
					label: "Lists",
					collapsed: false,
					items: listsListAsSidebarLinks
				},
				{
					label: "Topics",
					collapsed: true,
					items: topicsListAsSidebarLinks
				}
			],
			tableOfContents: false
		}),
	],
});
