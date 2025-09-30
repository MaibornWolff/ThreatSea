import * as fs from "node:fs/promises";

async function globalSetup() {
    await fs.mkdir("./tmp/.auth", { recursive: true }).catch((err) => console.debug(err));
    await fs.writeFile("./tmp/.auth/chromium-user.json", JSON.stringify({}), {
        encoding: "utf-8",
    });
    await fs.writeFile("./tmp/.auth/firefox-user.json", JSON.stringify({}), {
        encoding: "utf-8",
    });
    await fs.writeFile("./tmp/.auth/webkit-user.json", JSON.stringify({}), {
        encoding: "utf-8",
    });
}

export default globalSetup;
