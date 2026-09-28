<template>
  <div class="_notFoundScreen">
    <div class="_notFoundScreen--inner">
      <router-link
        :to="{ name: 'Accueil' }"
        class="_notFoundScreen--logoLink"
        :aria-label="$t('go_home')"
      >
        <SlashLogo class="_notFoundScreen--logo" />
      </router-link>
      <div class="_notFoundScreen--code">404</div>
      <h1 class="_notFoundScreen--title">{{ $t("page_not_found") }}</h1>
      <div class="_notFoundScreen--actions">
        <router-link
          :to="{ name: 'Accueil' }"
          class="u-button _notFoundScreen--cta"
        >
          {{ $t("go_home") }}
        </router-link>
      </div>
    </div>
  </div>
</template>
<script>
import SlashLogo from "@/components/nav/SlashLogo.vue";

export default {
  props: {},
  components: {
    SlashLogo,
  },
  data() {
    return {};
  },
  created() {},
  mounted() {},
  beforeDestroy() {},
  watch: {},
  computed: {},
  methods: {},
};
</script>
<style lang="scss" scoped>
._notFoundScreen {
  --nf-bg: var(--c-slash-blue, var(--c-bleuvert));
  --nf-fg: var(--c-slash-mint, #e5ffdb);
  --nf-accent: var(--c-slash-burgundy, var(--c-rouge));
  --border-radius: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: calc(var(--spacing) * 2);
  background: var(--nf-bg);
  color: var(--nf-fg);
  animation: notFoundReveal 0.45s cubic-bezier(0.19, 1, 0.22, 1);
}

._notFoundScreen--inner {
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing) * 1.25);
}

._notFoundScreen--logoLink {
  color: var(--nf-fg);
  margin-bottom: calc(var(--spacing) * 0.75);
}

._notFoundScreen--logo {
  width: clamp(7.5rem, 18vw, 9.5rem);
  height: auto;
}

._notFoundScreen--code {
  font-size: clamp(4rem, 12vw, 6.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.9;
  color: var(--nf-fg);
}

._notFoundScreen--title {
  margin: 0;
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--nf-fg);
}

._notFoundScreen--actions {
  margin-top: calc(var(--spacing) * 0.75);
}

._notFoundScreen--cta {
  background: var(--nf-fg);
  color: var(--nf-accent);
  font-weight: 600;
  padding: calc(var(--spacing) / 2) calc(var(--spacing) * 1.25);

  &:hover,
  &:focus-visible {
    background: white;
    color: var(--nf-accent);
  }
}

@keyframes notFoundReveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
