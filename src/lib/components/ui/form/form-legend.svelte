<script lang="ts">
  import { cn, type WithoutChild } from '$lib/utils.js';
  import * as FormPrimitive from 'formsnap';

  let {
    class: className,
    ref = $bindable(null),
    ...restProps
  }: WithoutChild<FormPrimitive.LegendProps> = $props();
</script>

<FormPrimitive.Legend
  bind:ref
  class={cn('data-[fs-error]:text-destructive text-sm leading-none font-medium', className)}
  {...restProps}
/>
