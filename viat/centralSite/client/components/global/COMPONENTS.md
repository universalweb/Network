# UWC Component Catalogue

**GENERATED FILE — do not hand-edit.** Regenerate with `pnpm run build:catalog`.
Every column below is derived from the tree, so this file cannot drift from reality
the way the hand-written manifest did (it claimed 113 components against a tree of
262). Priorities and roadmap live on the engram task board, not here.

Scope: the **framework** surface only — `components/global/` plus the built-ins
registered inside `components/core/`. App components under `components/user/` are
out of scope, as are test probes and the perf/shootout harnesses.

Generated 2026-09-06.

| Count | |
| --- | --- |
| Registered tags | **263** (262 in `global/` · 1 core built-in) |
| — alias presets | 7 (a second tag on an existing engine — see `CATALOG_ALIASES`) |
| **Distinct components** | **256** |

## Coverage

| Signal | Covered | Share |
| --- | --- | --- |
| Has a test | 138 / 263 | 52% |
| In the preview catalog | 262 / 263 | 100% |
| Has a description comment | 231 / 263 | 88% |
| Has a stylesheet | 248 / 263 | 94% |

## Work queue — 140 components with gaps

Ordered by number of gaps, then by size (bigger components carry more risk).
A component is "done" when it has a test, a preview entry, and a description comment.

| Component | Lines | Missing |
| --- | --- | --- |
| `<ui-tooltip>` | 164 | preview · docs |
| `<ui-command-item>` | 142 | tests · docs |
| `<ui-menu-item>` | 133 | tests · docs |
| `<boot-screen>` | 120 | tests · docs |
| `<ui-notification-item>` | 115 | tests · docs |
| `<ui-json-row>` | 90 | tests · docs |
| `<ui-vote-item>` | 81 | tests · docs |
| `<ui-notification-center-item>` | 71 | tests · docs |
| `<ui-control-center-tile>` | 63 | tests · docs |
| `<ui-control-center-row>` | 57 | tests · docs |
| `<ui-skeleton>` | 52 | tests · docs |
| `<ui-poll-option>` | 50 | tests · docs |
| `<ui-toggle-option>` | 49 | tests · docs |
| `<ui-speed-dial-action>` | 48 | tests · docs |
| `<ui-carousel-slide>` | 40 | tests · docs |
| `<ui-spinner>` | 29 | tests · docs |
| `<ui-radio-option>` | 25 | tests · docs |
| `<ui-dock-icon-button>` | 9 | tests · docs |
| `<ui-bar-chart>` | 614 | tests |
| `<ui-command>` | 560 | docs |
| `<ui-line-chart>` | 559 | tests |
| `<ui-nav-section>` | 559 | tests |
| `<ui-heatmap>` | 546 | tests |
| `<ui-ai-chat>` | 542 | tests |
| `<ui-color-picker>` | 515 | tests |
| `<ui-scatter-chart>` | 509 | tests |
| `<ui-task-column>` | 508 | tests |
| `<ui-map-opensky>` | 390 | tests |
| `<ui-radar-chart>` | 369 | tests |
| `<ui-calendar>` | 331 | tests |
| `<ui-cascade-select>` | 322 | tests |
| `<ui-modal>` | 314 | docs |
| `<ui-task-card>` | 310 | tests |
| `<ui-pie-chart>` | 304 | tests |
| `<ui-tree-table>` | 276 | tests |
| `<ui-tree-table-row>` | 276 | tests |
| `<ui-pin-input>` | 266 | tests |
| `<ui-questionnaire>` | 265 | tests |
| `<ui-popover>` | 254 | tests |
| `<ui-ternary-state>` | 245 | tests |
| `<ui-button>` | 223 | docs |
| `<ui-tag-input>` | 207 | tests |
| `<ui-resizable>` | 203 | tests |
| `<ui-toast>` | 195 | tests |
| `<ui-tri-state-checkbox>` | 188 | tests |
| `<ui-gauge>` | 184 | tests |
| `<ui-dock>` | 177 | tests |
| `<ui-tab-button>` | 175 | docs |
| `<ui-ai-scroll-bottom>` | 166 | tests |
| `<ui-stat-table>` | 162 | docs |
| `<ui-input>` | 159 | docs |
| `<ui-nav-trigger>` | 157 | tests |
| `<ui-message>` | 154 | tests |
| `<ui-pagination>` | 154 | tests |
| `<ui-sparkline>` | 145 | tests |
| `<app-shell>` | 143 | tests |
| `<ui-poll>` | 141 | tests |
| `<ui-vote-tally>` | 137 | tests |
| `<ui-ai-export>` | 130 | tests |
| `<ui-stepper>` | 129 | tests |
| `<ui-toast-item>` | 120 | tests |
| `<ui-hover-video-player>` | 116 | tests |
| `<ui-typewriter>` | 116 | tests |
| `<ui-image>` | 112 | tests |
| `<ui-app-bar>` | 109 | tests |
| `<ui-chip>` | 108 | tests |
| `<ui-number-stepper>` | 107 | tests |
| `<ui-alert-dialog>` | 104 | tests |
| `<ui-fieldset>` | 104 | tests |
| `<ui-nav-pane>` | 104 | tests |
| `<ui-ai-tool-call>` | 100 | tests |
| `<ui-radio-group>` | 99 | tests |
| `<ui-icon>` | 98 | docs |
| `<ui-ai-inquire>` | 97 | tests |
| `<ui-scheduler-event>` | 95 | tests |
| `<ui-ai-settings>` | 94 | tests |
| `<ui-ai-approval>` | 92 | tests |
| `<ui-spark-track>` | 90 | tests |
| `<ui-ai-suggestions>` | 89 | tests |
| `<ui-cart>` | 89 | tests |
| `<ui-ai-usage>` | 87 | tests |
| `<ui-timeline>` | 86 | tests |
| `<ui-card>` | 85 | tests |
| `<ui-ai-error>` | 82 | tests |
| `<ui-text-message>` | 80 | tests |
| `<ui-message-scroller>` | 79 | tests |
| `<ui-ai-message-actions>` | 77 | tests |
| `<ui-status-indicator>` | 76 | tests |
| `<ui-result-rows>` | 73 | tests |
| `<ui-bar-list>` | 72 | tests |
| `<ui-expandable-card>` | 71 | tests |
| `<ui-theme-select>` | 71 | docs |
| `<ui-ai-search>` | 70 | tests |
| `<ui-badge>` | 69 | docs |
| `<ui-panel>` | 67 | docs |
| `<ui-whitebox-modal>` | 66 | tests |
| `<ui-cart-item>` | 65 | tests |
| `<ui-ai-sources>` | 64 | tests |
| `<ui-alert>` | 64 | tests |
| `<ui-image-list>` | 64 | tests |
| `<ui-checkout-summary>` | 63 | tests |
| `<ui-ai-feedback>` | 62 | tests |
| `<ui-ai-plan>` | 62 | tests |
| `<ui-floating-panel>` | 61 | tests |
| `<ui-morph-drawer>` | 61 | tests |
| `<ui-empty-state>` | 59 | docs |
| `<ui-input-group>` | 58 | tests |
| `<ui-ai-reasoning>` | 57 | tests |
| `<ui-fab>` | 57 | tests |
| `<ui-loading-screen>` | 57 | docs |
| `<ui-swatch>` | 57 | tests |
| `<ui-ai-identity>` | 51 | tests |
| `<ui-ai-new-messages>` | 50 | tests |
| `<ui-text>` | 49 | docs |
| `<ui-accordion>` | 48 | tests |
| `<ui-image-cell>` | 48 | tests |
| `<ui-aspect-ratio>` | 47 | tests |
| `<ui-loading-bar>` | 45 | tests |
| `<ui-table-cell>` | 43 | tests |
| `<ui-table-row>` | 43 | tests |
| `<ui-ai-model-select>` | 41 | tests |
| `<ui-surface>` | 36 | docs |
| `<ui-status-bar>` | 35 | tests |
| `<ui-ai-typing>` | 34 | tests |
| `<ui-button-group>` | 34 | tests |
| `<ui-scheduler-day>` | 34 | tests |
| `<ui-field-group>` | 33 | tests |
| `<ui-label>` | 32 | tests |
| `<ui-status-cell>` | 27 | tests |
| `<ui-native-select>` | 19 | tests |
| `<ui-loading-carousel>` | 18 | tests |
| `<ui-feature-carousel>` | 17 | tests |
| `<ui-separator>` | 17 | tests |
| `<ui-event-calendar>` | 14 | tests |
| `<ui-feature-poll>` | 14 | tests |
| `<ui-poll-widget>` | 14 | tests |
| `<ui-choice-poll>` | 13 | tests |
| `<ui-feature-voting>` | 13 | tests |
| `<ui-mini-calendar>` | 13 | tests |
| `<ui-range-calendar>` | 13 | tests |

## Built-in components

Registered inside the core runtime rather than the component tree — always present,
no import required.

| Tag | Class | Category | Test | Preview | Docs | Lines | File |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<ui-tooltip>` | UITooltip | built-in | ✅ | — | — | 164 | core/tooltips/tooltip.js |

## Full inventory

| Tag | Class | Category | Test | Preview | Docs | Lines | File |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<app-shell>` | AppShell | — | — | ✅ | ✅ | 143 | global/app-shell/app-shell.js |
| `<boot-screen>` | BootScreen | overlays | — | ✅ | — | 120 | global/boot-screen/boot-screen.js |
| `<ui-accordion>` | UIAccordion | layout | — | ✅ | ✅ | 48 | global/accordion/accordion.js |
| `<ui-ai-approval>` | UIAiApproval | ai | — | ✅ | ✅ | 92 | global/ai-approval/ai-approval.js |
| `<ui-ai-chat>` | UIAiChat | ai | — | ✅ | ✅ | 542 | global/ai-chat/ai-chat.js |
| `<ui-ai-error>` | UIAiError | ai | — | ✅ | ✅ | 82 | global/ai-error/ai-error.js |
| `<ui-ai-export>` | UIAiExport | ai | — | ✅ | ✅ | 130 | global/ai-export/ai-export.js |
| `<ui-ai-feedback>` | UIAiFeedback | ai | — | ✅ | ✅ | 62 | global/ai-feedback/ai-feedback.js |
| `<ui-ai-identity>` | UIAiIdentity | ai | — | ✅ | ✅ | 51 | global/ai-identity/ai-identity.js |
| `<ui-ai-inquire>` | UIAiInquire | ai | — | ✅ | ✅ | 97 | global/ai-inquire/ai-inquire.js |
| `<ui-ai-message>` | UIAiMessage | ai | ✅ | ✅ | ✅ | 145 | global/ai-message/ai-message.js |
| `<ui-ai-message-actions>` | UIAiMessageActions | ai | — | ✅ | ✅ | 77 | global/ai-message-actions/ai-message-actions.js |
| `<ui-ai-model-select>` | UIAiModelSelect | ai | — | ✅ | ✅ | 41 | global/ai-model-select/ai-model-select.js |
| `<ui-ai-new-messages>` | UIAiNewMessages | ai | — | ✅ | ✅ | 50 | global/ai-new-messages/ai-new-messages.js |
| `<ui-ai-plan>` | UIAiPlan | ai | — | ✅ | ✅ | 62 | global/ai-plan/ai-plan.js |
| `<ui-ai-reasoning>` | UIAiReasoning | ai | — | ✅ | ✅ | 57 | global/ai-reasoning/ai-reasoning.js |
| `<ui-ai-scroll-bottom>` | UIAiScrollBottom | ai | — | ✅ | ✅ | 166 | global/ai-scroll-bottom/ai-scroll-bottom.js |
| `<ui-ai-search>` | UIAiSearch | ai | — | ✅ | ✅ | 70 | global/ai-search/ai-search.js |
| `<ui-ai-settings>` | UIAiSettings | ai | — | ✅ | ✅ | 94 | global/ai-settings/ai-settings.js |
| `<ui-ai-sources>` | UIAiSources | ai | — | ✅ | ✅ | 64 | global/ai-sources/ai-sources.js |
| `<ui-ai-suggestions>` | UIAiSuggestions | ai | — | ✅ | ✅ | 89 | global/ai-suggestions/ai-suggestions.js |
| `<ui-ai-tool-call>` | UIAiToolCall | ai | — | ✅ | ✅ | 100 | global/ai-tool-call/ai-tool-call.js |
| `<ui-ai-typing>` | UIAiTyping | ai | — | ✅ | ✅ | 34 | global/ai-typing/ai-typing.js |
| `<ui-ai-usage>` | UIAiUsage | ai | — | ✅ | ✅ | 87 | global/ai-usage/ai-usage.js |
| `<ui-alert>` | UIAlert | feedback | — | ✅ | ✅ | 64 | global/alert/alert.js |
| `<ui-alert-dialog>` | UIAlertDialog | overlays | — | ✅ | ✅ | 104 | global/alert-dialog/alert-dialog.js |
| `<ui-animated-number>` | UIAnimatedNumber | data | ✅ | ✅ | ✅ | 101 | global/animated-number/animated-number.js |
| `<ui-app-bar>` | UIAppBar | shell | — | ✅ | ✅ | 109 | global/app-bar/app-bar.js |
| `<ui-aspect-ratio>` | UIAspectRatio | layout | — | ✅ | ✅ | 47 | global/aspect-ratio/aspect-ratio.js |
| `<ui-attachment>` | UIAttachment | files | ✅ | ✅ | ✅ | 232 | global/attachment/attachment.js |
| `<ui-audio-player>` | UIAudioPlayer | media | ✅ | ✅ | ✅ | 168 | global/audio-player/audio-player.js |
| `<ui-avatar>` | UIAvatar | data | ✅ | ✅ | ✅ | 210 | global/avatar/avatar.js |
| `<ui-badge>` | UIBadge | feedback | ✅ | ✅ | — | 69 | global/badge/badge.js |
| `<ui-bar>` | UIBar | layout | ✅ | ✅ | ✅ | 47 | global/bar/bar.js |
| `<ui-bar-chart>` | UIBarChart | charts | — | ✅ | ✅ | 614 | global/bar-chart/bar-chart.js |
| `<ui-bar-list>` | UIBarList | data | — | ✅ | ✅ | 72 | global/bar-list/bar-list.js |
| `<ui-breadcrumbs>` | UIBreadcrumbs | shell | ✅ | ✅ | ✅ | 80 | global/breadcrumbs/breadcrumbs.js |
| `<ui-button>` | UIButton | actions | ✅ | ✅ | — | 223 | global/button/button.js |
| `<ui-button-group>` | UIButtonGroup | actions | — | ✅ | ✅ | 34 | global/button-group/button-group.js |
| `<ui-calendar>` | UICalendar | forms | — | ✅ | ✅ | 331 | global/calendar/calendar.js |
| `<ui-card>` | UICard | layout | — | ✅ | ✅ | 85 | global/card/card.js |
| `<ui-carousel>` | UICarousel | media | ✅ | ✅ | ✅ | 385 | global/carousel/carousel.js |
| `<ui-carousel-slide>` | UICarouselSlide | media | — | ✅ | — | 40 | global/carousel-slide/carousel-slide.js |
| `<ui-cart>` | UICart | shop | — | ✅ | ✅ | 89 | global/cart/cart.js |
| `<ui-cart-item>` | UICartItem | shop | — | ✅ | ✅ | 65 | global/cart-item/cart-item.js |
| `<ui-cascade-select>` | UICascadeSelect | forms | — | ✅ | ✅ | 322 | global/cascade-select/cascade-select.js |
| `<ui-changelog>` | UIChangelog | data | ✅ | ✅ | ✅ | 80 | global/changelog/changelog.js |
| `<ui-changelog-group>` | UIChangelogGroup | data | ✅ | ✅ | ✅ | 70 | global/changelog-group/changelog-group.js |
| `<ui-changelog-release>` | UIChangelogRelease | data | ✅ | ✅ | ✅ | 100 | global/changelog-release/changelog-release.js |
| `<ui-checkbox>` | UICheckbox | forms | ✅ | ✅ | ✅ | 325 | global/checkbox/checkbox.js |
| `<ui-checkout-summary>` | UICheckoutSummary | shop | — | ✅ | ✅ | 63 | global/checkout-summary/checkout-summary.js |
| `<ui-chip>` | UIChip | data | — | ✅ | ✅ | 108 | global/chip/chip.js |
| `<ui-choice-poll>` | UIChoicePoll | data | — | ✅ | ✅ | 13 | global/choice-poll/choice-poll.js |
| `<ui-close-button>` | UICloseButton | actions | ✅ | ✅ | ✅ | 38 | global/close-button/close-button.js |
| `<ui-code-block>` | UICodeBlock | data | ✅ | ✅ | ✅ | 83 | global/code-block/code-block.js |
| `<ui-collapsible>` | UICollapsible | layout | ✅ | ✅ | ✅ | 119 | global/collapsible/collapsible.js |
| `<ui-collection>` | UICollection | data | ✅ | ✅ | ✅ | 1027 | global/collection/collection.js |
| `<ui-collection-item>` | UICollectionItem | data | ✅ | ✅ | ✅ | 177 | global/collection-item/collection-item.js |
| `<ui-color-picker>` | UIColorPicker | forms | — | ✅ | ✅ | 515 | global/color-picker/color-picker.js |
| `<ui-combobox>` | UICombobox | forms | ✅ | ✅ | ✅ | 259 | global/combobox/combobox.js |
| `<ui-combobox-option>` | UIComboboxOption | forms | ✅ | ✅ | ✅ | 42 | global/combobox-option/combobox-option.js |
| `<ui-command>` | UICommand | overlays | ✅ | ✅ | — | 560 | global/command/command.js |
| `<ui-command-item>` | UICommandItem | overlays | — | ✅ | — | 142 | global/command-item/command-item.js |
| `<ui-comment>` | UIComment | feedback | ✅ | ✅ | ✅ | 201 | global/comment/comment.js |
| `<ui-comment-section>` | UICommentSection | feedback | ✅ | ✅ | ✅ | 420 | global/comment-section/comment-section.js |
| `<ui-compare>` | UICompare | media | ✅ | ✅ | ✅ | 305 | global/compare/compare.js |
| `<ui-context-menu>` | UIContextMenu | overlays | ✅ | ✅ | ✅ | 295 | global/context-menu/context-menu.js |
| `<ui-control-center>` | UIControlCenter | overlays | ✅ | ✅ | ✅ | 246 | global/control-center/control-center.js |
| `<ui-control-center-row>` | ControlCenterRow | overlays | — | ✅ | — | 57 | global/control-center-row/control-center-row.js |
| `<ui-control-center-tile>` | ControlCenterTile | overlays | — | ✅ | — | 63 | global/control-center-tile/control-center-tile.js |
| `<ui-date-input>` | UIDateInput | forms | ✅ | ✅ | ✅ | 68 | global/date-input/date-input.js |
| `<ui-detail-list>` | UIDetailList | data | ✅ | ✅ | ✅ | 92 | global/detail-list/detail-list.js |
| `<ui-divider>` | UIDivider | layout | ✅ | ✅ | ✅ | 54 | global/divider/divider.js |
| `<ui-dock>` | UIDock | shell | — | ✅ | ✅ | 177 | global/dock/dock.js |
| `<ui-dock-icon-button>` | DockIconButton | shell | — | ✅ | — | 9 | global/dock-icon-button/dock-icon-button.js |
| `<ui-empty-state>` | UIEmptyState | feedback | ✅ | ✅ | — | 59 | global/empty-state/empty-state.js |
| `<ui-event-calendar>` | UIEventCalendar | data | — | ✅ | ✅ | 14 | global/event-calendar/event-calendar.js |
| `<ui-expandable-card>` | UIExpandableCard | overlays | — | ✅ | ✅ | 71 | global/expandable-card/expandable-card.js |
| `<ui-fab>` | UIFab | actions | — | ✅ | ✅ | 57 | global/fab/fab.js |
| `<ui-feature-carousel>` | UIFeatureCarousel | media | — | ✅ | ✅ | 17 | global/feature-carousel/feature-carousel.js |
| `<ui-feature-poll>` | UIFeaturePoll | data | — | ✅ | ✅ | 14 | global/feature-poll/feature-poll.js |
| `<ui-feature-voting>` | UIFeatureVoting | data | — | ✅ | ✅ | 13 | global/feature-voting/feature-voting.js |
| `<ui-field>` | UIField | forms | ✅ | ✅ | ✅ | 130 | global/field/field.js |
| `<ui-field-group>` | UIFieldGroup | forms | — | ✅ | ✅ | 33 | global/field-group/field-group.js |
| `<ui-fieldset>` | UIFieldset | forms | — | ✅ | ✅ | 104 | global/fieldset/fieldset.js |
| `<ui-file-upload>` | UIFileUpload | files | ✅ | ✅ | ✅ | 297 | global/file-upload/file-upload.js |
| `<ui-file-upload-item>` | UIFileUploadItem | files | ✅ | ✅ | ✅ | 179 | global/file-upload-item/file-upload-item.js |
| `<ui-filter-bar>` | UIFilterBar | forms | ✅ | ✅ | ✅ | 124 | global/filter-bar/filter-bar.js |
| `<ui-filter-bar-item>` | UIFilterBarItem | forms | ✅ | ✅ | ✅ | 233 | global/filter-bar-item/filter-bar-item.js |
| `<ui-floating-panel>` | UIFloatingPanel | overlays | — | ✅ | ✅ | 61 | global/floating-panel/floating-panel.js |
| `<ui-gallery>` | UIGallery | media | ✅ | ✅ | ✅ | 373 | global/gallery/gallery.js |
| `<ui-gallery-thumb>` | UIGalleryThumb | media | ✅ | ✅ | ✅ | 118 | global/gallery-thumb/gallery-thumb.js |
| `<ui-gauge>` | UIGauge | charts | — | ✅ | ✅ | 184 | global/gauge/gauge.js |
| `<ui-go-to>` | UIGoTo | actions | ✅ | ✅ | ✅ | 1385 | global/go-to/go-to.js |
| `<ui-grid>` | UIGrid | layout | ✅ | ✅ | ✅ | 69 | global/grid/grid.js |
| `<ui-heatmap>` | UIHeatmap | data | — | ✅ | ✅ | 546 | global/heatmap/heatmap.js |
| `<ui-hover-card>` | UIHoverCard | overlays | ✅ | ✅ | ✅ | 161 | global/hover-card/hover-card.js |
| `<ui-hover-video-player>` | UIHoverVideoPlayer | media | — | ✅ | ✅ | 116 | global/hover-video-player/hover-video-player.js |
| `<ui-icon>` | UIIcon | typography | ✅ | ✅ | — | 98 | global/icon/icon.js |
| `<ui-icon-button>` | IconButtonBase → UIIconButton | typography | ✅ | ✅ | ✅ | 100 | global/icon-button/icon-button.js |
| `<ui-image>` | UIImage | media | — | ✅ | ✅ | 112 | global/image/image.js |
| `<ui-image-cell>` | UIImageCell | media | — | ✅ | ✅ | 48 | global/image-cell/image-cell.js |
| `<ui-image-list>` | UIImageList | media | — | ✅ | ✅ | 64 | global/image-list/image-list.js |
| `<ui-input>` | UIInput | forms | ✅ | ✅ | — | 159 | global/input/input.js |
| `<ui-input-group>` | UIInputGroup | forms | — | ✅ | ✅ | 58 | global/input-group/input-group.js |
| `<ui-invert-arrow>` | UIInvertArrow | actions | ✅ | ✅ | ✅ | 47 | global/invert-arrow/invert-arrow.js |
| `<ui-json-inspector>` | UIJsonInspector | data | ✅ | ✅ | ✅ | 312 | global/json-inspector/json-inspector.js |
| `<ui-json-row>` | UIJsonRow | data | — | ✅ | — | 90 | global/json-row/json-row.js |
| `<ui-kbd>` | UIKbd | typography | ✅ | ✅ | ✅ | 96 | global/kbd/kbd.js |
| `<ui-label>` | UILabel | forms | — | ✅ | ✅ | 32 | global/label/label.js |
| `<ui-legend>` | UILegend | data | ✅ | ✅ | ✅ | 127 | global/legend/legend.js |
| `<ui-line-chart>` | UILineChart | charts | — | ✅ | ✅ | 559 | global/line-chart/line-chart.js |
| `<ui-listbox>` | UIListbox | forms | ✅ | ✅ | ✅ | 426 | global/listbox/listbox.js |
| `<ui-loading-bar>` | UILoadingBar | feedback | — | ✅ | ✅ | 45 | global/loading-bar/loading-bar.js |
| `<ui-loading-carousel>` | UILoadingCarousel | media | — | ✅ | ✅ | 18 | global/loading-carousel/loading-carousel.js |
| `<ui-loading-screen>` | UILoadingScreen | overlays | ✅ | ✅ | — | 57 | global/loading-screen/loading-screen.js |
| `<ui-login>` | UILogin | forms | ✅ | ✅ | ✅ | 85 | global/login/login.js |
| `<ui-map>` | UIMap | maps | ✅ | ✅ | ✅ | 1613 | global/map/map.js |
| `<ui-map-google>` | UIMapGoogle | maps | ✅ | ✅ | ✅ | 1517 | global/map-google/map-google.js |
| `<ui-map-leaflet>` | UIMapLeaflet | maps | ✅ | ✅ | ✅ | 973 | global/map-leaflet/map-leaflet.js |
| `<ui-map-openlayers>` | UIMapOpenLayers | maps | ✅ | ✅ | ✅ | 889 | global/map-openlayers/map-openlayers.js |
| `<ui-map-opensky>` | UIMapOpensky | maps | — | ✅ | ✅ | 390 | global/map-opensky/map-opensky.js |
| `<ui-map-openstreetmap>` | UIMapOpenStreetMap | maps | ✅ | ✅ | ✅ | 237 | global/map-openstreetmap/map-openstreetmap.js |
| `<ui-masonry>` | UIMasonry | layout | ✅ | ✅ | ✅ | 68 | global/masonry/masonry.js |
| `<ui-media-lightbox>` | UIMediaLightbox | media | ✅ | ✅ | ✅ | 403 | global/media-lightbox/media-lightbox.js |
| `<ui-media-stage>` | UIMediaStage | media | ✅ | ✅ | ✅ | 211 | global/media-stage/media-stage.js |
| `<ui-media-toolbar>` | UIMediaToolbar | media | ✅ | ✅ | ✅ | 110 | global/media-toolbar/media-toolbar.js |
| `<ui-menu>` | UIMenu | overlays | ✅ | ✅ | ✅ | 424 | global/menu/menu.js |
| `<ui-menu-item>` | UIMenuItem | overlays | — | ✅ | — | 133 | global/menu-item/menu-item.js |
| `<ui-menubar>` | UIMenubar | overlays | ✅ | ✅ | ✅ | 380 | global/menubar/menubar.js |
| `<ui-menubar-pane>` | UIMenubarPane | overlays | ✅ | ✅ | ✅ | 53 | global/menubar/menubar-pane.js |
| `<ui-message>` | UIMessage | feedback | — | ✅ | ✅ | 154 | global/message/message.js |
| `<ui-message-scroller>` | UIMessageScroller | feedback | — | ✅ | ✅ | 79 | global/message-scroller/message-scroller.js |
| `<ui-meta-list>` | UIMetaList | data | ✅ | ✅ | ✅ | 82 | global/meta-list/meta-list.js |
| `<ui-meter-group>` | UIMeterGroup | data | ✅ | ✅ | ✅ | 300 | global/meter-group/meter-group.js |
| `<ui-metric>` | UIMetric | data | ✅ | ✅ | ✅ | 80 | global/metric/metric.js |
| `<ui-mini-calendar>` | UIMiniCalendar | data | — | ✅ | ✅ | 13 | global/mini-calendar/mini-calendar.js |
| `<ui-modal>` | UIModal | overlays | ✅ | ✅ | — | 314 | global/modal/modal.js |
| `<ui-morph-drawer>` | UIMorphDrawer | overlays | — | ✅ | ✅ | 61 | global/morph-drawer/morph-drawer.js |
| `<ui-multi-select>` | UIMultiSelect | forms | ✅ | ✅ | ✅ | 341 | global/multi-select/multi-select.js |
| `<ui-native-select>` | UINativeSelect | forms | — | ✅ | ✅ | 19 | global/native-select/native-select.js |
| `<ui-nav>` | UINav | shell | ✅ | ✅ | ✅ | 264 | global/nav/nav.js |
| `<ui-nav-group>` | UINavGroup | shell | ✅ | ✅ | ✅ | 114 | global/nav-group/nav-group.js |
| `<ui-nav-link>` | UINavLink | shell | ✅ | ✅ | ✅ | 108 | global/nav-link/nav-link.js |
| `<ui-nav-pane>` | UINavPane | shell | — | ✅ | ✅ | 104 | global/nav-pane/nav-pane.js |
| `<ui-nav-section>` | UINavSection | overlays | — | ✅ | ✅ | 559 | global/nav-section/nav-section.js |
| `<ui-nav-trigger>` | UINavTrigger | shell | — | ✅ | ✅ | 157 | global/nav-trigger/nav-trigger.js |
| `<ui-notification>` | UINotification | overlays | ✅ | ✅ | ✅ | 229 | global/notification/notification.js |
| `<ui-notification-center-item>` | NotificationCenterItem | overlays | — | ✅ | — | 71 | global/notification-center-item/notification-center-item.js |
| `<ui-notification-item>` | NotificationItem | overlays | — | ✅ | — | 115 | global/notification-item/notification-item.js |
| `<ui-notification-panel>` | UINotificationPanel | overlays | ✅ | ✅ | ✅ | 250 | global/notification-panel/notification-panel.js |
| `<ui-number-stepper>` | UINumberStepper | forms | — | ✅ | ✅ | 107 | global/number-stepper/number-stepper.js |
| `<ui-order-item>` | UIOrderItem | data | ✅ | ✅ | ✅ | 353 | global/order-list/order-list.js |
| `<ui-order-list>` | UIOrderList | data | ✅ | ✅ | ✅ | 353 | global/order-list/order-list.js |
| `<ui-org-chart>` | UIOrgChart | data | ✅ | ✅ | ✅ | 223 | global/org-chart/org-chart.js |
| `<ui-org-node>` | UIOrgNode | data | ✅ | ✅ | ✅ | 223 | global/org-chart/org-chart.js |
| `<ui-pagination>` | UIPagination | actions | — | ✅ | ✅ | 154 | global/pagination/pagination.js |
| `<ui-panel>` | UIPanel | layout | ✅ | ✅ | — | 67 | global/panel/panel.js |
| `<ui-panel-header>` | UIPanelHeader | layout | ✅ | ✅ | ✅ | 45 | global/panel-header/panel-header.js |
| `<ui-parallax>` | UIParallax | layout | ✅ | ✅ | ✅ | 54 | global/parallax/parallax.js |
| `<ui-pick-item>` | UIPickItem | data | ✅ | ✅ | ✅ | 433 | global/pick-list/pick-list.js |
| `<ui-pick-list>` | UIPickList | data | ✅ | ✅ | ✅ | 433 | global/pick-list/pick-list.js |
| `<ui-pie-chart>` | UIPieChart | charts | — | ✅ | ✅ | 304 | global/pie-chart/pie-chart.js |
| `<ui-pin-input>` | UIPinInput | forms | — | ✅ | ✅ | 266 | global/pin-input/pin-input.js |
| `<ui-plus-minus>` | UIPlusMinus | actions | ✅ | ✅ | ✅ | 43 | global/plus-minus/plus-minus.js |
| `<ui-poll>` | UIPoll | forms | — | ✅ | ✅ | 141 | global/poll/poll.js |
| `<ui-poll-option>` | UIPollOption | forms | — | ✅ | — | 50 | global/poll-option/poll-option.js |
| `<ui-poll-widget>` | UIPollWidget | data | — | ✅ | ✅ | 14 | global/poll-widget/poll-widget.js |
| `<ui-popover>` | UIPopover | overlays | — | ✅ | ✅ | 254 | global/popover/popover.js |
| `<ui-price>` | UIPrice | shop | ✅ | ✅ | ✅ | 91 | global/price/price.js |
| `<ui-product-card>` | UIProductCard | shop | ✅ | ✅ | ✅ | 411 | global/product-card/product-card.js |
| `<ui-product-detail>` | UIProductDetail | shop | ✅ | ✅ | ✅ | 474 | global/product-detail/product-detail.js |
| `<ui-progress>` | UIProgress | feedback | ✅ | ✅ | ✅ | 316 | global/progress/progress.js |
| `<ui-progress-ring>` | UIProgressRing | feedback | ✅ | ✅ | ✅ | 324 | global/progress-ring/progress-ring.js |
| `<ui-pulldown>` | UIPullDown | overlays | ✅ | ✅ | ✅ | 276 | global/pulldown/pulldown.js |
| `<ui-questionnaire>` | UIQuestionnaire | forms | — | ✅ | ✅ | 265 | global/questionnaire/questionnaire.js |
| `<ui-radar-chart>` | UIRadarChart | charts | — | ✅ | ✅ | 369 | global/radar-chart/radar-chart.js |
| `<ui-radio-group>` | UIRadioGroup | forms | — | ✅ | ✅ | 99 | global/radio-group/radio-group.js |
| `<ui-radio-option>` | UIRadioOption | forms | — | ✅ | — | 25 | global/radio-option/radio-option.js |
| `<ui-range-calendar>` | UIRangeCalendar | data | — | ✅ | ✅ | 13 | global/range-calendar/range-calendar.js |
| `<ui-rating>` | UIRating | shop | ✅ | ✅ | ✅ | 270 | global/rating/rating.js |
| `<ui-resizable>` | UIResizable | layout | — | ✅ | ✅ | 203 | global/resizable/resizable.js |
| `<ui-result-card>` | UIResultCard | data | ✅ | ✅ | ✅ | 59 | global/result-card/result-card.js |
| `<ui-result-rows>` | UIResultRows | data | — | ✅ | ✅ | 73 | global/result-rows/result-rows.js |
| `<ui-scatter-chart>` | UIScatterChart | charts | — | ✅ | ✅ | 509 | global/scatter-chart/scatter-chart.js |
| `<ui-schedule-board>` | UIScheduleBoard | boards | ✅ | ✅ | ✅ | 553 | global/schedule-board/schedule-board.js |
| `<ui-schedule-lane>` | UIScheduleLane | boards | ✅ | ✅ | ✅ | 65 | global/schedule-lane/schedule-lane.js |
| `<ui-schedule-route>` | UIScheduleRoute | boards | ✅ | ✅ | ✅ | 238 | global/schedule-route/schedule-route.js |
| `<ui-scheduler>` | UIScheduler | boards | ✅ | ✅ | ✅ | 258 | global/scheduler/scheduler.js |
| `<ui-scheduler-day>` | UISchedulerDay | boards | — | ✅ | ✅ | 34 | global/scheduler-day/scheduler-day.js |
| `<ui-scheduler-event>` | UISchedulerEvent | boards | — | ✅ | ✅ | 95 | global/scheduler-event/scheduler-event.js |
| `<ui-scroll-area>` | UIScrollArea | layout | ✅ | ✅ | ✅ | 74 | global/scroll-area/scroll-area.js |
| `<ui-search-input>` | UISearchInput | forms | ✅ | ✅ | ✅ | 138 | global/search-input/search-input.js |
| `<ui-segment-item>` | UISegmentItem | forms | ✅ | ✅ | ✅ | 140 | global/segment-item/segment-item.js |
| `<ui-segment-strip>` | UISegmentStrip | data | ✅ | ✅ | ✅ | 86 | global/segment-strip/segment-strip.js |
| `<ui-select>` | UISelect | forms | ✅ | ✅ | ✅ | 104 | global/select/select.js |
| `<ui-separator>` | UISeparator | layout | — | ✅ | ✅ | 17 | global/separator/separator.js |
| `<ui-sidebar>` | UISidebar | shell | ✅ | ✅ | ✅ | 405 | global/sidebar/sidebar.js |
| `<ui-signup>` | UISignup | forms | ✅ | ✅ | ✅ | 120 | global/signup/signup.js |
| `<ui-skeleton>` | UISkeleton | feedback | — | ✅ | — | 52 | global/skeleton/skeleton.js |
| `<ui-slideout>` | UISlideout | overlays | ✅ | ✅ | ✅ | 316 | global/slideout/slideout.js |
| `<ui-slider>` | UISlider | forms | ✅ | ✅ | ✅ | 513 | global/slider/slider.js |
| `<ui-spark-track>` | UISparkTrack | charts | — | ✅ | ✅ | 90 | global/spark-track/spark-track.js |
| `<ui-sparkline>` | UISparkline | charts | — | ✅ | ✅ | 145 | global/sparkline/sparkline.js |
| `<ui-speed-dial>` | UISpeedDial | actions | ✅ | ✅ | ✅ | 311 | global/speed-dial/speed-dial.js |
| `<ui-speed-dial-action>` | UISpeedDialAction | actions | — | ✅ | — | 48 | global/speed-dial-action/speed-dial-action.js |
| `<ui-spinner>` | UISpinner | feedback | — | ✅ | — | 29 | global/spinner/spinner.js |
| `<ui-split-button>` | UISplitButton | actions | ✅ | ✅ | ✅ | 260 | global/split-button/split-button.js |
| `<ui-stack>` | UIStack | layout | ✅ | ✅ | ✅ | 79 | global/stack/stack.js |
| `<ui-stat-table>` | UIStatTable | data | ✅ | ✅ | — | 162 | global/stat-table/stat-table.js |
| `<ui-status-bar>` | UIStatusBar | shell | — | ✅ | ✅ | 35 | global/status-bar/status-bar.js |
| `<ui-status-cell>` | UIStatusCell | shell | — | ✅ | ✅ | 27 | global/status-cell/status-cell.js |
| `<ui-status-indicator>` | UIStatusIndicator | feedback | — | ✅ | ✅ | 76 | global/status-indicator/status-indicator.js |
| `<ui-stepper>` | UIStepper | feedback | — | ✅ | ✅ | 129 | global/stepper/stepper.js |
| `<ui-surface>` | UISurface | layout | ✅ | ✅ | — | 36 | global/surface/surface.js |
| `<ui-svg-bands>` | UISvgBands | layout | ✅ | ✅ | ✅ | 155 | global/svg-bands/svg-bands.js |
| `<ui-swatch>` | UISwatch | shop | — | ✅ | ✅ | 57 | global/swatch/swatch.js |
| `<ui-swatch-group>` | UISwatchGroup | shop | ✅ | ✅ | ✅ | 84 | global/swatch-group/swatch-group.js |
| `<ui-switch>` | UISwitch | forms | ✅ | ✅ | ✅ | 20 | global/switch/switch.js |
| `<ui-tab-button>` | UITabButton | shell | ✅ | ✅ | — | 175 | global/tab-button/tab-button.js |
| `<ui-table>` | UITable | data | ✅ | ✅ | ✅ | 166 | global/table/table.js |
| `<ui-table-cell>` | UITableCell | data | — | ✅ | ✅ | 43 | global/table-cell/table-cell.js |
| `<ui-table-row>` | UITableRow | data | — | ✅ | ✅ | 43 | global/table-row/table-row.js |
| `<ui-tabs>` | UITabs | layout | ✅ | ✅ | ✅ | 526 | global/tabs/tabs.js |
| `<ui-tag-input>` | UITagInput | forms | — | ✅ | ✅ | 207 | global/tag-input/tag-input.js |
| `<ui-task-board>` | UITaskBoard | boards | ✅ | ✅ | ✅ | 1941 | global/task-board/task-board.js |
| `<ui-task-card>` | UITaskCard | boards | — | ✅ | ✅ | 310 | global/task-card/task-card.js |
| `<ui-task-column>` | UITaskColumn | boards | — | ✅ | ✅ | 508 | global/task-column/task-column.js |
| `<ui-ternary-state>` | UITernaryState | forms | — | ✅ | ✅ | 245 | global/ternary-state/ternary-state.js |
| `<ui-text>` | UIText | typography | ✅ | ✅ | — | 49 | global/text/text.js |
| `<ui-text-message>` | UITextMessage | feedback | — | ✅ | ✅ | 80 | global/text-message/text-message.js |
| `<ui-textarea>` | UITextarea | forms | ✅ | ✅ | ✅ | 102 | global/textarea/textarea.js |
| `<ui-theme-select>` | UIThemeSelect | forms | ✅ | ✅ | — | 71 | global/theme-select/theme-select.js |
| `<ui-time-input>` | UITimeInput | forms | ✅ | ✅ | ✅ | 101 | global/time-input/time-input.js |
| `<ui-timeline>` | UITimeline | data | — | ✅ | ✅ | 86 | global/timeline/timeline.js |
| `<ui-to-adaptive>` | UIToAdaptive → UIGoTo | actions | ✅ | ✅ | ✅ | 1385 | global/go-to/go-to.js |
| `<ui-to-bottom>` | UIToBottom → UIGoTo | actions | ✅ | ✅ | ✅ | 1385 | global/go-to/go-to.js |
| `<ui-to-left>` | UIToLeft → UIGoTo | actions | ✅ | ✅ | ✅ | 1385 | global/go-to/go-to.js |
| `<ui-to-pad>` | UIToPad → UIGoTo | actions | ✅ | ✅ | ✅ | 1385 | global/go-to/go-to.js |
| `<ui-to-right>` | UIToRight → UIGoTo | actions | ✅ | ✅ | ✅ | 1385 | global/go-to/go-to.js |
| `<ui-to-top>` | UIToTop → UIGoTo | actions | ✅ | ✅ | ✅ | 1385 | global/go-to/go-to.js |
| `<ui-toast>` | UIToast | overlays | — | ✅ | ✅ | 195 | global/toast/toast.js |
| `<ui-toast-item>` | UIToastItem | overlays | — | ✅ | ✅ | 120 | global/toast-item/toast-item.js |
| `<ui-toggle>` | UIToggle | forms | ✅ | ✅ | ✅ | 48 | global/toggle/toggle.js |
| `<ui-toggle-group>` | UIToggleGroup | actions | ✅ | ✅ | ✅ | 299 | global/toggle-group/toggle-group.js |
| `<ui-toggle-option>` | UIToggleOption | forms | — | ✅ | — | 49 | global/toggle-option/toggle-option.js |
| `<ui-toolbar>` | UIToolbar | forms | ✅ | ✅ | ✅ | 53 | global/toolbar/toolbar.js |
| `<ui-tracker>` | UITracker | data | ✅ | ✅ | ✅ | 760 | global/tracker/tracker.js |
| `<ui-tree>` | UITree | data | ✅ | ✅ | ✅ | 815 | global/tree/tree.js |
| `<ui-tree-node>` | UITreeNode | data | ✅ | ✅ | ✅ | 815 | global/tree/tree.js |
| `<ui-tree-select>` | UITreeSelect | forms | ✅ | ✅ | ✅ | 194 | global/tree-select/tree-select.js |
| `<ui-tree-table>` | UITreeTable | data | — | ✅ | ✅ | 276 | global/tree-table/tree-table.js |
| `<ui-tree-table-row>` | UITreeTableRow | data | — | ✅ | ✅ | 276 | global/tree-table/tree-table.js |
| `<ui-tri-state-checkbox>` | UITriStateCheckbox | forms | — | ✅ | ✅ | 188 | global/tri-state-checkbox/tri-state-checkbox.js |
| `<ui-typewriter>` | UITypewriter | typography | — | ✅ | ✅ | 116 | global/typewriter/typewriter.js |
| `<ui-video-player>` | UIVideoPlayer | media | ✅ | ✅ | ✅ | 244 | global/video-player/video-player.js |
| `<ui-video-short>` | UIVideoShort | media | ✅ | ✅ | ✅ | 328 | global/video-short/video-short.js |
| `<ui-vote-item>` | UIVoteItem | data | — | ✅ | — | 81 | global/vote-item/vote-item.js |
| `<ui-vote-tally>` | UIVoteTally | data | — | ✅ | ✅ | 137 | global/vote-tally/vote-tally.js |
| `<ui-whitebox-modal>` | UIWhiteboxModal | media | — | ✅ | ✅ | 66 | global/whitebox-modal/whitebox-modal.js |
| `<ui-window-title-bar>` | UIWindowTitleBar | layout | ✅ | ✅ | ✅ | 80 | global/window-title-bar/window-title-bar.js |
| `<ui-youtube-video-player>` | UIYoutubeVideoPlayer | media | ✅ | ✅ | ✅ | 271 | global/youtube-video-player/youtube-video-player.js |
