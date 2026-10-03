<template>
  <div class="_livingArchive">
    <SiteHeader />
    <iframe
      class="_livingArchive--frame"
      :src="site_info.living_archive_url"
      title="Living Archive"
      allowfullscreen
    />
  </div>
</template>

<script>
import SiteHeader from "@/components/nav/SiteHeader.vue";
import site_info from "@/config/site_info.js";

export default {
  name: "LivingArchiveView",
  components: { SiteHeader },
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


._livingArchive--frame {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  border: 0;
}
</style>
