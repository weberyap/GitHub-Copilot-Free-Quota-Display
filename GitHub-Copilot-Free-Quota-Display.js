// ==UserScript==
// @name         GitHub Copilot 免费额度显示（美化 + 主动查询）
// @namespace    https://github.com/weberyap/GitHub-Copilot-Free-Quota-Display
// @version      1.3
// @description  主动查询 GitHub Copilot 免费额度并以美观方式显示，支持免费计划
// @author       weberyap
// @homepageURL  https://github.com/weberyap/GitHub-Copilot-Free-Quota-Display
// @supportURL   https://github.com/weberyap/GitHub-Copilot-Free-Quota-Display/issues
// @match        https://github.com/settings/copilot/**
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const API_URL = 'https://github.com/github-copilot/chat/entitlement';

  function createQuotaBox(data) {
    const { chat = 0, completions = 0, chatPercentage = 0 } = data.quotas.remaining ?? {};
    const resetDate = data.quotas.resetDate ?? "未知";
    const plan = data.plan ?? "未知";

    const chatTotal = chatPercentage ? Math.round(chat / (1 - chatPercentage / 100)) : null;
    const chatUsed = chatTotal !== null ? chatTotal - chat : null;
    const chatPct = chatPercentage || 0;

    const compText = completions ? `${completions} 次剩余` : "不可用";
    const chatText = chatTotal
      ? `${chatUsed} / ${chatTotal} (${chatPct.toFixed(1)}%)`
      : `${chat} 剩余 (${chatPct.toFixed(1)}%)`;

    const box = document.createElement('div');
    box.id = 'copilot-quota-box';
    box.style = `
      background: #f5faff;
      border: 1px solid #1b7eff;
      border-left: 6px solid #1b7eff;
      padding: 1em 1.5em;
      margin: 2em auto;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      max-width: 600px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    `;

    box.innerHTML = `
      <h3 style="margin-top:0">🚀 GitHub Copilot 免费额度</h3>
      <div style="margin-bottom: 0.8em">
        <strong>💬 Chat:</strong> ${chatText}
        <div style="background:#ddd; border-radius:4px; overflow:hidden;">
          <div style="width:${chatPct}%; background:#1b7eff; height:10px;"></div>
        </div>
      </div>
      <div style="margin-bottom: 0.8em">
        <strong>⚡ Completion:</strong> ${compText}
      </div>
      <div>📅 重置时间：${resetDate}</div>
      <div>📦 当前计划：${plan}</div>
      <div style="margin-top: 1em">
        <button id="copilot-refresh" style="
          padding: 6px 12px;
          background-color: #0366d6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">📥 重新查询</button>
      </div>
    `;

    box.querySelector('#copilot-refresh').onclick = () => {
      box.innerHTML = "⏳ 正在重新获取 Copilot 额度...";
      fetchQuota(true);
    };

    return box;
  }

  async function fetchQuota(force = false) {
    try {
      const response = await fetch(API_URL, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': force ? 'no-cache' : 'default'
        }
      });

      if (!response.ok) {
        throw new Error(`Copilot 额度查询失败，状态码：${response.status}`);
      }

      const data = await response.json();
      const existing = document.getElementById('copilot-quota-box');
      const newBox = createQuotaBox(data);

      if (existing) {
        existing.replaceWith(newBox);
      } else {
        const container = document.querySelector('main') || document.body;
        container.prepend(newBox);
      }
    } catch (err) {
      alert(err.message || 'Copilot 额度查询出错');
      console.error(err);
    }
  }

  window.addEventListener('load', () => {
    setTimeout(() => fetchQuota(), 1200);
  });
})();
