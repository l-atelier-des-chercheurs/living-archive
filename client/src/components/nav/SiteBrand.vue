<template>
  <div class="_siteBrand">
    <component
      :is="link_home ? 'router-link' : 'div'"
      v-bind="link_home ? { to: { name: 'Accueil' }, title: 'Back to home' } : {}"
      class="_siteBrand--names"
    >
      <SlashLogo class="_siteBrand--slashLogo" />
      <component :is="title_tag" class="_siteBrand--title">
        Living archive
      </component>
    </component>
    <EuLogo class="_siteBrand--euLogo" variant="mono" />
  </div>
</template>

<script>
import SlashLogo from "@/components/nav/SlashLogo.vue";
import EuLogo from "@/components/nav/EuLogo.vue";

export default {
  components: {
    SlashLogo,
    EuLogo,
  },
  props: {
    link_home: {
      type: Boolean,
      default: false,
    },
    title_tag: {
      type: String,
      default: "div",
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
  color: var(--c-slash-mint, #e5ffdb);
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

._siteBrand--euLogo {
  font-size: clamp(0.75rem, 1.2vw, 1rem);
}
</style>
