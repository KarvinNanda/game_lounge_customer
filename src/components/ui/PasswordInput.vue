<template>
  <div class="relative">
    <input
      :id="id"
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      class="hud-input pr-12"
      v-bind="$attrs"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <button
      type="button"
      aria-label="Tampilkan password"
      :aria-pressed="visible"
      class="absolute right-0 top-0 size-11 flex items-center justify-center text-q-text-3 hover:text-q-primary-l cursor-pointer transition-colors hud-focus"
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
