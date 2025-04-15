<template>
    <div class="flex gap-2 items-center">
        <input v-model="query" type="text" placeholder="🔍 Search..."
            class="px-3 py-2 border rounded-md text-sm w-full" />
    </div>
</template>

<script setup>
import { ref, watch} from 'vue'
const query = ref('')
const emit = defineEmits(['update:query'])
watch(query, val => emit('update:query', val))
</script>