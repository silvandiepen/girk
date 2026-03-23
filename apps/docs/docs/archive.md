---
icon: /media/icon_archive.svg
tags: documentation
---
# Archives

Archives let a folder landing page collect and present its child pages as a generated listing or combined layout.

Create an archive by setting `archive` on a folder landing page such as `blog/README.md`.

`blog/README.md`

```markdown
---
archive: blog
---

# Blog

Here you will find all my blogs
```

All other Markdown files in the same folder become archive children.

### Archive Types

#### Articles

Articles create a structured overview of child pages. This is a good default for docs indexes and curated lists of related pages.

```md
---
archive: articles
---
```

#### Blog

Blog archives are date-driven. They are useful for journals, changelogs, and post lists.

```md
---
archive: blog
---
```

#### Sections

When selecting `sections`, all child files are rendered into the parent page as continuous sections. Use this when one long page is easier to manage as separate source files.
```markdown
---
archive: sections
---
```

#### Collection

Collections render child items as a grouped set without the stronger blog-specific date treatment. Use it when you want a grouped output but not a dated article list.

## Archive Notes

- archive children still remain normal pages unless you intentionally hide them
- `menuChildren: true` makes the child pages visible beneath the archive item in the menu
- `order` and `date` help control how the children are presented
