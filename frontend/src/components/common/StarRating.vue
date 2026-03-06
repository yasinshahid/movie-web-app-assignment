<script setup lang="ts">
import { computed } from 'vue';

type Props = {
	value: number;
	max?: number;
	readonly?: boolean;
	label?: string;
};

const props = withDefaults(defineProps<Props>(), {
	max: 5,
	readonly: false,
	label: 'Rating',
});

const emit = defineEmits<{ (e: 'update:value', value: number): void }>();

const clampedValue = computed(() => {
	const v = Number(props.value);
	if (!Number.isFinite(v)) return 0;
	return Math.max(0, Math.min(props.max, v));
});

const fillPercent = computed(() => {
	if (props.max <= 0) return 0;
	return (clampedValue.value / props.max) * 100;
});

function setValue(v: number) {
	if (props.readonly) return;
	emit('update:value', v);
}
</script>

<template>
	<span v-if="readonly" class="starsReadonly" :aria-label="label" role="img">
		<span class="starsBg" aria-hidden="true">★★★★★</span>
		<span class="starsFg" aria-hidden="true" :style="{ width: `${fillPercent}%` }">★★★★★</span>
	</span>

	<div v-else class="starsInput" role="radiogroup" :aria-label="label">
		<button
			v-for="i in max"
			:key="i"
			type="button"
			class="starBtn"
			role="radio"
			:aria-checked="i === Math.round(clampedValue)"
			:aria-label="`${i} star${i === 1 ? '' : 's'}`"
			@click="setValue(i)"
		>
			{{ i <= clampedValue ? '★' : '☆' }}
		</button>
	</div>
</template>

<style scoped>
.starsReadonly {
	position: relative;
	display: inline-block;
	line-height: 1;
	font-size: 14px;
	letter-spacing: 1px;
}

.starsBg {
	opacity: 0.25;
}

.starsFg {
	position: absolute;
	left: 0;
	top: 0;
	overflow: hidden;
	white-space: nowrap;
}

.starsInput {
	display: inline-flex;
	gap: 2px;
	align-items: center;
	line-height: 1;
}

.starBtn {
	border: 0;
	background: transparent;
	padding: 0;
	cursor: pointer;
	font: inherit;
	font-size: 18px;
	line-height: 1;
	color: var(--ink);
}

.starBtn:focus-visible {
	outline: 2px solid var(--focus);
	outline-offset: 2px;
	border-radius: 4px;
}
</style>
