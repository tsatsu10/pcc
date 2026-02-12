# PCC Notifications Analysis

## Current state

- **Review due**: Handled by `ReviewBanner` and `ReviewGate` — users see a banner and are blocked from dashboard until daily/weekly review is done. No push or email.
- **No persistent notification store**: No `Notification` table or in-app inbox.
- **Toasts**: App has `ToastProvider` and `useToast()` used on focus page and for success param toasts (e.g. “Review saved”, “Onboarding complete”).

## Events that could trigger notifications

| Event | Who cares | In-app | Email (future) | Notes |
|-------|-----------|--------|-----------------|--------|
| Daily review due | All users | ✅ ReviewBanner | Optional reminder | Already in-app. |
| Weekly / monthly review due | All users | ✅ ReviewBanner | Optional | Same. |
| Milestone unlocked | Users who care about gamification | ✅ Toast | Optional | “You unlocked: 10 tasks!” — good candidate for toast. |
| Streak at risk (no completion today) | Engaged users | Possible toast at end of day | Optional | Could add “Complete a task to keep your streak” before day ends (user TZ). |
| Focus session ended | User | Optional summary toast | No | “Session: 25m” — nice-to-have. |
| Task completed | User | Optional | No | Milestone toast covers the highlight. |

## Recommendation

### Phase 1 (implemented)

1. **In-app only**
   - No new tables, no email, no push.
2. **Milestone unlocked toasts**
   - When the user’s list of reached milestones grows (e.g. after completing a task or loading dashboard), show a short toast: “You unlocked: 10 tasks!” (or “10h focus”).
   - Use `localStorage` key `pcc-last-seen-milestones` to store last `reached` array and only toast for *new* milestones so we don’t re-toast on every page load.
3. **Review due**
   - Keep as-is with ReviewBanner/ReviewGate; no extra notification type needed for MVP.

### Phase 2 (future)

- **Streak-at-risk**: End-of-day (user TZ) check: if they haven’t completed a task today and had a streak > 0, show one in-app message (banner or toast).
- **Optional email**: User preference “Email me when daily review is due” or “Weekly digest”; would need email sending (e.g. Resend) and a `User` preference flag.
- **Optional notification table**: If we add an in-app “Notifications” center (bell icon + list), add a `Notification` model (userId, type, title, body, readAt, createdAt) and create rows for milestone unlocked, review due, etc., and optionally still send toasts for real-time feedback.

## Implementation details (Phase 1)

- **Dashboard**: On load (client), fetch `/api/gamification`. Compare `reached` to `localStorage['pcc-last-seen-milestones']`. For each new milestone id, call `toast({ message: 'You unlocked: ' + label })`. Then set `localStorage['pcc-last-seen-milestones'] = JSON.stringify(reached)`.
- **Focus page**: After marking a task done or ending a focus session successfully, refetch `/api/gamification`. If `reached` length increased, show toast for the new milestone(s) and update localStorage.
- **Analytics**: Same as dashboard — on load, compare and toast new milestones, update stored list.

This keeps notifications lightweight, in-app only, and focused on accomplishments and existing review UX.
