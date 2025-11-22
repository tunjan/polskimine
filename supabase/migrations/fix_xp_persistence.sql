Based on the analysis of the provided code, I have identified several bugs ranging from critical logic flaws to performance bottlenecks.

Here is the detailed report.

### 1. Critical Logic Error: Study Session Reset
**Bug Type**: State Synchronization / UX Breaking
**Location**: `features/study/hooks/useStudySession.ts` (Lines 26-31)

**Explanation**:
The `useStudySession` hook initializes the session with `dueCards`. However, the `useEffect` dependency array includes `dueCards`.
When a user reviews a card, the `useRecordReviewMutation` (in `useDeckQueries.ts`) optimistically updates the `dueCards` query cache by removing the reviewed card. This update propagates down to `StudyRoute` and then into `useStudySession`, triggering the `useEffect`.

This causes `sessionCards` to be replaced with the new list and, critically, **resets `currentIndex` to 0** after every single review. This conflicts with `handleGrade` trying to increment the index, causing the progress bar to jump erratically and breaking the "Undo" history stack logic.

**Impact**: The user experience is jittery. The progress bar will reset or behave unpredictably. The "Undo" functionality will desync because the session state is constantly being re-initialized.

**Solution**:
Only initialize the session cards once on mount. Use a `ref` or separate initialization logic to prevent re-syncing with the live `dueCards` query during an active session.

```typescript
// features/study/hooks/useStudySession.ts

// 1. Add a ref to track if initialized
const isInitialized = useRef(false);

useEffect(() => {
  // Only load cards if we haven't initialized yet, or if the deck was empty and now has cards (rare edge case)
  if (!isInitialized.current && dueCards.length > 0) {
    setSessionCards(dueCards);
    setCurrentIndex(0);
    setSessionComplete(dueCards.length === 0);
    setActionHistory([]);
    isInitialized.current = true;
  }
  // If dueCards becomes empty (externally), we might want to respect that, 
  // but usually inside a session we want to finish the snapshot we started.
}, [dueCards]);
```

---

### 2. Critical Performance Anti-Pattern: Broken Virtualization
**Bug Type**: Performance / Unnecessary Re-renders
**Location**: `features/deck/components/CardList.tsx` (Lines 81-85)

**Explanation**:
The `itemData` passed to `react-window`'s `FixedSizeList` is created inline: `itemData={{ cards, onEditCard, onDeleteCard }}`.
Because this object reference changes on *every* render of `CardList` (e.g., every time the user types a character in the search box), `react-window` is forced to re-render **every single row**, defeating the purpose of virtualization.

**Impact**: Severe input lag when typing in the search box if the deck has more than a few hundred cards.

**Solution**:
Memoize the `itemData` object.

```typescript
// features/deck/components/CardList.tsx

// Add this before the return statement
const itemData = React.useMemo(() => ({
  cards,
  onEditCard,
  onDeleteCard
}), [cards, onEditCard, onDeleteCard]);

return (
  <div className="flex-1 h-full w-full border-t border-border/40">
    <AutoSizer>
      {({ height, width }) => (
        <List
          // ... other props
          itemData={itemData} // Use the memoized object
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  </div>
);
```

---

### 3. Logic Error: Cram Mode Sampling Bias
**Bug Type**: Logic Error / Database Query
**Location**: `services/db/repositories/cardRepository.ts` (Function `getCramCards`)

**Explanation**:
The `getCramCards` function applies the `limit` *before* shuffling the cards.
```typescript
const { data, error } = await query.limit(Math.max(limit, 50));
// ... then shuffle data in JS
```
If a user has 1000 cards and wants to cram 50, the query always fetches the *first* 50 cards (based on insertion order or default DB sort) and shuffles only those. The user will never see the other 950 cards in Cram mode.

**Impact**: Cram mode is useless for decks larger than the limit; users effectively only review their oldest cards repeatedly.

**Solution**:
Since random sorting in Supabase/Postgres (`.order('random()')`) requires RPC or specific extensions, a client-side fix for moderate deck sizes is to fetch the ID list or a larger batch first. Given the app scale, fetching the whole deck (lightweight, select only IDs if possible) is better, or simply removing the limit on the initial fetch (if < 5000 cards).

**Better Approach (Client-side shuffle of larger set)**:
```typescript
export const getCramCards = async (limit: number, tag?: string, language?: Language): Promise<Card[]> => {
  const userId = await ensureUser();
  let query = supabase
    .from('cards')
    .select('*') // Consider selecting only needed fields if performance hits
    .eq('user_id', userId)
    .neq('status', 'known');

  // ... (filters)

  // FIX: Remove the limit from the SQL query (or set it very high like 2000)
  const { data, error } = await query; 
  if (error) throw error;

  const cards = (data ?? []).map(mapToCard);
  
  // Fisher-Yates Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards.slice(0, limit);
};
```

---

### 4. Logic Bug: Seeding Lock-Up
**Bug Type**: Race Condition / State Logic
**Location**: `contexts/DeckContext.tsx` (Lines 123-155)

**Explanation**:
The `isSeeding` ref prevents double execution of the seed logic. However, inside the `loadBeginnerDeck` function, if the async `saveAllCards` operation succeeds or fails, `isSeeding.current` is **never reset to false**.
If the seeding fails (e.g., network error) or if the user switches languages (triggering the effect again via dependency change), the app is permanently locked out of attempting to seed again until a full page refresh.

**Impact**: If a user switches to a new language that is empty, and the seeding glitches or they switch back and forth quickly, the deck remains empty.

**Solution**:
Reset the ref in a `finally` block.

```typescript
// contexts/DeckContext.tsx

const loadBeginnerDeck = async () => {
  if (isSeeding.current) return;

  if (!statsLoading && dbStats && dbStats.total === 0 && user) {
     isSeeding.current = true;
     // ... prep deck logic ...
     try {
        await saveAllCards(deck);
        // ... invalidation logic ...
     } catch (e) {
         console.error("Failed to load beginner deck", e);
     } finally {
         // FIX: Unlock so it can run again if needed (e.g. different language)
         isSeeding.current = false;
     }
  }
};
```

---

### 5. Potential Memory Leak / API Cost: Uncancelled TTS
**Bug Type**: Resource Management / Race Condition
**Location**: `features/study/components/Flashcard.tsx` & `services/tts/index.ts`

**Explanation**:
In `Flashcard.tsx`, `autoPlayAudio` triggers `speak()` in a `useEffect`. If the user navigates through cards rapidly (e.g., hitting Spacebar quickly), multiple `speak` calls fire.
While `ttsService.stop()` cancels *playback*, it does not cancel pending `fetch` requests for Google/Azure TTS.
This results in:
1.  Wasted bandwidth and API costs.
2.  "Ghost audio" playing if a fetch resolves *after* the component has unmounted or `stop()` was called (if the logic in `ttsService` isn't perfectly guarded).
3.  Although `ttsService` has `currentOperationId` to guard playback, the fetch still occurs.

**Impact**: Increased latency and potential bill shock for cloud TTS providers.

**Solution**:
Implement an `AbortController` pattern in the TTS service.

```typescript
// services/tts/index.ts

// Add a controller to the class
private abortController: AbortController | null = null;

// In speak methods (e.g., speakGoogle):
private async speakGoogle(...) {
    // Cancel previous request
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    try {
        const response = await fetch(..., {
            signal: this.abortController.signal, // Bind signal
            // ...
        });
        // ...
    } catch (e) {
        if (e.name === 'AbortError') return; // Ignore aborts
        console.error(e);
    }
}

stop() {
    if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
    }
    // ... existing stop logic
}
```

### 6. Minor Bug: DOM ID Collision Risk
**Bug Type**: Potential DOM Conflict
**Location**: `components/common/LanguageThemeManager.tsx`

**Explanation**:
The component creates a style tag: `styleTag.id = STYLE_TAG_ID`.
If the app is ever server-side rendered (SSR) or hydrated in a specific way, `document.getElementById` might fail or conflict. More importantly, the component does not **clean up** its side effects (the `<style>` tag and the `data-language` attribute) on unmount.

**Solution**: return a cleanup function in the `useLayoutEffect`.

```typescript
useLayoutEffect(() => {
    // ... setup logic ...

    return () => {
        // Cleanup
        const tag = document.getElementById(STYLE_TAG_ID);
        if (tag) tag.remove();
        document.documentElement.removeAttribute('data-language');
    };
}, [settings.language, settings.languageColors]);
```