<template>
  <DefaultModal>
    <template #header>
      <h3>{{ t('_BACKUP_PLAYLIST') }}</h3>
    </template>
    <template #body>
      <ul class="text-left">
        <li class="h-24 cursor-pointer rounded p-2 hover:bg-dialog-hover" @click="download()">
          <img class="float-left mr-4 h-20 w-20" src="/images/mycover.jpg" />
          <h2>{{ t('_EXPORT_TO_LOCAL_FILE') }}</h2>
        </li>
        <h3 v-show="githubStatus == 2" class="mb-3 font-semibold">{{ t('_EXPORT_TO_GITHUB_GIST') }}</h3>
        <li v-show="githubStatus == 2" class="h-24 cursor-pointer rounded p-2 hover:bg-dialog-hover" @click="backupGist('', true)">
          <img class="float-left mr-4 h-20 w-20 rounded" src="/images/mycover.jpg" />
          <h2>{{ t('_CREATE_PUBLIC_BACKUP') }}</h2>
        </li>
        <li v-show="githubStatus == 2" class="h-24 cursor-pointer rounded p-2 hover:bg-dialog-hover" @click="backupGist('', false)">
          <img class="float-left mr-4 h-20 w-20 rounded" src="/images/mycover.jpg" />
          <h2>{{ t('_CREATE_PRIVATE_BACKUP') }}</h2>
        </li>
        <li
          v-for="(backup, index) in myBackup"
          :key="index"
          class="h-24 cursor-pointer rounded p-2 hover:bg-dialog-hover"
          @click="backupGist(backup.id, backup.public)">
          <img class="float-left mr-4 h-20 w-20" src="/images/mycover.jpg" />
          <h2 class="flex">{{ backup.id + '\n' + new Date(backup.updated_at).toLocaleString() }}</h2>
        </li>
      </ul>
    </template>
    <template #footer>
      <br />
    </template>
  </DefaultModal>
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import iDB from '../../services/DBService';
import GithubClient from '../../services/GithubService';
import DefaultModal from './DefaultModal.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const { backupMySettings2Gist, json2gist, listExistBackup } = GithubClient.gist;

let myBackup = $ref(<any>[]);
listExistBackup().then((list) => (myBackup = list));

const getData = async () => {
  const dbJson: Record<string, unknown> = {};
  await Promise.all(
    iDB.tables.map(async (table) => {
      dbJson[table.name] = await table.toArray();
    })
  );
  dbJson.version = '3';
  return dbJson;
};

const githubStatus = GithubClient.github.getStatus();

const download = async () => {
  const content = JSON.stringify(await getData());
  const blob = new Blob([content], {
    type: 'application/json'
  });
  const link = document.createElement('a');
  link.download = 'listen1_backup.json';
  link.href = window.URL.createObjectURL(blob);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  emit('close');
};

const backupGist = async (id: string, isPublic: boolean) => {
  const dbJson = await getData();
  const gistFiles = json2gist(dbJson);
  backupMySettings2Gist(gistFiles, id, isPublic);
  emit('close');
};
</script>

<script lang="ts">
export default {};
</script>
