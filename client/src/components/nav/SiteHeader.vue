<template>
  <header class="_siteHeader">
    <SiteBrand :link_home="true" :compact="true" />
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
