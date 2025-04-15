<template>
    <div class="bg-white border border-slate-200 shadow-md rounded-md w-72 overflow-hidden">
        <div class="flex items-center justify-between bg-slate-100 px-4 py-2 cursor-pointer"
            @click="emit('update:open', !open)">
            <h2 class="font-semibold text-slate-800 text-sm">🎨 Department Colors</h2>
            <span class="text-sm text-slate-600">{{ open ? '–' : '+' }}</span>
        </div>
        <transition name="fade">
            <ul v-show="open" class="p-4 max-h-[50vh] overflow-y-auto">
                <li v-for="(color, name) in departmentColors" :key="name" class="flex items-center gap-3 mb-2">
                    <svg class="w-10 h-6 border border-slate-300 rounded shadow-sm" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient :id="`legend-gradient-${name.replace(/[^\w-]+/g, '')}`" x1="0%" y1="0%"
                                x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#1e3a8a" />
                                <stop offset="100%" :stop-color="color" />
                            </linearGradient>
                        </defs>
                        <rect width="100" height="100"
                            :fill="`url(#legend-gradient-${name.replace(/[^\w-]+/g, '')})`" />
                    </svg>
                    <span class="text-slate-700 text-sm">{{ name }}</span>
                </li>
            </ul>
        </transition>
    </div>
</template>

<script setup>
const props = defineProps(['departmentColors', 'open'])
const emit = defineEmits(['update:open'])
</script>