<script lang="ts">
  interface Props {
    storageKey?: string;
    nonce?: string;
  }

  let { storageKey = "cf-theme", nonce }: Props = $props();

  const serializedKey = $derived(JSON.stringify(storageKey).replaceAll("<", "\\u003c"));
  const code = $derived(
    `(function(){try{var p=localStorage.getItem(${serializedKey});if(p!==\"light\"&&p!==\"dark\"&&p!==\"system\")p=\"system\";var t=p===\"system\"?(matchMedia(\"(prefers-color-scheme: dark)\").matches?\"dark\":\"light\"):p;var r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=t;r.style.colorScheme=t}catch(e){}})();`,
  );
  const markup = $derived(
    `<script data-cf-theme-script${nonce ? ` nonce="${nonce.replaceAll('"', "&quot;")}"` : ""}>${code}<\/script>`,
  );
</script>

{@html markup}
