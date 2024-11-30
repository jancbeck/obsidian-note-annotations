## Aggregator

-   importing content from sources
    -   rss
        -   "inbox" for all subscribed content
        -   folder structure
        -   use <link> as uuid
        -   [RSS]
            -   [FEEDNAME1]
                -   [DATE-ARTICLE1].md
    -   obsidian clipper
-   formatting, properties, templates

## Reader

-   first-class mobile support
-   active reading experience
    -   auto highlight selections, disable with modifier
    -   LIMITATION: can online highlight inline, no multiblock highlights
-   view comments in margins and popover
    -   use [popover api and anchor positioning](https://developer.chrome.com/blog/new-in-web-ui-io-2024#the_popover_api)
    -   allows editing directly
-   add new highlights
    -   comment syntax
        -   option 1 `==my text==^[my comment #color/gold]`
            -   already works somewhat out of the box
            -   conflicts with existing footnotes
        -   option 2a `==my text==%%my comment #color/gold%%`
            -   obsidian exclusive
        -   option 2b `=my text==<!--my comment #color/gold-->`
            -   universal but harder to implement
    -   color syntax
        -   `@blue`
            -   no conflict with other tags
        -   `#blue`
            -   simple
        -   `#color/gold`
            -   explicit
        -   `#question` - associate tag with color in settings
    -   draw selection, show popover at mouseup position or in margins if enough space but dont cover selection.
    -   first step: add colors, second: notes, third: editing
    -   clicking colors again removes highlight and note
-   comments
-   chat, prompts
-   shortcuts, commands
-   copy, extract highlight
    -   takes selection and inserts as quote with note text below it

## Notebook

-   curating and using highlights across files
    -   ~~datacore https://github.com/blacksmithgu/datacore~~~~
        -   not possible because Obsidian doesn't cache on sentence level
-   spaced repetition learning

## Roadmap

-   [ ] decision on syntax
-   [ ] api to CRUD highlights from both source and preview mode. ui needs to come second
-   [ ] api to query highlights + footnotes

## Open Questions

-   does active reading fall into the reading or writing category?
-   do highlight colors have semantic meaning?
