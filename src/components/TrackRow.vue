<template>
  <div v-if="index !== undefined" class="text-cneter w-8 flex-none">
    <span>{{ index + 1 }}</span>
  </div>
  <div class="title flex max-h-12 flex-2 items-center overflow-hidden">
    <!-- <a class="disabled" ng-if="song.disabled" ng-click="copyrightNotice()"> song.title </a> -->
    <vue-feather
      class="mx-4 flex-none cursor-pointer"
      type="heart"
      size="18"
      stroke-width="1"
      :stroke="isRedHeart(song.id) ? 'red' : '#666666'"
      :fill="isRedHeart(song.id) ? 'red' : 'none'"
      @click="setRedHeart(toRaw(song), !isRedHeart(song.id))" />

    <a class="min-w-0 cursor-pointer truncate" @click="play(song)">{{ song.title }}</a>
  </div>
  <div class="artist flex-1 truncate">
    <a class="cursor-pointer" @click="$router.push(`/playlist/${song.artist_id}`)">{{ song.artist }}</a>
  </div>
  <div class="album flex-1 truncate">
    <a class="cursor-pointer" @click="$router.push(`/playlist/${song.album_id}`)">{{ song.album }}</a>
  </div>
  <div class="tools flex w-28 items-center">
    <a v-show="song.options" :title="t('_ADD_TO_QUEUE')" class="detail-add-button mr-3 cursor-pointer" @click="addToPlay(song)"><span class="icon li-add" /></a>
    <a
      v-show="song.options"
      :title="t('_ADD_TO_PLAYLIST')"
      class="detail-fav-button mr-3 cursor-pointer"
      @click="showModal('AddToPlaylist', { tracks: [song] })">
      <span class="icon li-songlist" />
    </a>
    <a
      v-show="song.options && (isMine == '1' || isLocal)"
      :title="t('_REMOVE_FROM_PLAYLIST')"
      class="detail-delete-button mr-3 cursor-pointer"
      @click="removeSongFromPlaylist(song.id, listId)">
      <span class="icon li-del" />
    </a>
    <a v-show="song.options && !isLocal" :title="t('_ORIGIN_LINK')" class="source-button mr-3 cursor-pointer" @click="openUrl(song.source_url)">
      <span class="icon li-link" />
    </a>
  </div>
</template>
<script setup lang="ts">
import { inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import useRedHeart from '../composition/redheart';
import { l1Player } from '../services/l1_player';
import notyf from '../services/notyf';
const { song, isMine, isLocal, listId, index } = defineProps<{
  song: any;
  isMine?: boolean | string;
  isLocal?: boolean;
  listId?: string;
  index?: number;
}>();
const { isRedHeart, setRedHeart, removeTrackFromMyPlaylistByUpdateRedHeart } = useRedHeart();

const showModal = inject('showModal') as CallableFunction;

const { t } = useI18n();

const play = (song: any) => {
  l1Player.addTrack(toRaw(song));
  l1Player.playById(song.id);
};
const openUrl = (url: string) => {
  window.open(url, '_blank')?.focus();
};
const addToPlay = (song: any) => {
  l1Player.addTrack(toRaw(song));
  notyf.success(t('_ADD_TO_QUEUE_SUCCESS'));
};
const removeSongFromPlaylist = async (track_id: string, list_id?: string) => {
  if (!list_id) {
    return;
  }
  await removeTrackFromMyPlaylistByUpdateRedHeart(track_id, list_id);
  notyf.success(t('_REMOVE_SONG_FROM_PLAYLIST_SUCCESS'));
};
</script>
