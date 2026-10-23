/* dsh-antigravity-direct client half — 设置面板「Antigravity 直连」额度 + 账号管理。
 * v0.3.0：数据走 host RPC（rpc.call("/api","antigravity-direct/…")，dsh web server
 * 19387 转发，远程会话同样可用）；OAuth 登录限本地（回调 localhost:51121）。
 */
window.__ModuleLoader__.load({
  id: "dsh-antigravity-direct",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var react = require("react");

    var inject = ["slots", "connection"];

    var RPC_CHANNEL = "/api";
    var NS = "antigravity-direct";

    var CSS = `
.agq-panel { display:flex; flex-direction:column; gap:14px; font-size:13px; }
.agq-panel * { box-sizing:border-box; }
.agq-pool { border:1px solid var(--agq-border,#2a2a35); border-radius:8px; padding:10px 12px; }
.agq-pool-head { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px; }
.agq-pool-name { font-weight:600; letter-spacing:.02em; }
.agq-pool-pct { font-variant-numeric:tabular-nums; font-size:19px; font-weight:600; line-height:1.1; }
.agq-pool-models { opacity:.5; font-size:11px; margin-bottom:10px; }
.agq-win-block { display:flex; flex-direction:column; gap:12px; }
.agq-win { display:block; min-width:0; }
.agq-win-head { display:flex; justify-content:space-between; align-items:baseline; font-size:12px; margin-bottom:5px; }
.agq-win-pct { font-variant-numeric:tabular-nums; font-weight:600; font-size:13px; }
.agq-win-note { opacity:.55; font-size:11px; margin-top:5px; }
.agq-bar { height:6px; border-radius:3px; background:var(--agq-track,#23232d); overflow:hidden; }
.agq-fill { height:100%; border-radius:3px; transition:width .4s ease; }
.agq-meta { display:flex; justify-content:space-between; opacity:.65; font-size:11px; }
.agq-winrow { display:flex; justify-content:space-between; font-size:12px; margin-top:2px; }
.agq-row { display:flex; justify-content:space-between; opacity:.8; }
.agq-refresh { align-self:flex-start; padding:4px 14px; border-radius:6px; border:1px solid var(--agq-border,#2a2a35);
  background:transparent; color:inherit; cursor:pointer; font-size:12px; }
.agq-refresh:hover { background:var(--agq-hover,#23232d); }
.agq-btn { padding:3px 10px; border-radius:6px; border:1px solid var(--agq-border,#2a2a35);
  background:transparent; color:inherit; cursor:pointer; font-size:12px; margin-left:8px; }
.agq-btn:hover { background:var(--agq-hover,#23232d); }
.agq-btn.danger:hover { border-color:#ef4444; color:#ef4444; }
.agq-btn:disabled { opacity:.45; cursor:default; }
.agq-err { color:#ef4444; font-size:12px; word-break:break-all; }
.agq-title { font-weight:600; font-size:14px; }
.agq-sub { opacity:.6; font-size:11px; margin-top:2px; }
.agq-sec { font-weight:600; font-size:12px; opacity:.75; margin-top:2px; }
.agq-acct { display:flex; align-items:center; gap:8px; padding:6px 10px; border:1px solid var(--agq-border,#2a2a35); border-radius:8px; }
.agq-acct + .agq-acct { margin-top:6px; }
.agq-acct-mail { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.agq-acct-active { color:#22c55e; font-size:11px; white-space:nowrap; }
.agq-note { opacity:.55; font-size:11px; }
.agq-input { width:100%; margin:10px 0 8px; padding:6px 10px; border-radius:6px; font-size:12px;
  border:1px solid var(--agq-border,#2a2a35); background:var(--agq-input-bg,rgba(127,127,127,.08)); color:inherit;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.agq-input:focus { outline:none; border-color:var(--agq-accent,#3b82f6); }
.agq-btnrow { display:flex; gap:8px; align-items:center; }
.agq-btnrow .agq-refresh { align-self:auto; }
.agq-model-card { border:1px solid var(--agq-border,#2a2a35); border-radius:8px; padding:10px 12px; }
.agq-model-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.agq-model-list { display:flex; flex-direction:column; gap:4px; max-height:280px; overflow-y:auto; padding-right:2px; }
.agq-model-item { display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-radius:6px; background:var(--agq-input-bg,rgba(127,127,127,.06)); font-size:12px; }
.agq-model-item:hover { background:var(--agq-hover,#23232d); }
.agq-model-name { font-weight:600; display:flex; align-items:center; gap:6px; }
.agq-tag { font-size:10px; padding:1px 5px; border-radius:4px; border:1px solid var(--agq-border,#2a2a35); opacity:.85; }
.agq-tag.green { border-color:#22c55e; color:#22c55e; }
.agq-tag.blue { border-color:#3b82f6; color:#3b82f6; }
.agq-tag.purple { border-color:#a855f7; color:#a855f7; }
.agq-model-meta { display:flex; align-items:center; gap:8px; font-size:11px; opacity:.75; }
    `;

    function pctColor(f) {
      if (f >= 0.5) return "#22c55e";
      if (f >= 0.2) return "#eab308";
      return "#ef4444";
    }

    function fmtReset(iso) {
      if (!iso) return "—";
      try {
        var d = new Date(iso);
        var pad = function (n) { return String(n).padStart(2, "0"); };
        return pad(d.getHours()) + ":" + pad(d.getMinutes()) + " 重置";
      } catch (e) { return "—"; }
    }

    /* 相对剩余时间 + 绝对重置时刻，例："3 小时 5 分后刷新 · 20:43 重置" */
    function fmtRelTime(iso) {
      if (!iso) return "—";
      var t = new Date(iso).getTime();
      if (!isFinite(t)) return "—";
      var diff = t - Date.now();
      if (diff <= 0) return "即将刷新";
      var mins = Math.floor(diff / 60000);
      var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), mm = mins % 60;
      var rel = d > 0 ? d + " 天 " + h + " 小时后刷新"
              : h > 0 ? h + " 小时 " + mm + " 分后刷新"
              : mm + " 分后刷新";
      return rel + " · " + fmtReset(iso);
    }

    /* RPC 调用：rpc prop 由 settings.section inject 提供（dsh 客户端框架）；
     * 无 rpc 时退回本地直连 127.0.0.1:8790（本地会话兜底）。 */
    function rpcCall(rpc, endpoint, payload) {
      if (rpc && typeof rpc.call === "function") {
        return rpc.call(RPC_CHANNEL, NS + "/" + endpoint, payload || {})
          .then(function (result) {
            if (result && result.ok === false) {
              throw new Error((result.error && result.error.message) || "rpc failed");
            }
            return result && result.value !== undefined ? result.value : result;
          });
      }
      return fetch("http://127.0.0.1:8790/" + endpoint.replace("-", "") + "?_=" + Date.now())
        .then(function (r) { return r.json(); });
    }

    function Bar(props) {
      var frac = typeof props.frac === "number" ? props.frac : null;
      var color = frac === null ? "#888" : pctColor(frac);
      var width = frac === null ? "0%" : (frac * 100).toFixed(1) + "%";
      return react.createElement("div", { className: "agq-bar" },
        react.createElement("div", { className: "agq-fill", style: { width: width, background: color } }));
    }

    /* 单个限额窗口：标题 + 百分比 + 独立进度条 + 相对刷新时间 */
    function WindowRow(props) {
      var w = props.w;
      if (!w) return null;
      var frac = typeof w.remainingFraction === "number" ? w.remainingFraction : null;
      var color = frac === null ? "#888" : pctColor(frac);
      return react.createElement("div", { className: "agq-win" },
        react.createElement("div", { className: "agq-win-head" },
          react.createElement("span", null, props.label),
          react.createElement("span", { className: "agq-win-pct", style: { color: color } },
            frac === null ? "—" : (frac * 100).toFixed(2) + "%")),
        react.createElement(Bar, { frac: frac }),
        react.createElement("div", { className: "agq-win-note" }, fmtRelTime(w.resetTime)));
    }

    /* 池卡片：一组模型（gemini / non-gemini）× 5 小时限额 + 周限额，各自独立进度条 */
    var POOL_MODELS = {
      "gemini": "包含模型：Gemini Flash、Gemini Pro",
      "non-gemini": "包含模型：Claude Opus、Claude Sonnet、GPT-OSS",
    };
    function PoolCard(props) {
      var g = props.group; // {group, windows:[{window,remainingFraction,resetTime}]}
      if (!g) return null;
      var w5 = g.windows && g.windows.find(function (w) { return w.window === "5h"; });
      var wk = g.windows && g.windows.find(function (w) { return w.window === "weekly"; });
      var frac = w5 ? w5.remainingFraction : (wk ? wk.remainingFraction : null);
      var name = g.group === "non-gemini" ? "CLAUDE 与 GPT 模型" : "GEMINI 模型";
      return react.createElement(
        "div",
        { className: "agq-pool" },
        react.createElement(
          "div",
          { className: "agq-pool-head" },
          react.createElement("span", { className: "agq-pool-name" }, name),
          react.createElement(
            "span",
            { className: "agq-pool-pct", style: { color: frac === null ? "#888" : pctColor(frac) } },
            frac === null ? "？" : (frac * 100).toFixed(2) + "%"
          )
        ),
        react.createElement("div", { className: "agq-pool-models" }, POOL_MODELS[g.group] || ""),
        react.createElement("div", { className: "agq-win-block" },
          w5 || wk
            ? [
                react.createElement(WindowRow, { key: "w5", w: w5, label: "5 小时限额剩余" }),
                react.createElement(WindowRow, { key: "wk", w: wk, label: "周限额剩余" }),
              ]
            : react.createElement("div", { className: "agq-note" }, "该池未返回窗口数据"))
      );
    }

    /* 网络代理设置：手动绑定 HTTP(S) 代理，保存后立即生效（无需重启） */
    var PROXY_SRC_LABEL = { config: "面板设置", env: "AG_PROXY 环境变量", default: "默认值" };
    function ProxyCard(props) {
      var info = props.info;
      var busy = props.busy;
      return react.createElement("div", { className: "agq-pool" },
        react.createElement("div", { className: "agq-pool-name" }, "网络代理设置（HTTP / HTTPS Proxy）"),
        react.createElement("div", { className: "agq-sub" },
          "手动绑定代理服务器地址（优先级高于环境变量；留空则直连）。保存后下一条上游请求立即生效，无需重启。"),
        react.createElement("input", {
          className: "agq-input",
          value: props.draft,
          spellCheck: false,
          placeholder: "http://127.0.0.1:7890（留空 = 直连）",
          onChange: function (e) { props.onDraft(e.target.value); }
        }),
        react.createElement("div", { className: "agq-btnrow" },
          react.createElement("button", {
            className: "agq-refresh",
            disabled: busy === "proxy-save",
            onClick: props.onSave
          }, busy === "proxy-save" ? "保存中…" : "保存代理"),
          react.createElement("button", {
            className: "agq-refresh",
            disabled: busy === "proxy-test",
            onClick: props.onTest
          }, busy === "proxy-test" ? "测试中…" : "测试连通性")),
        react.createElement("div", { className: "agq-win-note" },
          info
            ? "当前生效：" + (info.proxyUrl || "直连") + "（" + (PROXY_SRC_LABEL[info.source] || info.source) + "）"
            : "读取中…"),
        props.msg
          ? react.createElement("div", { className: props.msgOk ? "agq-note" : "agq-err" },
              (props.msgOk ? "✓ " : "✗ ") + props.msg)
          : null);
    }

    /* 可用模型列表与同步卡片 */
    function ModelsCard(props) {
      var data = props.data;
      var busy = props.busy;
      var onRefresh = props.onRefresh;
      var onSync = props.onSync;
      var syncMsg = props.syncMsg;
      var syncMsgOk = props.syncMsgOk;
      var expanded = props.expanded;
      var onToggleExpand = props.onToggleExpand;

      var models = (data && data.models) || [];
      var displayModels = expanded ? models : models.slice(0, 6);

      return react.createElement("div", { className: "agq-model-card" },
        react.createElement("div", { className: "agq-model-head" },
          react.createElement("div", null,
            react.createElement("span", { className: "agq-pool-name" }, "Antigravity 模型列表"),
            react.createElement("span", { className: "agq-note", style: { marginLeft: "8px" } },
              data ? "（共 " + (data.total || models.length) + " 个模型）" : "加载中…")),
          react.createElement("div", { className: "agq-btnrow" },
            react.createElement("button", {
              className: "agq-refresh",
              disabled: busy === "refresh-models",
              onClick: onRefresh
            }, busy === "refresh-models" ? "刷新中…" : "刷新列表"),
            react.createElement("button", {
              className: "agq-refresh",
              style: { borderColor: "var(--agq-accent,#3b82f6)", color: "var(--agq-accent,#3b82f6)", fontWeight: "600" },
              disabled: busy === "sync-models" || !models.length,
              onClick: onSync
            }, busy === "sync-models" ? "同步中…" : "⚡ 一键同步至 DSH 选择器"))),
        syncMsg
          ? react.createElement("div", { className: syncMsgOk ? "agq-note" : "agq-err", style: { marginBottom: "8px" } },
              (syncMsgOk ? "✓ " : "✗ ") + syncMsg)
          : null,
        models.length
          ? react.createElement("div", { className: "agq-model-list" },
              displayModels.map(function (m) {
                var isDefault = m.isDefault || m.id === "gemini-3.8-flash-high";
                var ctxText = m.contextWindow >= 1000000 ? (m.contextWindow / 1000000).toFixed(0) + "M" : Math.round(m.contextWindow / 1000) + "k";
                return react.createElement("div", { key: m.id, className: "agq-model-item" },
                  react.createElement("div", { className: "agq-model-name" },
                    react.createElement("span", null, m.displayName || m.id),
                    isDefault ? react.createElement("span", { className: "agq-tag green" }, "默认推荐") : null,
                    m.supportsThinking ? react.createElement("span", { className: "agq-tag blue" }, "思考") : null,
                    m.supportsImages ? react.createElement("span", { className: "agq-tag purple" }, "视觉") : null),
                  react.createElement("div", { className: "agq-model-meta" },
                    react.createElement("span", { className: "agq-note" }, ctxText + " context"),
                    react.createElement("span", { style: { fontFamily: "monospace", opacity: 0.8 } }, m.id)));
              }))
          : react.createElement("div", { className: "agq-note" }, "暂未获取到模型数据，请点击刷新列表"),
        models.length > 6
          ? react.createElement("div", { style: { marginTop: "6px", textAlign: "center" } },
              react.createElement("button", {
                className: "agq-refresh",
                style: { width: "100%", textAlign: "center", border: "none", fontSize: "11px", opacity: 0.8 },
                onClick: onToggleExpand
              }, expanded ? "收起部分模型" : "展开显示全部 " + models.length + " 个模型 ▼"))
          : null
      );
    }

    /* 旧版单窗口卡片（quotaSummary 缺失时的回退） */
    function LegacyPool(props) {
      var p = props.pool;
      if (!p) return null;
      return react.createElement(
        "div",
        { className: "agq-pool" },
        react.createElement("div", { className: "agq-pool-head" },
          react.createElement("span", { className: "agq-pool-name" }, p.label),
          react.createElement("span", { className: "agq-pool-pct", style: { color: pctColor(p.remaining) } },
            (p.remaining * 100).toFixed(1) + "%")),
        react.createElement(Bar, { frac: p.remaining }),
        react.createElement("div", { className: "agq-meta" },
          react.createElement("span", null, "剩余额度"),
          react.createElement("span", null, fmtReset(p.resetTime)))
      );
    }

    function AntigravityQuotaSettings(props) {
      var rpc = props && props.rpc;
      var st = react.useState({ loading: true, data: null, error: null, accounts: null, loginState: "idle", loginMsg: null, busy: null,
        proxy: null, proxyDraft: "", proxyMsg: null, proxyMsgOk: true,
        modelsData: null, modelsExpanded: false, syncMsg: null, syncMsgOk: true });
      var s = st[0];
      var setS = st[1];

      var load = react.useCallback(function (withAccounts) {
        setS(function (prev) { return Object.assign({}, prev, { loading: true, error: null }); });
        rpcCall(rpc, "quota")
          .then(function (data) {
            if (!data || data.ok === false) throw new Error((data && data.error) || "quota unavailable");
            setS(function (prev) { return Object.assign({}, prev, { loading: false, data: data }); });
            if (withAccounts !== false) {
              rpcCall(rpc, "accounts")
                .then(function (acc) { setS(function (prev) { return Object.assign({}, prev, { accounts: acc }); }); })
                .catch(function () {});
            }
            rpcCall(rpc, "proxy-get")
              .then(function (info) {
                setS(function (prev) {
                  // 只在草稿为空时回填，避免覆盖用户正在输入的内容
                  return Object.assign({}, prev, { proxy: info, proxyDraft: prev.proxyDraft || (info.proxyUrl || "") });
                });
              })
              .catch(function () {});
            rpcCall(rpc, "models")
              .then(function (mres) { setS(function (prev) { return Object.assign({}, prev, { modelsData: mres }); }); })
              .catch(function () {});
          })
          .catch(function (e) { setS(function (prev) { return Object.assign({}, prev, { loading: false, error: String(e.message || e) }); }); });
      }, [rpc]);

      var accountAction = react.useCallback(function (endpoint, payload, busyTag) {
        setS(function (prev) { return Object.assign({}, prev, { busy: busyTag }); });
        rpcCall(rpc, endpoint, payload)
          .then(function (acc) {
            setS(function (prev) { return Object.assign({}, prev, { busy: null, accounts: endpoint.indexOf("account") >= 0 && acc && acc.accounts ? acc : prev.accounts }); });
            load(false);
          })
          .catch(function (e) { setS(function (prev) { return Object.assign({}, prev, { busy: null, error: String(e.message || e) }); }); });
      }, [rpc, load]);

      /* 登录：rpc login → window.open(url) → 轮询 login-status */
      var startLogin = react.useCallback(function () {
        setS(function (prev) { return Object.assign({}, prev, { loginState: "starting", loginMsg: null }); });
        rpcCall(rpc, "login")
          .then(function (r) {
            try { window.open(r.url, "_blank", "width=520,height=680"); } catch (e) {}
            setS(function (prev) { return Object.assign({}, prev, { loginState: "pending", loginMsg: "浏览器窗口已完成授权后自动回来；若弹窗被拦截，" }); });
            var polls = 0;
            var timer = setInterval(function () {
              polls += 1;
              rpcCall(rpc, "login-status")
                .then(function (ls) {
                  if (ls.state === "complete") {
                    clearInterval(timer);
                    setS(function (prev) { return Object.assign({}, prev, { loginState: "complete", loginMsg: "已登录：" + (ls.email || "?") }); });
                    load(true);
                  } else if (ls.state === "error") {
                    clearInterval(timer);
                    setS(function (prev) { return Object.assign({}, prev, { loginState: "error", loginMsg: ls.error || "登录失败" }); });
                  } else if (polls > 200) {
                    clearInterval(timer);
                    setS(function (prev) { return Object.assign({}, prev, { loginState: "error", loginMsg: "等待超时" }); });
                  }
                })
                .catch(function () {});
            }, 3000);
          })
          .catch(function (e) { setS(function (prev) { return Object.assign({}, prev, { loginState: "error", loginMsg: String(e.message || e) }); }); });
      }, [rpc, load]);

      /* 代理：保存（写 proxy-config.json，host 侧热切换 agent） */
      var proxySave = react.useCallback(function () {
        setS(function (prev) { return Object.assign({}, prev, { busy: "proxy-save", proxyMsg: null }); });
        rpcCall(rpc, "proxy-set", { proxyUrl: s.proxyDraft })
          .then(function (info) {
            setS(function (prev) { return Object.assign({}, prev, {
              busy: null, proxy: info, proxyDraft: info.proxyUrl || "", proxyMsgOk: true,
              proxyMsg: "已保存并立即生效：" + (info.proxyUrl || "直连"),
            }); });
          })
          .catch(function (e) { setS(function (prev) { return Object.assign({}, prev, { busy: null, proxyMsgOk: false, proxyMsg: String(e.message || e) }); }); });
      }, [rpc, s.proxyDraft]);

      /* 代理：用草稿框里的地址（留空 = 直连）做一次真实连通性探测 */
      var proxyTest = react.useCallback(function () {
        setS(function (prev) { return Object.assign({}, prev, { busy: "proxy-test", proxyMsg: null }); });
        rpcCall(rpc, "proxy-test", { proxyUrl: s.proxyDraft })
          .then(function (r) {
            setS(function (prev) { return Object.assign({}, prev, {
              busy: null, proxyMsgOk: !!(r && r.ok), proxyMsg: (r && r.detail) || (r && r.ok ? "可达" : "不可达"),
            }); });
          })
          .catch(function (e) { setS(function (prev) { return Object.assign({}, prev, { busy: null, proxyMsgOk: false, proxyMsg: String(e.message || e) }); }); });
      }, [rpc, s.proxyDraft]);

      var refreshModels = react.useCallback(function () {
        setS(function (prev) { return Object.assign({}, prev, { busy: "refresh-models", syncMsg: null }); });
        rpcCall(rpc, "models", { refresh: true })
          .then(function (res) {
            setS(function (prev) { return Object.assign({}, prev, { busy: null, modelsData: res }); });
          })
          .catch(function (e) {
            setS(function (prev) { return Object.assign({}, prev, { busy: null, syncMsgOk: false, syncMsg: String(e.message || e) }); });
          });
      }, [rpc]);

      var syncModels = react.useCallback(function () {
        setS(function (prev) { return Object.assign({}, prev, { busy: "sync-models", syncMsg: null }); });
        rpcCall(rpc, "sync-models-to-dsh", { refresh: false })
          .then(function (res) {
            setS(function (prev) {
              return Object.assign({}, prev, {
                busy: null,
                syncMsgOk: true,
                syncMsg: "已成功同步 " + res.modelCount + " 个最新模型到 DSH 配置，聊天窗口可直接选用！"
              });
            });
          })
          .catch(function (e) {
            setS(function (prev) { return Object.assign({}, prev, { busy: null, syncMsgOk: false, syncMsg: "同步失败：" + String(e.message || e) }); });
          });
      }, [rpc]);

      react.useEffect(function () {
        var styleEl = document.getElementById("agq-css");
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = "agq-css";
          styleEl.textContent = CSS;
          document.head.appendChild(styleEl);
        }
        load(true);
      }, []);

      var d = s.data;
      var qs = d && d.quotaSummary;
      var geminiG = qs && qs.groups && qs.groups.find(function (g) { return g.group === "gemini"; });
      var thirdG = qs && qs.groups && qs.groups.find(function (g) { return g.group === "non-gemini"; });
      var acc = s.accounts;

      var kids = [
        react.createElement("div", { key: "head" },
          react.createElement("div", { className: "agq-title" }, "Antigravity 直连"),
          react.createElement("div", { className: "agq-sub" },
            d
              ? (d.tier || "?") + " · " + (d.modelCount || 0) + " 个模型 · 默认 " + (d.defaultModel || "—")
              : "代理 127.0.0.1:8790（host 跟随 dsh）")),
      ];

      if (qs && (geminiG || thirdG)) {
        kids.push(react.createElement(PoolCard, { key: "g", group: geminiG }));
        kids.push(react.createElement(PoolCard, { key: "t", group: thirdG }));
      } else if (d && d.pools) {
        kids.push(react.createElement(LegacyPool, { key: "lg", pool: d.pools.gemini }));
        kids.push(react.createElement(LegacyPool, { key: "lt", pool: d.pools.thirdParty }));
      }

      if (d && d.project) {
        kids.push(react.createElement("div", { key: "proj", className: "agq-row" },
          react.createElement("span", null, "project"),
          react.createElement("span", null, d.project)));
      }

      if (s.error) {
        kids.push(react.createElement("div", { key: "err", className: "agq-err" }, "RPC 通道或凭据异常：", s.error));
      }
      if (d && d.errors && d.errors.length) {
        kids.push(react.createElement("div", { key: "uerr", className: "agq-err" }, d.errors.join("; ")));
      }

      /* 模型列表与一键同步 */
      kids.push(react.createElement(ModelsCard, {
        key: "models",
        data: s.modelsData,
        busy: s.busy,
        onRefresh: refreshModels,
        onSync: syncModels,
        syncMsg: s.syncMsg,
        syncMsgOk: s.syncMsgOk,
        expanded: s.modelsExpanded,
        onToggleExpand: function () {
          setS(function (prev) { return Object.assign({}, prev, { modelsExpanded: !prev.modelsExpanded }); });
        }
      }));

      /* 账号区 */
      kids.push(react.createElement("div", { key: "acct-sec", className: "agq-sec" }, "账号"));
      if (acc && acc.accounts) {
        acc.accounts.forEach(function (a) {
          kids.push(react.createElement("div", { key: "acct-" + a.id, className: "agq-acct" },
            react.createElement("span", { className: "agq-acct-mail" }, a.email),
            a.active
              ? react.createElement("span", { className: "agq-acct-active" }, "● 使用中")
              : react.createElement("button", {
                  className: "agq-btn",
                  disabled: !!s.busy,
                  onClick: function () { accountAction("select-account", { id: a.id }, "sel-" + a.id); }
                }, "切换"),
            react.createElement("button", {
              className: "agq-btn danger",
              disabled: !!s.busy,
              onClick: function () { accountAction("remove-account", { id: a.id }, "rm-" + a.id); }
            }, "移除")));
        });
        if (!acc.accounts.length) {
          kids.push(react.createElement("div", { key: "acct-empty", className: "agq-note" }, "账号池为空"));
        }
      } else {
        kids.push(react.createElement("div", { key: "acct-loading", className: "agq-note" }, "账号列表加载中…"));
      }

      kids.push(react.createElement("div", { key: "login-row", style: { display: "flex", alignItems: "center", gap: "8px" } },
        react.createElement("button", {
          className: "agq-refresh",
          disabled: s.loginState === "pending" || s.loginState === "starting",
          onClick: startLogin
        }, s.loginState === "pending" || s.loginState === "starting" ? "等待浏览器授权…" : "＋ 添加账号（Google 登录）"),
        s.loginMsg ? react.createElement("span", { className: "agq-note" }, s.loginMsg) : null));

      /* 网络代理设置 */
      kids.push(react.createElement(ProxyCard, {
        key: "proxy",
        info: s.proxy,
        busy: s.busy,
        draft: s.proxyDraft,
        msg: s.proxyMsg,
        msgOk: s.proxyMsgOk,
        onDraft: function (v) { setS(function (prev) { return Object.assign({}, prev, { proxyDraft: v }); }); },
        onSave: proxySave,
        onTest: proxyTest,
      }));

      kids.push(react.createElement("button", {
        key: "refresh",
        className: "agq-refresh",
        onClick: function () { load(true); },
        disabled: s.loading
      }, s.loading ? "刷新中…" : "刷新额度"));

      return react.createElement("div", { className: "agq-panel" }, kids);
    }

    function apply(ctx) {
      var getRpc = function () {
        var conn = ctx.get ? ctx.get("connection") : ctx.connection;
        return (conn && conn.rpc) || ctx.rpc || (ctx.runtime && ctx.runtime.rpc);
      };

      ctx.slots?.inject?.("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "antigravity-direct",
        order: 21,
        label: () => "Antigravity 直连",
        inject: function () {
          return { rpc: getRpc() };
        }
      }, AntigravityQuotaSettings));
    }

    exports.name = "dsh-antigravity-direct";
    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});
