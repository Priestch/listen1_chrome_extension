<template>
  <li
    ref="root"
    class="group -mb-[2px] border-t-2 border-b-2 border-transparent"
    :draggable="draggable"
    @dragstart="dragstart"
    @dragend="dragend"
    @dragenter="dragenter"
    @dragleave="dragleave"
    @dragover="dragover"
    @drop="drop"
    @mouseenter="$parent?.$emit('mouseenter')"
    @mouseleave="$parent?.$emit('mouseleave')">
    <slot></slot>
  </li>
</template>
<script setup lang="ts">
const { dragobject, dragtitle, dragtype, ondragleave, sortable, draggable } = defineProps<{
  dragobject: any;
  dragtitle: string;
  dragtype: string;
  ondragleave?: any;
  sortable: boolean;
  draggable: boolean;
}>();
const emits = defineEmits(['drop']);
let root: any = $ref(null);

// https://stackoverflow.com/questions/34200023/drag-drop-set-custom-html-as-drag-image
const dragstart = (ev: DragEvent) => {
  if (dragobject === undefined) {
    return;
  }
  if (dragtype === undefined) {
    return;
  }
  ev.dataTransfer?.setData(dragtype, JSON.stringify(dragobject));
  const elem = document.createElement('div');
  elem.id = 'drag-ghost';
  elem.innerHTML = dragtitle;
  elem.style.position = 'absolute';
  elem.style.top = '-1000px';
  elem.style.padding = '3px';
  elem.style.background = '#eeeeee';
  elem.style.color = '#333';
  elem.style.borderRadius = '3px';

  document.body.appendChild(elem);
  ev.dataTransfer?.setDragImage(elem, 0, 40);
};
const dragend = () => {
  const ghost = document.getElementById('drag-ghost');
  if (ghost === null) {
    return;
  }
  if (ghost.parentNode) {
    ghost.parentNode.removeChild(ghost);
  }
};
const dragenter = (event: DragEvent) => {
  let dragType = '';
  if (!event.dataTransfer?.types) {
    return;
  }
  if (event.dataTransfer.types.length > 0) {
    [dragType] = event.dataTransfer.types;
  }
  if (dragtype === 'application/listen1-myplaylist' && dragType === 'application/listen1-song') {
    root.classList.add('dragover');
  }
};
const dragleave = () => {
  root.classList.remove('dragover');
  if (ondragleave !== undefined) {
    ondragleave();
  }
  if (sortable) {
    const target = root;
    target.style['z-index'] = '0';
    target.style['border-bottom'] = 'solid 2px transparent';
    target.style['border-top'] = 'solid 2px transparent';
  }
};

const dragover = (event: any) => {
  event.preventDefault();
  const dragLineColor = '#FF4444';
  let dragType = '';
  if (event.dataTransfer.types.length > 0) {
    [dragType] = event.dataTransfer.types;
  }

  if (dragtype === dragType) {
    if (!sortable) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    event.dataTransfer.dropEffect = 'move';
    const bounding = event.target.getBoundingClientRect();
    const offset = bounding.y + bounding.height / 2;

    const direction = event.clientY - offset > 0 ? 'bottom' : 'top';
    const target = root;
    if (direction === 'bottom') {
      target.style['border-bottom'] = `solid 2px ${dragLineColor}`;
      target.style['border-top'] = 'solid 2px transparent';
      target.style['z-index'] = '9';
    } else if (direction === 'top') {
      target.style['border-top'] = `solid 2px ${dragLineColor}`;
      target.style['border-bottom'] = 'solid 2px transparent';
      target.style['z-index'] = '9';
    }
  } else if (dragtype === 'application/listen1-myplaylist' && dragType === 'application/listen1-song') {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const drop = (event: any) => {
  const [dragType] = event.dataTransfer.types;
  const jsonString = event.dataTransfer.getData(dragType);
  const data = JSON.parse(jsonString);
  let direction = '';
  const bounding = event.target.getBoundingClientRect();
  const offset = bounding.y + bounding.height / 2;
  direction = event.clientY - offset > 0 ? 'bottom' : 'top';
  // https://stackoverflow.com/questions/19889615/can-an-angular-directive-pass-arguments-to-functions-in-expressions-specified-in
  emits('drop', { data, dragType, direction });

  root.classList.remove('dragover');
  if (sortable) {
    const target = root;
    target.style['border-top'] = 'solid 2px transparent';
    target.style['border-bottom'] = 'solid 2px transparent';
    target.style['z-index'] = '0';
  }
};
</script>
