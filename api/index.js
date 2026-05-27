let appPromise;

export default async function handler(req, res) {
  if (!appPromise) {
    appPromise = import("../server/src/index.js").then(m => m.default);
  }
  const app = await appPromise;
  return app(req, res);
}
