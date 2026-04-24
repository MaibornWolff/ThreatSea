import * as fs from "node:fs/promises";

async function globalSetup() {
    await fs.mkdir("./tmp/.auth", { recursive: true }).catch((err) => console.debug(err));
}

export default globalSetup;
