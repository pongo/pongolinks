type HandleCreateSuccessOptions = {
  closeAfterCreate: boolean;
  closeWindow: () => void;
  isWindowClosed: () => boolean;
  navigateToList: () => Promise<void>;
  wait: (ms: number) => Promise<void>;
};

const CLOSE_CHECK_DELAY_MS = 50;

export async function handleCreateBookmarkSuccess(options: HandleCreateSuccessOptions) {
  if (!options.closeAfterCreate) {
    await options.navigateToList();
    return;
  }

  options.closeWindow();
  await options.wait(CLOSE_CHECK_DELAY_MS);

  if (!options.isWindowClosed()) {
    await options.navigateToList();
  }
}
