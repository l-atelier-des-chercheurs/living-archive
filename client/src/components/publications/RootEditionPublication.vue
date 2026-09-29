<template>
  <div class="_rootEdition">
    <div class="_rootEdition--topbar">
      <div class="_rootEdition--titleRow">
        <button
          type="button"
          class="u-button u-button_icon"
          :title="$t('back')"
          @click="$emit('close')"
        >
          <b-icon icon="arrow-left" :label="$t('back')" />
        </button>
        <TitleField
          :field_name="'title'"
          :label="$t('title')"
          :show_label="false"
          :content="publication.title"
          :path="publication.$path"
          :tag="'h1'"
          :maxlength="60"
          :required="true"
          :can_edit="can_edit"
        />
        <span v-if="template_label" class="_rootEdition--template">
          {{ template_label }}
        </span>
      </div>

      <div class="_rootEdition--btnRow">
        <StatusTag
          v-if="can_edit"
          :status="publication.$status || 'public'"
          :status_options="['public', 'private']"
          :path="publication.$path"
          :can_edit="can_edit"
        />
        <button
          v-if="can_edit"
          type="button"
          class="u-buttonLink"
          @click="toggleSettings"
        >
          <b-icon icon="gear" :aria-label="$t('settings')" />
          {{ $t("settings") }}
        </button>
        <button
          v-if="can_edit"
          type="button"
          class="u-buttonLink"
          @click="show_export_pdf_modal = true"
        >
          <b-icon icon="save2-fill" />
          {{ $t("export") }}
        </button>
        <button
          v-if="can_edit"
          type="button"
          class="u-buttonLink _rootEdition--removeBtn"
          @click="$emit('remove')"
        >
          <b-icon icon="trash" />
          {{ $t("remove") }}
        </button>
      </div>

      <ExportPubliModal
        v-if="show_export_pdf_modal"
        :modal_title="$t('export_publi', { name: publication.title })"
        :publication="publication"
        :pane_infos="pane_infos"
        :can_save_to_project="false"
        @close="show_export_pdf_modal = false"
      />
    </div>

    <div class="_rootEdition--content">
      <EditionTemplate
        :publication="publication"
        :pane_infos="pane_infos"
        :can_edit="can_edit"
        @updatePane="$emit('updatePane', $event)"
      />
    </div>
  </div>
</template>
<script>
import { getTemplateConfig } from "@/utils/folderPublications.js";

export default {
  props: {
    publication: Object,
    pane_infos: Object,
    can_edit: Boolean,
  },
  components: {
    EditionTemplate: () =>
      import("@/components/publications/templates/EditionTemplate.vue"),
    ExportPubliModal: () =>
      import("@/components/publications/ExportPubliModal.vue"),
  },
  data() {
    return {
      show_export_pdf_modal: false,
    };
  },
  computed: {
    template_label() {
      const config = getTemplateConfig(this.publication?.template);
      return config ? this.$t(config.label_key) : "";
    },
  },
  methods: {
    toggleSettings() {
      this.$eventHub.$emit("publication.settings.toggle");
    },
  },
};
</script>
<style lang="scss" scoped>
._rootEdition {
  position: absolute;
  inset: 0;
  display: flex;
  flex-flow: column nowrap;
  background: var(--body-bg, white);
  overflow: hidden;
}

._rootEdition--topbar {
  flex: 0 0 auto;
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) / 2);
  border-bottom: 1px solid var(--border-color, var(--c-gris));
  background: white;
}

._rootEdition--titleRow {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  min-width: 0;
}

._rootEdition--template {
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
  white-space: nowrap;
}

._rootEdition--btnRow {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-end;
  align-items: center;
  gap: calc(var(--spacing) / 1);
}

._rootEdition--removeBtn {
  color: var(--c-rouge);
}

._rootEdition--content {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
