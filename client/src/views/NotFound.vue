<template>
  <div class="_notFound">
    <NotFound />
  </div>
</template>
<script>
import NotFound from "@/components/NotFound.vue";
export default {
  props: {},
  components: {
    NotFound,
  },
  data() {
    return {};
  },
  created() {
    this.$api.updateSelfPath("404");
  },
  mounted() {},
  beforeDestroy() {},
  watch: {},
  computed: {},
  methods: {},
};
</script>
<style lang="scss" scoped>
._notFound {
  width: 100%;
  height: 100%;
  min-height: 100vh;
}
</style>
