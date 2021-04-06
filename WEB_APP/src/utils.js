export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function promiseTimeout(promise, ms, message=null) {
  const rejectPromise = new Promise((resolve, reject) => {
    setTimeout(() => reject(message || `Timed out in ${ms} ms.`), ms);
  });

  return Promise.race([promise, rejectPromise]);
}
