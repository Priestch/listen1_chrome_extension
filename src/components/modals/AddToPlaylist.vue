<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_ADD_TO_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <ul class="text-left">
        <li class="h-14 cursor-pointer p-2 hover:bg-dialog-hover" @click="showModal('CreatePlaylist', { tracks: [...tracks] })">
          <img class="float-left mr-4 h-10 w-10" src="../../images/mycover.jpg" />
          <h2>{{ t('_CREATE_PLAYLIST') }}</h2>
        </li>
        <li v-for="(playlist, index) in myplaylist" :key="index" class="h-14 cursor-pointer p-2 hover:bg-dialog-hover" @click="addToPlaylist(playlist.id)">
          <img class="float-left mr-4 h-10 w-10" :src="playlist.cover_img_url" />
          <h2>{{ playlist.title }}</h2>
        </li>
      </ul>
    </template>
    <template #footer><br /></template>
  </DefaultModal>
</template>

<script setup lang="ts">
import { inject, onMounted, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import useRedHeart from '../../composition/redheart';
import MediaService from '../../services/MediaService';
import notyf from '../../services/notyf';
import DefaultModal from './DefaultModal.vue';

const { t } = useI18n();
let myplaylist: any = $ref<unknown[]>([]);
const showModal: any = inject('showModal');

const addToPlaylist = (playlist: string) => {
  const { addMyPlaylistByUpdateRedHeart } = useRedHeart();
  addMyPlaylistByUpdateRedHeart(playlist, tracks.map(toRaw));
  notyf.success(t('_ADD_TO_PLAYLIST_SUCCESS'));
  emit('close');
};

onMounted(() => {
  MediaService.showMyPlaylist().then((res) => (myplaylist = res));
});

const { tracks } = defineProps<{
  tracks: unknown[];
}>();
const emit = defineEmits(['close']);
</script>

<script lang="ts">
export default {};
</script>

<style></style>
