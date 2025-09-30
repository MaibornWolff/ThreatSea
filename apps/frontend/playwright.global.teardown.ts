import * as fs from "node:fs/promises";

async function globalTeardown() {
    await fs.rm("./tmp", { recursive: true, force: true }).catch((err) => console.debug(err));
}

export default globalTeardown;
