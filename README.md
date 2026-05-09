# Alex's Awesome Repos

GitHub Lists didn't give me enough lists to organise all of the cool things that I want to be able to share with people, so I've moved my starred repositories and lists of stars into a website! Enjoy!

## Deployment

This website is deployed via Netlify, and you can access it here:

- [https://awesome-repos.alexstormwood.com/](https://awesome-repos.alexstormwood.com/)

## Tech Stack

This website is built using Astro, with its Starlight (docs) template.

Repository data is retrieved before the build step using GitHub's REST and/or GraphQL APIs and saved (with modifications) into JSON files that live within this repository, so no web scraping is occuring.

## Lists

Lists are manually-defined by me, and repositories are added to them based on my GitHub stars or by using this project's issue and automation systems. 

Some lists are focused on a topic, like "Useful Unity Stuff" focusing on repositories relevant to Unity work.

Some lists are focused on a group or category, covering one or more topics, such as "CA - 2025-JAN-PT DWD Cohort" being a list of repositories for a range of topics taught to that particular class.

## Topics

On the website, this section is basically entirely automatic. If a repository has topics or tags in its "About" data, they get transplanted into topics on this website.

Topics act like lists - you can view repositories assigned to this piece of data on a nice webpage.

## Search

The website allows you to search! This search goes through basically all bits of data you would see on a list, topic, or repository. It's really powerful! If you already know what you're looking for, use a search!

## Adding New Repositories

This repository has GitHub Actions and GitHub Issues set up in a way where you can lodge an issue to add a repository, and then that gets translated into a pull request for me to approve. The pull request adds one or more JSON files representing the repositories that you propose into the website. Once that PR is merged, Netlify redeploys the website.

Basically, you can add repositories to this website without digging around in JSON or REST/GraphQL APIs!

## Errors

The lists aren't perfect. They were managed manually for years. Lodge a regular repository issue to let me know if any urgent fixes are needed!