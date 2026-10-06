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
      // width of the faded edges: cards land just past them, fully visible
      const fade = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
      const items = Array.from(el.children);
      const visible_right = el.scrollLeft + el.clientWidth - fade;

      let item;
      if (direction > 0) {
        // first card cut off by the right fade becomes the leftmost one
        item = items.find(
          (i) => i.offsetLeft + i.offsetWidth > visible_right + 1
        );
      } else {
        // go back one view, starting on the first card that fits whole
        const target = el.scrollLeft - (el.clientWidth - 2 * fade);
        item = items.find((i) => i.offsetLeft - fade >= target - 1);
      }

      let left = item ? item.offsetLeft - fade : null;
      // card wider than the view, or nothing found: fall back to a page
      if (left === null || Math.abs(left - el.scrollLeft) < 2)
        left = el.scrollLeft + direction * (el.clientWidth - 2 * fade);

      el.scrollTo({ left, behavior: "smooth" });
    },
  },
};
</script>

<style lang="scss" scoped>
._hScrollRow {
  --hscroll-arrow-bg: var(--c-slash-blue);
  --hscroll-arrow-bg-hover: var(--c-slash-blue, #87221d);
  --hscroll-fade-w: 5rem;

  position: relative;
  min-width: 0;
  // own stacking context: hovered cards (transform) can't rise above the arrows
  isolation: isolate;

  @media (max-width: 600px) {
    --hscroll-fade-w: 3.5rem;
  }
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
  // snapped cards stop past the faded edges instead of under them
  scroll-padding-inline: var(--hscroll-fade-w);
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
  width: var(--hscroll-fade-w);
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

  @media (max-width: 600px) {
    padding: 0 calc(var(--spacing) / 4);
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

  @media (max-width: 600px) {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1.125rem;
  }
}

@keyframes hScrollNudgeNext {
  50% {
    transform: translateX(3px);
  }
}
</style>
