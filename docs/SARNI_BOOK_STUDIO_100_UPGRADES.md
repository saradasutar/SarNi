# SarNi Book Studio — 100-upgrade master plan

**Plan status:** proposed; this file does NOT deploy the features below. No production data, books, chapters, credentials, Apps Script deployments or schemas have been modified by this roadmap.

**Release strategy:** P0 data audit and backup → P1 library/editor/planning improvements → P2 publishing and optional advanced services. Do not bulk-enable 100 features at once. Each stage requires tests, backups, rollback and core-function regression checks. Preserve current Book IDs, BookChapter IDs and current sheet names. No additional spreadsheet or folder by default.

**Critical prerequisite:** Before structural work, diagnose why existing chapters of a previously saved manuscript are not visible. Query existing Books and BookChapters, including inactive and orphan records, using authorized read-only diagnostics. Never auto-reactivate or create replacement records from a title match alone.

## A. Data integrity and recovery — P0

1. Read-only missing-chapter diagnostics covering BookId, Active, owner and record counts.
2. Preview inactive chapters before any selective restore.
3. Detect orphaned chapters whose BookId no longer matches a book.
4. Detect duplicate book IDs and ambiguous title matches without auto-merging.
5. Compare present chapter IDs with historical backups, without rewriting data.
6. Display data-health and chapter-count status on each book card.
7. Return and display stable save receipts containing book/chapter IDs.
8. Detect concurrent edit conflicts and show text differences before resolution.
9. Store dated chapter snapshots before significant edits or migrations.
10. Provide audited, reversible recovery with explicit record-level confirmation.

## B. Library visualisation and discovery — P1

11. Grid, list and compact library view switch.
12. Sticky search and quick keyboard navigation through books.
13. Combined filters for genre, completion, owner and recent activity.
14. Clear color-coded status labels and a consistent visual hierarchy.
15. Optional lazy-loaded cover thumbnails rather than large startup images.
16. Series and collection shelves for related books.
17. Favorite books and pin most-used titles.
18. Recently edited books and one-click Continue Writing.
19. Mini progress strip with unfinished chapter count on each book.
20. Library overview with writing milestones and integrity indicators.

## C. Chapter organisation and planning — P1

21. Part > chapter > section hierarchy while preserving legacy chapter IDs.
22. Collapsible chapter tree with saved open/closed preferences.
23. Drag-to-reorder with undo and safe order validation.
24. Synopsis corkboard that mirrors manuscript order.
25. Outline table showing status, word count and due date.
26. Short chapter/scene synopses shown beside titles.
27. Split a long chapter into two with explicit content preview.
28. Merge chapters with reversible backup and confirmation.
29. Search across chapters and jump to highlighted matches.
30. Breadcrumb navigation from library to book, chapter and section.

## D. Comfortable manuscript editor — P1

31. Realistic page-width mode with optional page guides.
32. Side-by-side writing and research reference pane.
33. Typewriter scrolling to keep the active paragraph centered.
34. Focus mode that dims other paragraphs.
35. Named typography presets for screen, long-form reading and print.
36. Customizable keyboard shortcut cheatsheet.
37. Slash-command menu for inserting formatted structures.
38. Proper quote, callout, divider and scene-break elements.
39. Footnotes, endnotes and reference markers.
40. Responsive floating toolbar with accessible keyboard focus.

## E. Draft safety, versions and offline reliability — P0

41. Authenticated autosave drafts to existing backend, with opt-in versioning.
42. Idempotent offline draft queue with clear uncertainty handling.
43. Visible states: local draft, saving, saved, sync pending and conflict.
44. Restore scroll position and cursor after reopening a chapter.
45. Side-by-side compare of named manuscript versions.
46. Named milestones such as First Draft and Edited Draft.
47. Previous-session undo or restore from historical snapshots.
48. Soft lock while another authorized editor is changing the same chapter.
49. Save session notes separately from manuscript prose.
50. Automatic export/backup checkpoint before bulk operations.

## F. Memoir, family history and research — P1

51. Visual chronology of life events and life phases.
52. Decade-by-decade memoir planning template.
53. People directory with aliases and relationships.
54. Places register with map references and context.
55. Link historical events to chapter notes and sources.
56. Photo reference gallery with Drive originals and lightweight previews.
57. Interview notes with speaker, date and recording reference.
58. Source provenance, citations and fact confidence labels.
59. Memory prompts for childhood, schooling, work, family and retirement.
60. Relationship map connecting people, places, events and chapters.

## G. Editing quality and multilingual writing — P2

61. Repeated phrase finder and consistency report.
62. Filler word and excessive adverb indicators.
63. Optional passive-voice and sentence-length suggestions.
64. Readability view for the current chapter and full manuscript.
65. Consistency checker for names, dates and places.
66. Chapter summaries for editorial planning, clearly non-authoritative.
67. Tense and point-of-view review checklist.
68. Personalized glossary and preferred spelling dictionary.
69. Optional AI proofread suggestions with original writing preserved.
70. English/Odia parallel text sections and Unicode-friendly typography.

## H. Writing goals and momentum — P1

71. Separate daily, weekly, chapter and total manuscript targets.
72. Writing streak calendar with grace-day settings.
73. Focused writing session log and session summaries.
74. Year-at-a-glance writing activity heatmap.
75. Weekly writing-review prompt with accomplishments and next steps.
76. Milestone checklist for outline, draft, revise, proof and publish.
77. Estimated completion date using recent writing pace, labeled as estimate.
78. Chapter-level deadlines with optional reminders.
79. Configurable Pomodoro/focus timer with pause/resume.
80. Historical writing charts that distinguish new words from edits.

## I. Collaboration, privacy and publishing access — P0/P2

81. Book/chapter access rights enforced in Apps Script, not by hiding buttons.
82. Expiring, revocable read-only chapter preview links.
83. Comments anchored to selected text ranges.
84. Suggestion mode with accept/reject workflow.
85. Attributed change history and collaborator comparison.
86. Invite-only beta reader portal with feedback summaries.
87. Approve excerpts for sharing without exposing whole manuscripts.
88. Watermark or footer on private review exports.
89. Auditable sharing, editing, restoration and download events.
90. Private-by-default indexing and strict separation from public GitHub code.

## J. Production, publishing and quick-entry integration — P2

91. Compile chapters into one read-only manuscript preview.
92. Front-matter creator for title, dedication, acknowledgments and copyright.
93. Generated, updateable table of contents.
94. Professional layout presets for memoir, fiction and nonfiction.
95. Trim size, margins, running headers and pagination preview.
96. Print-ready PDF export.
97. Editable DOCX export with heading structures.
98. Validated EPUB export for ebook readers.
99. Device and print simulation with font/image overflow checks.
100. Secure Book Quick Entry sync into the existing register with explicit book selection, idempotency, and destination confirmation.

## Implementation progress — SarNi 13 (7 November 2026)

**Already committed to the GitHub frontend:** Calm Writer and local session safety copies (SarNi 12); book search, chapter word counters, writing themes, chapter outline and chapter text export (SarNi 11); library sorting (title, chapter count, word count), compact book listing, chapter search, chapter status filtering, live filtered counts, text table-of-contents export, passage selection word count, spellcheck toggle, back-to-editor navigation and display-only saved preferences (SarNi 13).

**Important:** This is not confirmation that all 100 features have shipped. The current code uses existing authorized `listBooks`, `bookDetail` and `saveChapter` routes and does not modify manuscript records. Live website acceptance testing remains necessary. Data recovery, durable server-side autosave, real version history, collaboration workflows, PDF/DOCX/EPUB publishing and backend-controlled share-link book saving have not been implemented by this frontend update.

**Safety hold:** Preserve all 18 existing chapters of *The Story Before Ours* (Book ID from live data), 2 chapters in *Coding Book*, and existing empty *Always a Struggler* book. Do not migrate or relink chapter IDs based on manuscript titles.

## Reference product documentation

- [Scrivener](https://www.literatureandlatte.com/scrivener/overview)
- [Reedsy Studio](https://reedsy.com/studio/)
- [Atticus](https://www.atticus.io/)
- [Ulysses goals](https://help.ulysses.app/goals)
- [Plottr features](https://plottr.com/features/)
- [LivingWriter features](https://livingwriter.com/en/product)
- [Notion history](https://www.notion.com/help/duplicate-delete-and-restore-content)
- [Hemingway Editor](https://hemingwayapp.com/)
- [Grammarly features](https://www.grammarly.com/features)
- [Sudowrite documentation](https://docs.sudowrite.com/getting-started/dQph1snuwbfMWG9wRjsNug/features/dq7YUMNy5ZMvKUJiRAisyT)

Feature ideas are adapted concepts, not product integrations or exact copies of competitor designs.

## Acceptance criteria

1. Existing book/chapter records are counted and compared before/after each release.
2. All Book Writing save/list/detail and quick-entry flows remain working, including on mobile.
3. No manuscript text, secret link tokens or personal data are committed to the public repository.
4. All save routes enforce server-side authorization and return verifiable record identifiers.
5. Each release has a rollback path; backend migrations require a verified backup first.
6. The first meaningful paint target is ~2 seconds on typical repeat visits where feasible; backend save latency is measured separately.
