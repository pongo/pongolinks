import { onScopeDispose, readonly, ref } from "vue";

export function useDelayedFlag(delayMs: number) {
  const isDelayed = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function clearTimer() {
    if (timer === undefined) return;

    clearTimeout(timer);
    timer = undefined;
  }

  function start() {
    clearTimer();
    isDelayed.value = false;

    timer = setTimeout(() => {
      isDelayed.value = true;
      timer = undefined;
    }, delayMs);
  }

  function stop() {
    clearTimer();
    isDelayed.value = false;
  }

  onScopeDispose(stop);

  return {
    isDelayed: readonly(isDelayed),
    start,
    stop,
  };
}
