---
icon: /media/icon_project.svg
tags: documentation
---

# Project Settings

Project settings can be declared in any Markdown file or in `girk.config.json` / `gieter.config.json`. Config files are loaded first, and matching project keys in Markdown frontmatter override them.

```markdown
---
projectTitle: My Project Title
projectLogo: /media/my-logo.svg
projectIgnore: src, test
projectStyle: /assets/my-css.css
projectStyleOverrule: /assets/my-alt-css.css
projectScript: /assets/app.js
projectCopyFiles: downloads, feed.xml
---
```

## JSON Example

```json
{
  "project": {
    "title": "My Project Title",
    "description": "A Markdown-first site"
  },
  "socials": [
    "https://github.com/acme/docs"
  ],
  "noRobots": true
}
```

## Core Keys

- **projectTitle** sets the title of the project. It is used in document titles and as the fallback logo text.
- **projectDescription** sets the default description for the whole site.
- **projectLogo** sets the logo image used in the header. Without it, Girk tries to auto-discover `logo.svg`, `logo.png`, `logo.jpg`, or `logo.gif`.
- **projectStyle** adds a custom stylesheet on top of the generated stylesheet.
- **projectStyleOverrule** replaces the generated stylesheet entirely.
- **projectScript** adds one or more scripts near the end of the page.
- **projectIgnore** excludes folders or paths after file discovery.
- **projectGroupTags** keeps tag pages grouped by parent section instead of merging them globally.
- **projectCopyFiles** copies extra files or folders into the generated asset folder.

## Operational Notes

- `projectIgnore` is applied after discovery, so it removes matching content from later steps such as menu and archive generation
- `projectStyle` layers custom CSS on top of the generated stylesheet
- `projectStyleOverrule` replaces the generated stylesheet entirely and should be used only when you want full control
- `projectScript` accepts one script or a list of scripts
- `projectCopyFiles` is useful for feed files, downloads, or any non-standard assets you still want copied into the output

Nested config is flattened internally, so JSON like the example above becomes the same as using `projectTitle` and `projectDescription` in frontmatter.
