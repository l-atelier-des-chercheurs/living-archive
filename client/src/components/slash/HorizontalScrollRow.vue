<template>
  <div class="_hScrollRow">
    <div ref="track" class="_hScrollRow--track" @scroll.passive="update">
      <slot />
    </div>

    <!-- full-height hit zones over the faded edges, the circle is just the visual -->
    <button
      v-if="has_before"
      type="button"
      class="_hScrollRow--nav is--prev"
      :title="$t('previous')"
      @click="scrollBy(-1)"
    >
      <span class="_hScrollRow--circle">
        <b-icon icon="chevron-left" :label="$t('previous')" />
      </span>
    </button>
    <button
      v-if="has_more"
      type="button"
      class="_hScrollRow--nav is--next"
      :title="$t('next')"
      @click="scrollBy(1)"
    >
      <span class="_hScrollRow--circle">
        <b-icon icon="chevron-right" :label="$t('next')" />
      </span>
    </button>
  </div>
</template>

<script>
export default {
  name: "HorizontalScrollRow",
  data() {
    return {
      has_before: false,
      has_more: false,
    };
  },
  mounted() {
    this.update();
    // children (covers, new publications) change the scroll width
    this.resize_observer = new ResizeObserver(() => this.update());
    this.resize_observer.observe(this.$refs.track);
    this.mutation_observer = new MutationObserver(() => this.update());
    this.mutation_observer.observe(this.$refs.track, { childList: true });
  },
  beforeDestroy() {
    this.resize_observer?.disconnect();
    this.mutation_observer?.disconnect();
  },
  methods: {
    update() {
      const el = this.$refs.track;
      if (!el) return;
      this.has_before = el.scrollLeft > 2;
      this.has_more = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    },
    scrollBy(direction) {
      const el = this.$refs.track;
      el.scrollBy({
        left: direction * el.clientWidth * 0.8,
        behavior: "smooth",
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._hScrollRow {
  --hscroll-arrow-bg: var(--c-slash-blue);
  --hscroll-arrow-bg-hover: var(--c-slash-blue, #87221d);

  position: relative;
  min-width: 0;
  // own stacking context: hovered cards (transform) can't rise above the arrows
  isolation: isolate;
}

._hScrollRow--track {
  position: relative;
  z-index: 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  gap: calc(var(--spacing) * 1.25);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  // room for the cards' hover lift and shadow, which overflow would clip
  padding: 6px 0 calc(var(--spacing) * 1.25);

  &::-webkit-scrollbar {
    display: none;
  }

  > ::v-deep * {
    flex: 0 0 auto;
    scroll-snap-align: start;
  }
}

._hScrollRow--nav {
  position: absolute;
  z-index: 10;
  top: 0;
  bottom: calc(var(--spacing) * 1.25);
  display: flex;
  align-items: center;
  width: 5rem;
  padding: 0 calc(var(--spacing) / 2);
  border: none;
  border-radius: 0;
  cursor: pointer;

  // the fade doubles as the hit zone
  &.is--next {
    right: 0;
    justify-content: flex-end;
    background: linear-gradient(
      to right,
      transparent,
      var(--folders-bg, #4980c8) 80%
    );
  }

  &.is--prev {
    left: 0;
    justify-content: flex-start;
    background: linear-gradient(
      to left,
      transparent,
      var(--folders-bg, #4980c8) 80%
    );
  }

  &:hover ._hScrollRow--circle,
  &:focus-visible ._hScrollRow--circle {
    background: var(--hscroll-arrow-bg-hover);
    transform: scale(1.08);
    animation: none;
  }
}

._hScrollRow--circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 2px solid white;
  border-radius: 50%;
  background: var(--hscroll-arrow-bg);
  color: var(--c-slash-mint);
  font-size: 1.5rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, background-color 0.15s ease;

  .is--next & {
    animation: hScrollNudgeNext 1.8s ease-in-out infinite;
  }
}

@keyframes hScrollNudgeNext {
  50% {
    transform: translateX(3px);
  }
}
</style>
