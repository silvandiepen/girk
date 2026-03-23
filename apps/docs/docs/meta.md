---
icon: /media/icon_meta.svg
tags: documentation
---

# Meta

The table below lists the most useful frontmatter keys for day-to-day work. Most Girk behavior is driven by these keys plus the folder structure.

| setting              | default            | description |
| -------------------- | ------------------ | ----------- |
| title                | inherit from `h1`  | Sets the page title used in the menu and document title. |
| description          | `none`             | Sets the page description and overrides `projectDescription` for that page. |
| date                 | file creation date | Used for blog-style listings and `<meta name="updated">`. |
| icon                 | `none`             | Icon shown in menus and archive cards. |
| image                | `none`             | Main image for the page. Falls back as a thumbnail when no dedicated thumbnail is set. |
| thumbnail            | inherit from image | Thumbnail image for archive cards. `thumb` is also supported. |
| tags                 | `none`             | Adds one or more tags to the page. Comma-separated values become arrays automatically. |
| hide                 | `false`            | Generates the page but removes it from navigation. |
| order                | `999`              | Controls menu and archive ordering. Lower values appear first. |
| redirect             | `none`             | Replaces the generated page link in menus and archive cards with an external or internal URL. |
| menuChildren         | `false`            | On archive landing pages, adds the archive children below the menu item. |
| archive              | `none`             | Turns a folder landing page into an archive using `articles`, `blog`, `sections`, or `collection`. |
| archiveTitle         | inherit from page  | Optional heading shown above archive children. |
| projectTitle         | `none`             | Sets the project title for the entire generated site. |
| projectDescription   | `none`             | Sets the default site description. |
| projectLogo          | auto-discovered    | Points to a specific logo file in `media/` or `assets/`. |
| projectStyle         | `none`             | Adds an extra stylesheet on top of the default generated stylesheet. |
| projectStyleOverrule | `none`             | Replaces the default stylesheet entirely. |
| projectScript        | `none`             | Adds one or more custom scripts near the end of the document. |
| projectIgnore        | `none`             | Comma-separated list of folders or paths to exclude after discovery. |
| projectGroupTags     | `false`            | Groups tag pages by parent section instead of merging them globally. |
| projectCopyFiles     | `none`             | Copies extra files or folders into the output asset folder. |

## Parsing Rules

- Frontmatter must appear near the top of the file and be wrapped in `---`.
- Values containing commas are converted into arrays unless they look like URLs.
- Keys containing `date` are converted to JavaScript dates automatically.
- `README.md` and `index.md` are treated as a folder landing page rather than a normal child page.

## Rule Of Thumb

Use page keys for page behavior:

- `title`
- `description`
- `date`
- `tags`
- `image`
- `thumbnail`
- `hide`
- `redirect`
- `archive`

Use project keys for site-wide behavior:

- `projectTitle`
- `projectDescription`
- `projectLogo`
- `projectStyle`
- `projectStyleOverrule`
- `projectScript`
- `projectIgnore`
