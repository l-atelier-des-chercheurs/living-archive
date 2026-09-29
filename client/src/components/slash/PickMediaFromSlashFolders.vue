<template>
  <BaseModal2 :title="title" :size="'x-large'" @close="$emit('close')">
    <div class="_pickFromSlashFolders">
      <label class="_pickFromSlashFolders--folderField">
        <span class="_pickFromSlashFolders--folderLabel">{{
          $t("select_a_folder")
        }}</span>
        <select
          class="_pickFromSlashFolders--select"
          v-model="folder_path"
          @change="loadFiles"
        >
          <option
            v-for="folder in sorted_folders"
            :key="folder.$path"
            :value="folder.$path"
          >
            {{ folder.title || folder.$path.split("/").pop() }}
          </option>
        </select>
      </label>

      <div class="_pickFromSlashFolders--grid">
        <LoaderSpinner v-if="is_loading" />
        <MediaGridView
          v-else-if="folder_path"
          :files="pickable_files"
          :selected_files="selected_paths"
          :pick_mode="true"
          @select="onSelect"
        />
      </div>
    </div>

    <template #footer>
      <button type="button" class="u-buttonLink" @click="$emit('close')">
        {{ $t("cancel") }}
      </button>
      <button
        type="button"
        class="u-button u-button_bleuvert"
        :disabled="!selected_paths.length"
        @click="confirmPick"
      >
        {{ $t("add") }}
        <template v-if="selected_paths.length > 1">
          ({{ selected_paths.length }})
        </template>
      </button>
    </template>
  </BaseModal2>
</template>
<script>
import MediaGridView from "@/components/slash/MediaGridView.vue";

export default {
  props: {
    title: String,
    select_mode: {
      type: String,
      default: "multiple",
    },
    pick_from_types: {
      type: [String, Array],
      default: "all",
    },
  },
  components: {
    MediaGridView,
  },
  data() {
    return {
      folders: [],
      folder_path: "",
      folder_files: [],
      selected_paths: [],
      is_loading: false,
    };
  },
  async created() {
    await this.loadFolders();
  },
  computed: {
    sorted_folders() {
      return this.folders
        .filter((folder) => this.canLoggedinSeeFolder({ folder }))
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    },
    allowed_types() {
      if (!this.pick_from_types || this.pick_from_types === "all") return null;
      return Array.isArray(this.pick_from_types)
        ? this.pick_from_types
        : [this.pick_from_types];
    },
    pickable_files() {
      return this.folder_files.filter(
        (file) => !this.allowed_types || this.allowed_types.includes(file.$type)
      );
    },
  },
  methods: {
    async loadFolders() {
      this.is_loading = true;
      try {
        this.folders = await this.$api.getFolders({ path: "folders" });
      } catch (err) {
        console.error(err);
        this.folders = [];
      }
      this.is_loading = false;
      if (this.sorted_folders.length > 0) {
        this.folder_path = this.sorted_folders[0].$path;
        await this.loadFiles();
      }
    },
    async loadFiles() {
      this.folder_files = [];
      this.selected_paths = [];
      if (!this.folder_path) return;
      this.is_loading = true;
      try {
        const folder = await this.$api.getFolder({ path: this.folder_path });
        this.folder_files = Array.isArray(folder?.$files) ? folder.$files : [];
      } catch (err) {
        console.error(err);
      } finally {
        this.is_loading = false;
      }
    },
    onSelect(file_path) {
      if (this.select_mode === "single") {
        this.selected_paths = [file_path];
        return;
      }
      this.selected_paths = this.selected_paths.includes(file_path)
        ? this.selected_paths.filter((p) => p !== file_path)
        : [...this.selected_paths, file_path];
    },
    confirmPick() {
      const medias = this.selected_paths
        .map((path) => this.folder_files.find((f) => f.$path === path))
        .filter(Boolean);
      if (!medias.length) return;
      this.$emit("pickMedias", medias);
      this.$emit("close");
    },
  },
};
</script>
<style lang="scss" scoped>
._pickFromSlashFolders {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 1);
}

._pickFromSlashFolders--folderField {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) / 3);
}

._pickFromSlashFolders--folderLabel {
  font-size: var(--sl-font-size-small);
  font-weight: 600;
}

._pickFromSlashFolders--select {
  max-width: 28rem;
}

._pickFromSlashFolders--grid {
  position: relative;
  min-height: 18rem;
  max-height: 60vh;
  overflow: auto;
}
</style>
