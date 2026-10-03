<template>
  <header class="_siteHeader">
    <div class="_siteHeader--start">
      <router-link
        v-if="!is_home"
        :to="{ name: 'Accueil' }"
        class="_siteHeader--back"
        :title="$t('back')"
      >
        <b-icon icon="arrow-left" :label="$t('back')" />
      </router-link>
      <SiteBrand :link_home="true" :compact="true" />
    </div>
    <button
      type="button"
      class="u-button _siteHeader--account"
      :class="{ 'is--loggedIn': connected_as }"
      @click="$eventHub.$emit('login.openModal')"
    >
      <template v-if="connected_as">
        <span
          class="_siteHeader--accountColor"
          :style="{ backgroundColor: connected_as.color }"
        />
        <span class="_siteHeader--accountName">{{ connected_as.name }}</span>
      </template>
      <template v-else>{{ $t("login") }}</template>
    </button>
  </header>
</template>

<script>
import SiteBrand from "@/components/nav/SiteBrand.vue";

export default {
  name: "SiteHeader",
  components: { SiteBrand },
  computed: {
    is_home() {
      return this.$route.name === "Accueil";
    },
  },
};
</script>

<style lang="scss" scoped>
._siteHeader {
  flex: 0 0 auto;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing);
  padding: calc(var(--spacing) / 1.5) var(--spacing);
  background: var(--c-slash-blue, var(--c-bleuvert));
  color: var(--c-slash-mint, #e5ffdb);
}

._siteHeader--start {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 1.5);
  min-width: 0;
}

._siteHeader--back {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  // keep the comfy hit area without making the bar taller
  margin-block: -0.75rem;
  border-radius: 50%;
  color: inherit;
  font-size: 1.35rem;
  text-decoration: none;
  transition: background-color 0.15s ease;

  &:hover,
  &:focus-visible {
    background: color-mix(in srgb, currentColor 18%, transparent);
  }
}

._siteHeader--account {
  flex: 0 1 auto;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) / 4) calc(var(--spacing) / 2);
  border: none;
  border-radius: 0;
  background: var(--c-slash-mint, #e5ffdb);
  color: var(--c-slash-burgundy, var(--c-rouge));
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: white;
  }
}

._siteHeader--accountColor {
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

._siteHeader--accountName {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
