# Prompt — scrub proprietary / real-world names from a prototype

Paste this prompt at the start of any chat (in any project / file) when you want me
to do the same name-scrub Maegan asked for here. Edit the bracketed bits before sending.

---

## Prompt to paste

> I need to make sure this prototype contains no proprietary or real-world names
> before we share it externally. Please do the following:
>
> **1. Find and replace every instance of these categories of names with obviously-fictional placeholders, across ALL files in the project (JSX, HTML, MD, CSS — everything).**
>
> - **Proprietary services / indexes / utilities** (e.g. DTCC, NSCC, Russell 1000, S&P 500, Morningstar, Bloomberg, FactSet). Either remove these mentions entirely or swap to a generic equivalent like "the clearing utility", "a broad market index", "a market-data provider".
> - **Firms / wirehouses / broker-dealers / RIAs / banks** (anything that looks like a real firm name). Swap to the standard Microsoft-style placeholder family so it reads as obviously fake:
>   - Contoso Wealth · Fabrikam Financial · Northwind Securities · Adatum Partners · Litware Advisors · Tailspin Capital · Proseware Group · Wingtip RIA · Trey Trust
> - **End-client team / household names** (e.g. "The Hartwell Wealth Mgmt", "Graystone Consulting"). Swap to generic placeholders: "The Doe Wealth Group", "The Smith Group", "Roe Partners", "The Brown Group", "Sample Consulting", "Doe & Roe Advisors".
> - **Individual people** (financial advisors, sales reps, clients, prospects). Swap to placeholder personal names: John Doe, Jane Doe, John Smith, Jane Smith, John Roe, Jane Roe, Mary Doe, Mark Smith, Robert Jones, Linda Jones, Michael Brown, Emily Brown, Sarah Roe, Pat Public, Chris Public, Alex Sample, Sam Sample.
>
> **2. Rules of engagement:**
>
> - Do a **global search** first — grep every file for the names so nothing is missed. Don't trust a single file scan.
> - Replace via a script (one atomic pass), not one edit at a time — that way long names are swapped before short substrings that overlap them.
> - Order replacements **longest-first** to avoid partial overwrites (e.g. replace "The Parks Group II" before "The Parks Group").
> - When a renamed item has a derived value somewhere else (badge initials like `CC` for Crestwood Capital, file paths, IDs, code variable names), update those too so the prototype stays consistent.
> - Keep the mapping **stable**: every occurrence of "Foo Capital" should become the same placeholder everywhere — don't randomize.
> - **Do not** invent new categories of content. Just scrub the names; leave the data, layout, and narrative alone.
> - When done, re-grep for the original strings and confirm zero hits in source files. (Compressed/binary bundles like a `.html` offline export are fine to ignore — flag them so they can be re-exported later.)
>
> **3. Deliverable:** a short summary listing exactly which strings were swapped to what, and which files were touched. No need to ask me to confirm names mid-flow — just pick from the placeholder family above.

---

## Why these placeholders

The Contoso / Fabrikam / Northwind family is Microsoft's standard set of fictional-company
names used in their docs and demos. Anyone in tech / finance who sees them immediately
reads them as placeholders, which is exactly what you want for a sales-tool prototype.

Doe / Smith / Roe / Brown / Public / Sample is the legal world's standard
placeholder-person convention (John Doe is a court system fixture). Same effect: nobody
mistakes them for a real person.

## Mapping used in this project (for reference)

**Firms**

| Old | New | Badge |
|---|---|---|
| Crestwood Capital | Contoso Wealth | CW |
| Stonebridge | Northwind Securities | NS |
| Northpeak Financial | Fabrikam Financial | FF |
| Meridian Partners | Adatum Partners | AP |
| Cascade Advisors | Litware Advisors | LA |
| Harbor Point | Tailspin Capital | TC |
| Vantage Group | Proseware Group | PG |
| Summit Ridge | Wingtip RIA | WR |
| Atlas Trust | Trey Trust | TT |

**Client teams / households**

| Old | New |
|---|---|
| The Hartwell Wealth Mgmt (and "Polk Wealth Mgmt") | The Doe Wealth Group |
| The Parks Group | The Smith Group |
| The Parks Group II | The Smith Group II |
| Justin Furstenberg | Jane Smith |
| Davos and Peters | Doe & Roe Advisors |
| Graystone Consulting | Sample Consulting |
| Alpine Partners | Roe Partners |
| The Brice Group | The Brown Group |

**Internal advisor team (inside The Doe Wealth Group)**

| Old | New |
|---|---|
| Lyon Hartwell | John Doe |
| Sandra Mercer | Mary Doe |
| Derek Lim | John Smith |

**Sales reps**

| Old | New |
|---|---|
| Tyler Ryan | John Doe |
| David Chen | Jane Doe |
| Amanda Torres | John Smith |
| Rachel Foster | Jane Smith |
| James Thompson | John Roe |
| Marcus Webb | Jane Roe |
| Erica Wong | Mary Doe |
| Brandon Hill | Mark Smith |
| Sophia Ng | Sarah Roe |
| Kareem Jackson | Michael Brown |
| Olivia Martin | Emily Brown |
| Lisa Patel | Robert Jones |
| Priya Shah | Linda Jones |
| Devon Ramirez | Chris Public |
| Tomás Vega | Pat Public |
| Mei Lin | Alex Sample |
| Aaron Park | Sam Sample |
