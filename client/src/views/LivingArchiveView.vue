<template>
  <div class="_livingArchive">
    <header class="_livingArchive--header">
      <SiteBrand :link_home="true" :compact="true" />
    </header>
    <iframe
      class="_livingArchive--frame"
      :src="site_info.living_archive_url"
      title="Living Archive"
      allowfullscreen
    />
  </div>
</template>

<script>
import SiteBrand from "@/components/nav/SiteBrand.vue";
import site_info from "@/config/site_info.js";

export default {
  name: "LivingArchiveView",
  components: { SiteBrand },
  data() {
    return { site_info };
  },
};
</script>

<style lang="scss" scoped>
._livingArchive {
  position: fixed;
  inset: 0;
  display: flex;
  flex-flow: column nowrap;
  background: var(--body-bg, white);
}

._livingArchive--header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: calc(var(--spacing) / 1.5) var(--spacing);
  background: var(--c-slash-blue, var(--c-bleuvert));
  color: var(--c-slash-mint, #e5ffdb);
}

._livingArchive--frame {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  border: 0;
}
</style>
