export function waitForGlobalStyles(timeout = 5000): Promise<void> {
    
  const startTime = performance.now(); // Start timer
  const links = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    console.log(`Waiting for ${links.length} global stylesheets to load...`, links);
  const promises = links.map(link => {
    return new Promise<void>(resolve => {
      // Already loaded shortcut
      if (link.sheet) {
        return resolve();
      }

      const onLoadOrError = () => resolve();
      link.addEventListener('load', onLoadOrError, { once: true });
      link.addEventListener('error', onLoadOrError, { once: true });

      // Optional safety: timeout in case the link hangs
      setTimeout(() => resolve(), timeout);
    });
  });

  return Promise.all(promises).then(() => {
    const endTime = performance.now(); // End timer
    console.log('All head stylesheets loaded');
    console.log(`Time taken: ${(endTime - startTime).toFixed(2)} ms`);
  });
}



export async function waitForUIReady(): Promise<void> {
  if ('fonts' in document) {
    await (document as any).fonts.ready;
  }
  console.log("UI fonts are ready.");
  await waitForGlobalStyles();
}
