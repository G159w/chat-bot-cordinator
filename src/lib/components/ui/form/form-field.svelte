<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPath<T>">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { FormPath } from 'sveltekit-superforms';

  import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';
  import * as FormPrimitive from 'formsnap';

  let {
    children: childrenProp,
    class: className,
    form,
    name,
    ref = $bindable(null),
    ...restProps
  }: FormPrimitive.FieldProps<T, U> &
    WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<FormPrimitive.Field {form} {name}>
  {#snippet children({ constraints, errors, tainted, value })}
    <div bind:this={ref} data-slot="form-item" class={cn('space-y-2', className)} {...restProps}>
      {@render childrenProp?.({ constraints, errors, tainted, value: value as T[U] })}
    </div>
  {/snippet}
</FormPrimitive.Field>
