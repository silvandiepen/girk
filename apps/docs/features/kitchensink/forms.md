---
title: Native Form Controls
order: 3
color: secondary
---

## Native Form Controls

The form below is intentionally plain HTML. No framework classes, no custom components, just the generated defaults for native controls.

<form action="#" method="post">
<input type="hidden" name="source" value="kitchensink" />

<label for="kitchen-name">
Name
<input id="kitchen-name" name="name" type="text" placeholder="John Doe" />
</label>

<label for="kitchen-search">
Search
<input id="kitchen-search" name="search" type="search" placeholder="Search docs" />
</label>

<label for="kitchen-email">
Email
<input id="kitchen-email" name="email" type="email" autocomplete="email" placeholder="john@example.com" />
</label>

<label for="kitchen-password">
Password
<input id="kitchen-password" name="password" type="password" value="password123" />
</label>

<label for="kitchen-phone">
Telephone
<input id="kitchen-phone" name="phone" type="tel" placeholder="+356 9999 0000" />
</label>

<label for="kitchen-url">
URL
<input id="kitchen-url" name="website" type="url" placeholder="https://example.com" />
</label>

<label for="kitchen-number">
Number
<input id="kitchen-number" name="team-size" type="number" min="1" max="50" value="12" />
</label>

<label for="kitchen-date">
Date
<input id="kitchen-date" name="launch-date" type="date" value="2026-03-25" />
</label>

<label for="kitchen-time">
Time
<input id="kitchen-time" name="launch-time" type="time" value="09:30" />
</label>

<label for="kitchen-datetime">
Datetime Local
<input id="kitchen-datetime" name="launch-datetime" type="datetime-local" value="2026-03-25T09:30" />
</label>

<label for="kitchen-month">
Month
<input id="kitchen-month" name="billing-month" type="month" value="2026-03" />
</label>

<label for="kitchen-week">
Week
<input id="kitchen-week" name="sprint-week" type="week" value="2026-W13" />
</label>

<label for="kitchen-role">
Select
<select id="kitchen-role" name="role">
<option value="">Choose one</option>
<option>Designer</option>
<option>Developer</option>
<option>Content editor</option>
</select>
</label>

<label for="kitchen-stack">
Multi Select
<select id="kitchen-stack" name="stack" multiple size="4">
<option selected>HTML</option>
<option selected>CSS</option>
<option>JavaScript</option>
<option>TypeScript</option>
</select>
</label>

<label for="kitchen-country">
Datalist
<input id="kitchen-country" name="country" list="kitchen-country-list" placeholder="Start typing a country" />
</label>
<datalist id="kitchen-country-list">
<option value="Malta"></option>
<option value="Netherlands"></option>
<option value="Portugal"></option>
<option value="Sweden"></option>
</datalist>

<label for="kitchen-message">
Textarea
<textarea id="kitchen-message" name="message" placeholder="Describe what you want to publish."></textarea>
</label>

<label for="kitchen-color">
Color
<input id="kitchen-color" name="accent" type="color" value="#e2921b" />
</label>

<label for="kitchen-range">
Range
<input id="kitchen-range" name="volume" type="range" min="0" max="100" value="72" />
</label>

<label for="kitchen-output">
Output
<output id="kitchen-output" name="summary" for="kitchen-number kitchen-range">12 seats, 72% ready</output>
</label>

<label for="kitchen-file">
File
<input id="kitchen-file" name="attachment" type="file" />
</label>

<fieldset>
<legend>Project Brief</legend>

<label for="kitchen-brief-title">Project title</label>
<input id="kitchen-brief-title" name="brief-title" type="text" placeholder="Spring campaign site" />

<label>
Primary goal
<select name="brief-goal">
<option value="">Choose one</option>
<option selected>Lead generation</option>
<option>Documentation</option>
<option>Internal knowledge base</option>
</select>
</label>

<label for="kitchen-brief-summary">Summary</label>
<textarea id="kitchen-brief-summary" name="brief-summary" placeholder="Outline what this site needs to do."></textarea>
</fieldset>

<fieldset>
<legend>Publishing Settings</legend>

<label>
Owner email
<input name="publish-owner" type="email" placeholder="owner@example.com" />
</label>

<label for="kitchen-publish-slug">Public URL slug</label>
<input id="kitchen-publish-slug" name="publish-slug" type="text" placeholder="launch-notes" />

<label>
Visibility
<select name="publish-visibility">
<option selected>Internal only</option>
<option>Public</option>
<option>Password protected</option>
</select>
</label>
</fieldset>

<fieldset>
<legend>Inline Labels</legend>

<label>
<span>Accent</span>
<input id="kitchen-inline-accent" name="inline-accent" type="color" value="#e2921b" />
<output for="kitchen-inline-accent">#e2921b</output>
</label>

<label>
<span>Intensity</span>
<input id="kitchen-inline-intensity" name="inline-intensity" type="range" min="0" max="100" value="72" />
<output for="kitchen-inline-intensity">72%</output>
</label>

<label>
<span>Columns</span>
<input id="kitchen-inline-columns" name="inline-columns" type="range" min="1" max="12" value="4" />
<input id="kitchen-inline-columns-number" name="inline-columns-number" type="number" min="1" max="12" value="4" />
</label>
</fieldset>

<fieldset>
<legend>Checkboxes</legend>
<label>
<input type="checkbox" name="updates" checked />
<span>
Send product updates
<small>One short summary each month.</small>
</span>
</label>
<label>
<input type="checkbox" name="security" />
<span>
Send security notices
<small>Only when action is required.</small>
</span>
</label>
</fieldset>

<fieldset>
<legend>Radios</legend>
<label>
<input type="radio" name="format" value="email" checked />
<span>Email</span>
</label>
<label>
<input type="radio" name="format" value="rss" />
<span>RSS</span>
</label>
</fieldset>

<label for="kitchen-disabled">
Disabled
<input id="kitchen-disabled" name="disabled" type="text" value="Not editable yet" disabled />
</label>

<label for="kitchen-readonly">
Readonly
<input id="kitchen-readonly" name="readonly" type="text" value="Preview only" readonly />
</label>

<input type="submit" value="Submit form" />
<input type="reset" value="Reset form" />
<button type="button">Plain button</button>
</form>
