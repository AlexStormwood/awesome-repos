// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import data from "./src/data/repos.json";
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
// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "Alex Stormwood's Lists of Awesome Repositories",
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/AlexStormwood/awesome-repos' }],
			sidebar: [
				{
					label: "Lists",
					items: []
				},
				{
					label: "Topics",
					items: topicsListAsSidebarLinks
				}
			],
			tableOfContents: false
		}),
	],
});
