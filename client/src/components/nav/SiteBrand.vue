<template>
  <div class="_siteBrand">
    <component
      :is="link_component"
      v-bind="link_attrs"
      class="_siteBrand--names"
    >
      <SlashLogo class="_siteBrand--slashLogo" />
      <component :is="title_tag" class="_siteBrand--title">
        Living archive
      </component>
    </component>
  </div>
</template>

<script>
import SlashLogo from "@/components/nav/SlashLogo.vue";

export default {
  components: {
    SlashLogo,
  },
  props: {
    link_home: {
      type: Boolean,
      default: false,
    },
    new_tab: {
      type: Boolean,
      default: false,
    },
    title_tag: {
      type: String,
      default: "div",
    },
  },
  computed: {
    link_component() {
      if (!this.link_home) return "div";
      return this.new_tab ? "a" : "router-link";
    },
    link_attrs() {
      if (!this.link_home) return {};
      if (this.new_tab) {
        return {
          href: this.$router.resolve({ name: "Accueil" }).href,
          target: "_blank",
          rel: "noopener",
          title: "Slash home",
        };
      }
      return { to: { name: "Accueil" }, title: "Back to home" };
    },
  },
};
</script>

<style lang="scss" scoped>
._siteBrand {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-end;
  gap: calc(var(--spacing) * 1) calc(var(--spacing) * 2);
  color: var(--site-brand-color, var(--c-slash-mint, #e5ffdb));
}

._siteBrand--names {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing) / 2);
  color: inherit;
  text-decoration: none;
}

._siteBrand--slashLogo {
  width: clamp(5rem, 10vw, 7.5rem);
}

._siteBrand--title {
  margin: 0;
  font-size: clamp(2.5rem, 8vw, 6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 0.95;
  color: inherit;
}
</style>
