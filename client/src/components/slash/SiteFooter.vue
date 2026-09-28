<template>
  <footer class="_siteFooter">
    <div class="_siteFooter--columns">
      <div class="_siteFooter--column">
        <SlashLogo class="_siteFooter--logo" />
        <p class="_siteFooter--text">
          A living archive of the Slash Transition project, exploring the place
          and role of sound artists in territories in transition.
        </p>
        <ul class="_siteFooter--links">
          <li>
            <a :href="site_info.platform_url" target="_blank" rel="noopener"
              >slash-platform.eu</a
            >
          </li>
          <li>
            <a :href="site_info.instagram_url" target="_blank" rel="noopener"
              >Instagram</a
            >
          </li>
        </ul>
      </div>

      <div class="_siteFooter--column">
        <h3 class="_siteFooter--title">Partners</h3>
        <ul class="_siteFooter--links">
          <li v-for="partner in site_info.partners" :key="partner.url">
            <a :href="partner.url" target="_blank" rel="noopener">{{
              partner.name
            }}</a>
          </li>
          <li>
            <a
              :href="site_info.all_partners_url"
              target="_blank"
              rel="noopener"
              >All partners →</a
            >
          </li>
        </ul>
      </div>

      <div class="_siteFooter--column">
        <h3 class="_siteFooter--title">Contact</h3>
        <div
          v-for="contact in site_info.contacts"
          :key="contact.email"
          class="_siteFooter--contact"
        >
          <span class="_siteFooter--contactRole">{{ contact.role }}</span>
          <span>{{ contact.name }}</span>
          <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
        </div>
      </div>

      <div class="_siteFooter--column">
        <h3 class="_siteFooter--title">About this site</h3>
        <ul class="_siteFooter--links">
          <li>
            <router-link :to="{ name: 'Legal' }">Legal notice</router-link>
          </li>
          <li>
            <router-link :to="{ name: 'Privacy' }">Privacy policy</router-link>
          </li>
          <li>
            <a :href="site_info.source_url" target="_blank" rel="noopener"
              >Source code</a
            >
          </li>
        </ul>
      </div>
    </div>

    <div class="_siteFooter--bottom">
      <EuLogo class="_siteFooter--euLogo" />
      <p class="_siteFooter--disclaimer">
        Funded by the European Union. Views and opinions expressed are however
        those of the author(s) only and do not necessarily reflect those of the
        European Union or Creative Europe. Neither the European Union nor
        Creative Europe can be held responsible for them.
      </p>
      <p class="_siteFooter--credits">
        © {{ current_year }} Slash/ · Made with
        <a :href="site_info.dodoc_url" target="_blank" rel="noopener">dodoc</a>
        by
        <a :href="site_info.atelier_url" target="_blank" rel="noopener"
          >L’atelier des chercheurs</a
        >
        · Free software under
        <a :href="site_info.source_url" target="_blank" rel="noopener"
          >AGPL-3.0</a
        >
      </p>
    </div>
  </footer>
</template>

<script>
import SlashLogo from "@/components/nav/SlashLogo.vue";
import EuLogo from "@/components/nav/EuLogo.vue";
import site_info from "@/config/site_info.js";

export default {
  components: {
    SlashLogo,
    EuLogo,
  },
  data() {
    return {
      site_info,
    };
  },
  computed: {
    current_year() {
      return new Date().getFullYear();
    },
  },
};
</script>

<style lang="scss" scoped>
._siteFooter {
  --footer-fg: var(--c-slash-mint, #e5ffdb);

  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 2);
  margin-top: auto;
  padding-top: calc(var(--spacing) * 2);
  border-top: 2px solid var(--footer-fg);
  color: var(--footer-fg);
  font-size: var(--sl-font-size-normal);
  text-align: left;

  a {
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;

    &:hover,
    &:focus-visible {
      text-decoration-thickness: 2px;
    }
  }
}

._siteFooter--columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: calc(var(--spacing) * 2);
}

._siteFooter--column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing) / 1.5);
}

._siteFooter--logo {
  width: 6rem;
}

._siteFooter--title {
  margin: 0;
  font-size: var(--sl-font-size-small);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

._siteFooter--text {
  margin: 0;
  max-width: 32ch;
  line-height: 1.45;
  color: color-mix(in srgb, var(--footer-fg) 85%, transparent);
}

._siteFooter--links {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 4);
}

._siteFooter--contact {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 8);
  word-break: break-word;
}

._siteFooter--contactRole {
  font-size: var(--sl-font-size-small);
  color: color-mix(in srgb, var(--footer-fg) 70%, transparent);
}

._siteFooter--bottom {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing) / 1.5);
  padding-top: calc(var(--spacing) * 1.25);
  border-top: 1px solid color-mix(in srgb, var(--footer-fg) 30%, transparent);
}

._siteFooter--euLogo {
  font-size: var(--sl-font-size-small);
}

._siteFooter--disclaimer,
._siteFooter--credits {
  margin: 0;
  max-width: 80ch;
  font-size: var(--sl-font-size-x-small);
  line-height: 1.45;
  color: color-mix(in srgb, var(--footer-fg) 75%, transparent);
}
</style>
