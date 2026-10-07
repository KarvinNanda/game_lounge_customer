<template>
  <div class="relative">
    <input
      :id="id"
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      class="w-full min-h-11 rounded-xl border border-border-subtle bg-surface-raised/60 py-2.5 pl-4 pr-12 text-sm text-q-text placeholder:text-q-text-3 transition-colors focus:outline-none focus:border-q-primary focus:ring-2 focus:ring-q-primary/30"
      v-bind="$attrs"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <button
      type="button"
      aria-label="Tampilkan password"
      :aria-pressed="visible"
      class="absolute right-0 top-0 size-11 flex items-center justify-center rounded-xl text-q-text-3 hover:text-q-text-2 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" class="size-[18px]" aria-hidden="true" />
      <Eye v-else class="size-[18px]" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false }) // atribut (required, minlength, aria-*) ke <input>, bukan wrapper

defineProps({
  id:           { type: String, required: true },
  modelValue:   { type: String, default: '' },
  autocomplete: { type: String, default: 'current-password' },
  placeholder:  { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
</script>
