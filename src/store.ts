/**
 * Simple store pattern.
 *
 *   - handle state across components
 *   - persist the state (eg. selected runes) in local storage
 */

import { reactive } from "vue";
import { runesIds } from "@/data/runes";

type TStoreState = {
  haveRunes: TRuneDict;
  pinned: Set<TRunewordId>;
  updateRead: string;
};

// user data as stored in browser's localStorage (new format with counts)
type TUserData = {
  runeCounts: Partial<Record<TRuneId, number>>;
  pinnedRunewords: TRunewordId[];
  updateRead: string;
};

// legacy format (boolean-based)
type TLegacyUserData = {
  selectedRunes: TRuneId[];
  pinnedRunewords: TRunewordId[];
  updateRead: string;
};

const USERDATA_STORAGE_KEY = "runewizard";
const CURRENT_UPDATE_ID = "2026.03.01";

const store = {
  state: reactive({
    haveRunes: [],
    pinned: new Set(),
    updateRead: "",
  }) as TStoreState,

  storage: null as Storage | null,

  initialize() {
    this.storage = window.localStorage;
    store.reset();
  },

  clearRunes() {
    for (const runeId of runesIds()) {
      this.state.haveRunes[runeId] = 0;
    }
  },

  /**
   * returns an array of selected rune ids (those with count > 0)
   */
  getRunes() {
    const result: TRuneId[] = [];

    for (const runeId of Object.keys(this.state.haveRunes) as TRuneId[]) {
      if (this.state.haveRunes[runeId] > 0) {
        result.push(runeId);
      }
    }

    return result;
  },

  /**
   * sets rune count for a specific rune
   */
  setRuneCount(runeId: TRuneId, count: number) {
    this.state.haveRunes[runeId] = Math.max(0, count);
  },

  incrementRune(runeId: TRuneId) {
    const current = this.state.haveRunes[runeId] || 0;
    this.state.haveRunes[runeId] = current + 1;
  },

  decrementRune(runeId: TRuneId) {
    const current = this.state.haveRunes[runeId] || 0;
    this.state.haveRunes[runeId] = Math.max(0, current - 1);
  },

  getRuneCount(runeId: TRuneId): number {
    return this.state.haveRunes[runeId] || 0;
  },

  hasRune(runeId: TRuneId) {
    return (this.state.haveRunes[runeId] || 0) > 0;
  },

  reset() {
    this.clearRunes();
  },

  getPinned(): TRunewordId[] {
    return Array.from(this.state.pinned.values());
  },

  isPinned(id: TRunewordId) {
    return this.state.pinned.has(id);
  },

  setPinned(ids: TRunewordId[], state = true) {
    const fn = state ? "add" : "delete";
    ids.forEach((id) => {
      this.state.pinned[fn](id);
    });
  },

  isUpdateNew(): boolean {
    return this.state.updateRead !== CURRENT_UPDATE_ID;
  },

  setUpdateRead() {
    this.state.updateRead = CURRENT_UPDATE_ID;
  },

  loadState() {
    console.log("store.loadState()");

    if (!this.storage) return;

    const storedData = this.storage.getItem(USERDATA_STORAGE_KEY);
    if (!storedData) return;

    let userData: any;

    try {
      userData = JSON.parse(storedData);
    } catch {
      console.warn("loadState() JSON.parse error");
      return;
    }

    // migrate from legacy boolean format to count format
    if (userData.selectedRunes && !userData.runeCounts) {
      // old format: { selectedRunes: TRuneId[] }
      for (const runeId of userData.selectedRunes as TRuneId[]) {
        this.state.haveRunes[runeId] = 1;
      }
    } else if (userData.runeCounts) {
      // new format: { runeCounts: Record<TRuneId, number> }
      for (const [runeId, count] of Object.entries(userData.runeCounts)) {
        this.state.haveRunes[runeId as TRuneId] = count as number;
      }
    }

    // note! watchout for existing users not having updated keys
    this.setPinned(userData.pinnedRunewords || []);

    this.state.updateRead = userData.updateRead || "";
  },

  saveState() {
    let storedData = "";

    if (!this.storage) return;

    // build runeCounts from haveRunes (only store non-zero counts)
    const runeCounts: Partial<Record<TRuneId, number>> = {};
    for (const runeId of Object.keys(this.state.haveRunes) as TRuneId[]) {
      const count = this.state.haveRunes[runeId];
      if (count > 0) {
        runeCounts[runeId] = count;
      }
    }

    const userData: TUserData = {
      runeCounts,
      pinnedRunewords: this.getPinned(),
      updateRead: this.state.updateRead,
    };

    try {
      storedData = JSON.stringify(userData);
    } catch {
      console.warn("store.save() userData doesn't stringify()");
    }

    this.storage.setItem(USERDATA_STORAGE_KEY, storedData);
  },
};

export default store;
