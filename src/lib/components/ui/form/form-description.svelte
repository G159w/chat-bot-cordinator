<script lang="ts">
  import { cn, type WithoutChild } from '$lib/utils.js';
  import * as FormPrimitive from 'formsnap';

  let {
    class: className,
    ref = $bindable(null),
    ...restProps
  }: WithoutChild<FormPrimitive.DescriptionProps> = $props();
</script>

<FormPrimitive.Description
  bind:ref
  data-slot="form-description"
  class={cn('text-muted-foreground text-sm', className)}
  {...restProps}
/>
