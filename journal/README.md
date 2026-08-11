# Journal publishing guide

The journal gallery on the homepage is generated from the Markdown files in `journal/entries/`. Each article stays readable as Markdown, while `index.html` contains the generated gallery visitors see.

## Add a new article

Open Terminal and run:

```bash
cd "/Users/sofhrina/Documents/ChatGPT/个人网站"
git switch main
git pull --ff-only
git switch -c codex/journal-short-name

npm run journal:add -- "/absolute/path/to/article.md" \
  --date 2026-08-11 \
  --summary "Write one or two sentences that make someone want to open it."
```

The date accepts `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. The title defaults to the Markdown filename. To use another title, add `--title "Displayed title"`.

The command will:

1. copy the original into `journal/entries/`;
2. add the title, date, and summary as front matter;
3. rebuild the compressed gallery in `index.html`;
4. put the newest entry in the small Journal window at the top of the homepage.

## Check and open a pull request

```bash
npm run check
git add index.html journal/entries
git commit -m "Add journal: displayed title"
git push -u origin codex/journal-short-name
gh pr create --base main --fill
```

Merge the pull request after its checks pass. GitHub Pages will then publish the new article. Do not edit the content between the `JOURNAL_PREVIEW` or `JOURNAL_GALLERY` comments in `index.html`; it is overwritten whenever the gallery is rebuilt.

## Edit an existing article

Edit its Markdown file in `journal/entries/`, then run:

```bash
npm run journal:build
npm run check
```

Commit `journal/entries/...md` and the regenerated `index.html` in the same pull request.
