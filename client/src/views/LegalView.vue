<template>
  <div class="_legalView">
    <div class="_legalView--inner">
      <header class="_legalView--header">
        <SiteBrand :link_home="true" />
      </header>

      <main class="_legalView--content">
        <router-link :to="{ name: 'Accueil' }" class="_legalView--back"
          >← Back to home</router-link
        >

        <template v-if="page === 'legal'">
          <h1>Legal notice</h1>

          <section>
            <h2>Publisher</h2>
            <p>
              <a :href="site_info.publisher.url" target="_blank" rel="noopener">{{
                site_info.publisher.name
              }}</a
              ><br />
              {{ site_info.publisher.address }}
            </p>
          </section>

          <section>
            <h2>Publication director</h2>
            <p>
              {{ site_info.publication_director.name }},
              {{ site_info.publication_director.role }}
            </p>
          </section>

          <section>
            <h2>Hosting</h2>
            <p>
              <a :href="site_info.host.url" target="_blank" rel="noopener">{{
                site_info.host.name
              }}</a
              ><br />
              {{ site_info.host.address }}
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p v-for="contact in site_info.contacts" :key="contact.email">
              {{ contact.role }}: {{ contact.name }},
              <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
            </p>
          </section>

          <section>
            <h2>Design and development</h2>
            <p>
              This platform is built with
              <a :href="site_info.dodoc_url" target="_blank" rel="noopener"
                >dodoc</a
              >, developed by
              <a :href="site_info.atelier_url" target="_blank" rel="noopener"
                >L’atelier des chercheurs</a
              >. Contact:
              <a href="mailto:hello@louiseveillard.com"
                >hello@louiseveillard.com</a
              >.
            </p>
          </section>

          <section>
            <h2>Software license</h2>
            <p>
              The software running this platform is free software, released
              under the
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener"
                >GNU Affero General Public License v3.0</a
              >
              (AGPL-3.0). Its source code is available on
              <a :href="site_info.source_url" target="_blank" rel="noopener"
                >GitHub</a
              >.
            </p>
          </section>

          <section>
            <h2>Intellectual property</h2>
            <p>
              All contents published on this platform (media, texts,
              recordings, publications) remain the property of their respective
              authors. All rights reserved. Any reproduction or reuse requires
              the prior consent of the authors concerned.
            </p>
          </section>

          <section>
            <h2>European funding</h2>
            <p>
              Slash Transition is co-funded by the European Union as part of
              the Creative Europe programme. Views and opinions expressed are
              however those of the author(s) only and do not necessarily reflect
              those of the European Union or Creative Europe. Neither the
              European Union nor Creative Europe can be held responsible for
              them.
            </p>
          </section>
        </template>

        <template v-else-if="page === 'privacy'">
          <h1>Privacy policy</h1>

          <section>
            <h2>Data controller</h2>
            <p>
              {{ site_info.publisher.name }},
              {{ site_info.publisher.address }}.
            </p>
          </section>

          <section>
            <h2>Data collected</h2>
            <p>This platform only stores the data needed for it to work:</p>
            <ul>
              <li>
                the author profile you pick or create (name and color);
              </li>
              <li>
                the contents you upload or create (media, texts, comments,
                publications), along with their date and author.
              </li>
            </ul>
          </section>

          <section>
            <h2>Purpose</h2>
            <p>
              These data are used only to display and credit contributions
              within the Slash Transition project. They are never sold or shared
              with third parties for commercial purposes.
            </p>
          </section>

          <section>
            <h2>Cookies and local storage</h2>
            <p>
              No tracking or advertising cookies are used. Your browser’s local
              storage is only used for technical preferences, such as the
              selected view mode or your session.
            </p>
          </section>

          <section>
            <h2>Hosting and retention</h2>
            <p>
              Data are hosted by {{ site_info.host.name }} ({{
                site_info.host.address
              }}). They are kept for the duration of the project and its
              archive, unless you ask for their removal.
            </p>
          </section>

          <section>
            <h2>Your rights</h2>
            <p>
              Under the General Data Protection Regulation (GDPR), you can
              access, correct or delete your personal data. To exercise these
              rights, contact {{ project_contact.name }}:
              <a :href="`mailto:${project_contact.email}`">{{
                project_contact.email
              }}</a
              >.
            </p>
          </section>
        </template>
      </main>

      <SiteFooter />
    </div>
  </div>
</template>

<script>
import SiteBrand from "@/components/nav/SiteBrand.vue";
import SiteFooter from "@/components/slash/SiteFooter.vue";
import site_info from "@/config/site_info.js";

export default {
  components: {
    SiteBrand,
    SiteFooter,
  },
  props: {
    page: {
      type: String,
      required: true,
      validator: (value) => ["legal", "privacy"].includes(value),
    },
  },
  data() {
    return {
      site_info,
    };
  },
  computed: {
    project_contact() {
      return this.site_info.contacts[0];
    },
  },
};
</script>

<style lang="scss" scoped>
._legalView {
  --legal-bg: var(--c-slash-blue, var(--c-bleuvert));
  --legal-fg: var(--c-slash-mint, #e5ffdb);

  position: fixed;
  inset: 0;
  overflow: auto;
  background: var(--legal-bg);
  color: var(--legal-fg);
}

._legalView--inner {
  min-height: 100%;
  padding: calc(var(--spacing) * 2);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 2);
}

._legalView--header {
  padding: calc(var(--spacing)) 0;
}

._legalView--content {
  max-width: 70ch;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1.25);
  line-height: 1.5;

  h1 {
    margin: 0;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  h2 {
    margin: 0 0 calc(var(--spacing) / 3);
    font-size: var(--sl-font-size-small);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  p,
  ul {
    margin: 0 0 calc(var(--spacing) / 3);
  }

  ul {
    padding-left: 1.25em;
  }

  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
}

._legalView--back {
  font-weight: 600;
}
</style>
