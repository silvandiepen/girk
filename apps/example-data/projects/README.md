---
title: Projects
archive: articles
menuChildren: true
order: 10
dataSource: projects.json
dataItems: items
---

# Projects

This page repeats over a JSON data source during the build, while the sibling detail pages are generated from one shared markdown template.

{{#each result}}
## [{{result.title}}](/projects/{{result.slug}}/)

{{result.summary}}
{{/each}}
