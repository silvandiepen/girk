---
icon: /media/icon_media.svg
tags: documentation
---
# Media and Assets

When your project contains a `media/` or `assets/` folder, Girk copies those folders into the generated site. Use them for logos, images, favicons, downloadable files, or any static assets you want to reference from Markdown or templates.

## Copied Automatically

- `media/`
- `assets/`
- anything listed in `projectCopyFiles`

## Favicon

Add `favicon.png` to `media/` or `assets/` and Girk will generate a `.ico` favicon automatically.

### Logo

Add `logo.svg`, `logo.png`, `logo.jpg`, or `logo.gif` to `media/` or `assets/` and Girk will try to use it automatically in the header.

If the logo is an SVG, Girk loads the SVG data directly so it can inherit the site color.

When you have multiple logo files or want to point to a different asset, use:

```markdown
---
projectLogo: /media/brand-mark.svg
---
```

## Images And Thumbnails

- `image` is the main image for a page
- `thumbnail` is used for archive cards
- `thumb` is also supported for backward compatibility

This makes it possible to keep a larger content image and a smaller archive image separate when needed.
