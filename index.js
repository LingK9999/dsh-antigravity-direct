// dsh-antigravity-direct — cordis 插件入口
// 生命周期完全跟随 dsh：dsh 启动 → apply() 起 8790 代理；dsh 退出/插件停用 → effect disposer 关闭。
// provider 配置由 profile patch 提供（baseURL http://127.0.0.1:8790/v1，见 README）。
// v0.3.0：connection RPC 通道（/api/antigravity-direct/*），设置面板远程/本地都走宿主执行。
// v0.3.1：lib 改为动态 cache-bust import —— 静态 import 会被 ESM 模块缓存吞掉，
//         热重载（disable/enable）拿到的永远是旧 proxy-core，必须带 query 破缓存。

export const name = "antigravity-direct";
export const inject = [];

const RPC_NAMESPACE = "antigravity-direct";

export async function apply(ctx) {
    // 判别标记：每次 apply 重新执行时写入 log —— 用于确认 cordis 是否真的重新加载了入口模块
    try {
        const { appendFileSync } = await import("node:fs");
        appendFileSync(new URL("./lib/antigravity-direct.log", import.meta.url),
            `[${new Date().toISOString()}] index.js applied (v0.3.1 dynamic-import build)\n`);
    } catch {}
    const modURL = new URL("./lib/proxy-core.js", import.meta.url);
    const { createProxyServer, createAccountService } = await import(`${modURL.href}?_=${Date.now()}`);
    const logger = ctx?.logger;
    const info = (msg) => { try { logger?.info?.(`antigravity-direct: ${msg}`); } catch {} };
    const warn = (msg) => { try { logger?.warn?.(`antigravity-direct: ${msg}`); } catch {} };

    const { server, start, close } = createProxyServer();
    const svc = createAccountService();
    const port = Number(process.env.AG_PORT ?? 8790);

    start(port).then(() => info(`listening on http://127.0.0.1:${port}`))
        .catch((err) => warn(`failed to start on port ${port}: ${err.code ?? ""} ${err.message}`));

    // ── RPC：与 dsh-tool-antigravity 同机制（connection.fetch.register /api 路由）──
    // client 侧 rpc.call("/api", "antigravity-direct/<endpoint>", payload) → 浏览器走 19387
    // web server（远程 relay 自动转发），host 半体本地执行——不受 mixed content / 跨机限制。
    if (typeof ctx.inject === "function") {
        ctx.inject(["connection"], (connectionCtx) => {
            const connection = connectionCtx?.connection;
            if (!connection?.fetch?.register) {
                warn("connection.fetch.register unavailable — RPC 面板通道未挂载（代理本身不受影响）");
                return;
            }
            // 登录流需要本机浏览器回调 localhost:51121 —— 远程会话（非 loopback web server）禁用
            const webServerHost = connectionCtx.get?.("webServer")?.host;
            const loginAllowed = webServerHost === undefined || webServerHost === "127.0.0.1" || webServerHost === "localhost";

            const endpoints = {
                "quota": (p) => svc.quota(p),
                "accounts": () => svc.accounts(),
                "select-account": (p) => svc.selectAccount(p),
                "remove-account": (p) => svc.removeAccount(p),
                "proxy-get": () => svc.proxyGet(),
                "proxy-set": (p) => svc.proxySet(p),
                "proxy-test": (p) => svc.proxyTest(p),
                "login": () => {
                    if (!loginAllowed) throw new Error("登录仅限本地 dsh 会话（远程浏览器无法回到本机回调端口）");
                    return svc.login();
                },
                "login-status": () => svc.loginStatus(),
                "cancel-login": () => svc.cancelLogin(),
            };

            const disposers = Object.entries(endpoints).map(([endpoint, handler]) =>
                connection.fetch.register({
                    path: `/api/${RPC_NAMESPACE}/${endpoint}`,
                    methods: ["POST"],
                    requestBody: "buffered",
                    fetch: async (request) => {
                        if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
                            return new Response("content type must be application/json", { status: 415 });
                        }
                        let body;
                        try { body = await request.json(); } catch { return new Response("invalid JSON", { status: 400 }); }
                        // envelope: {rpcId, method, payload}（dsh-client-connection wire 格式）
                        const rpcId = typeof body?.rpcId === "string" ? body.rpcId : "";
                        const method = typeof body?.method === "string" ? body.method : "";
                        const payload = body && typeof body.payload === "object" && body.payload !== null && !Array.isArray(body.payload) ? body.payload : {};
                        let result;
                        if (method !== `${RPC_NAMESPACE}/${endpoint}`) {
                            result = { ok: false, error: { code: "bad-request", message: "method does not match endpoint", details: {} } };
                        } else {
                            try { result = { ok: true, value: await handler(payload, request.signal) }; }
                            catch (err) {
                                result = { ok: false, error: { code: "internal", message: String(err?.message ?? err), details: {} } };
                            }
                        }
                        return Response.json({ type: "server-response", rpcId, result });
                    },
                })
            );
            info(`RPC mounted: /api/${RPC_NAMESPACE}/{quota,accounts,select-account,remove-account,proxy-get,proxy-set,proxy-test,login,login-status,cancel-login} (login ${loginAllowed ? "enabled" : "remote-blocked"})`);
            return async () => { await Promise.all(disposers.map((d) => d())); };
        });
    }

    ctx.effect(() => () => { void close(); });
}
