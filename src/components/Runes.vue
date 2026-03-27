<template>
  <div class="relative">
    <div class="flex justify-between items-center px-4 lg:px-0 mb-2">
      <h2 class="rw-Title-h2 mb-0">Runes</h2>

      <div v-if="isAnyRuneSelected" class="-mt-2px">
        <a class="rw-Runes-clear" href="#" @click.prevent="onClearRunes">
          <icon-cancel
            class="ux-icon ux-icon--fw rw-Runes-clearIcon text-[#da0000] mr-1"
          />clear
        </a>
      </div>
    </div>

    <div class="rw-Stash select-none mb-4">
      <div class="rw-StashGrid">
        <!-- rune cells -->
        <div
          v-for="rune in runes"
          :key="rune.name"
          class="rw-StashCell"
          :class="{
            'is-selected': haveRunes[rune.name] > 0,
          }"
          @click="onIncrement(rune.name)"
          @contextmenu.prevent="onDecrement(rune.name)"
        >
          <div class="rw-RuneImg" :class="`rune-` + rune.name"></div>
          <div class="rw-StashCell-count" v-if="haveRunes[rune.name] > 0">{{
            haveRunes[rune.name]
          }}</div>
          <div class="rw-StashCell-name">{{ rune.name }}</div>
        </div>

        <!-- empty cells to fill the last row -->
        <div
          v-for="n in emptyCells"
          :key="'empty-' + n"
          class="rw-StashCell rw-StashCell--empty"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import runesData from "@/data/runes";
import store from "@/store";

import IconCancel from "@/icons/IconCancel.vue";

const GRID_COLUMNS = 10;

export default defineComponent({
  name: "RunesGrid",

  components: {
    IconCancel,
  },

  data() {
    return {
      haveRunes: store.state.haveRunes,
      runes: runesData,
    };
  },

  computed: {
    isAnyRuneSelected(): boolean {
      return store.getRunes().length > 0;
    },

    emptyCells(): number {
      const remainder = this.runes.length % GRID_COLUMNS;
      return remainder === 0 ? 0 : GRID_COLUMNS - remainder;
    },
  },

  methods: {
    onClearRunes() {
      store.clearRunes();
      store.saveState();
    },

    onIncrement(runeId: TRuneId) {
      store.incrementRune(runeId);
      store.saveState();
    },

    onDecrement(runeId: TRuneId) {
      store.decrementRune(runeId);
      store.saveState();
    },
  },
});
</script>
