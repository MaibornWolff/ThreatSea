import * as fs from "node:fs/promises";

async function globalTeardown() {
    // Keep tmp/.auth (auth state files needed across runs), only clean other tmp files
    // Use rm with a glob to remove everything except .auth
    const tmpDir = "./tmp";
    try {
        const entries = await fs.readdir(tmpDir);
        for (const entry of entries) {
            if (entry !== ".auth") {
                await fs.rm(`${tmpDir}/${entry}`, { recursive: true, force: true }).catch((_err) => void _err);
            }
        }
    } catch {
        // tmp dir does not exist, nothing to clean
    }
}

export default globalTeardown;
