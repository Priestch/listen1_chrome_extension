<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_IMPORT_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <ul class="dialog-playlist text-left">
        <li
          v-for="(playlist, index) in myplaylist"
          :key="index"
          class="h-14 cursor-pointer rounded p-2 hover:bg-dialog-hover"
          @click="mergePlaylist(playlist.id)">
          <img class="float-left mr-4 h-10 w-10 rounded" :src="playlist.cover_img_url" />
          <h2>{{ playlist.title }}</h2>
        </li>
      </ul>
    </template>
    <template #footer><br /></template>
  </DefaultModal>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import useRedHeart from '../../composition/redheart';
import MediaService from '../../services/MediaService';
import DefaultModal from './DefaultModal.vue';

const { t } = useI18n();
let myplaylist: any[] = $ref<unknown[]>([]);
const emit = defineEmits(['close']);
const { list_id } = defineProps<{
  list_id: string;
}>();
const mergePlaylist = (playlistId: string) => {
  const { mergePlaylistByUpdateRedHeart } = useRedHeart();
  mergePlaylistByUpdateRedHeart(list_id, playlistId);
  emit('close');
};

onMounted(() => {
  MediaService.showMyPlaylist().then((res) => (myplaylist = res));
});
</script>

<style></style>
