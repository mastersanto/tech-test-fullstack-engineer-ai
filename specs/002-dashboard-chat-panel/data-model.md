# Data Model: Dashboard Chat Panel

**Date**: 2026-10-17 | **Plan**: [plan.md](plan.md)

No persisted data changes. The `Game` entity, the REST API and the chat API are exactly as in
[001 data-model](../001-indie-games-dashboard/data-model.md).

## UI state (client only, never persisted)

| State | Owner | Type | Default | Changes when | Survives |
|---|---|---|---|---|---|
| Conversation | `ChatView` (`useChat`) | `ChatMessage[]` | `[]` | user sends; reply streams | table edits, panel toggle, drawer open/close, resize. **Lost on reload** |
| `wideHidden` | `ChatPanel` | `boolean` | `false` (panel shown) | "Hide assistant" / "Show assistant" on ≥ 1024 px | everything except reload |
| `drawerOpen` | `ChatPanel` | `boolean` | `false` (drawer closed) | "Ask AI", close button, Escape, backdrop click, `#chat` on load | everything except reload |

### State transitions: drawer (< 1024 px)

```
closed ──(Ask AI | load with #chat)──► open ──(close | Esc | backdrop)──► closed
  focus: on open → chat input        on close → "Ask AI" button
```

### State transitions: panel (≥ 1024 px)

```
shown ──(Hide)──► hidden ──(Show)──► shown      (table width grows / shrinks)
```

The two states are independent. Resizing never changes either one, so crossing the 1024 px
breakpoint shows whatever that width's state already was, and the conversation is never
remounted.
