---
title: Data Driven
archive: articles
menuChildren: true
order: 15
icon: /assets/icon-settings.svg
dataSource: data/projects.json
dataItems: items
---

# Data Driven

This page repeats over a JSON data source during the build, while the sibling detail pages are generated from one shared markdown template.

{{#each result}}
## [{{result.title}}](/data-driven/{{result.slug}}/)

{{result.summary}}
{{/each}}
