// Report-only visual + structural audit. Does NOT modify app code —
// reads the live dev server exactly as a real visitor would get it.
// Run: node audit/capture.mjs   (dev server must already be running on :3000)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "screenshots");
const BASE_URL = "http://localhost:3000";

fs.mkdirSync(OUT_DIR, { recursive: true });

const diagnostics = {
  consoleMessages: [], // { page, type, text }
  pageErrors: [], // { page, message }
  failedRequests: [], // { page, url, failure }
  http4xx5xx: [], // { page, url, status }
  sequenceFrames: [], // { url, status }
};

function wireDiagnostics(page, label) {
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "log" || type === "debug" || type === "info") return;
    diagnostics.consoleMessages.push({ page: label, type, text: msg.text() });
  });
  page.on("pageerror", (err) => {
    diagnostics.pageErrors.push({ page: label, message: err.message });
  });
  page.on("requestfailed", (req) => {
    diagnostics.failedRequests.push({
      page: label,
      url: req.url(),
      failure: req.failure()?.errorText ?? "unknown",
    });
  });
  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (status >= 400) {
      diagnostics.http4xx5xx.push({ page: label, url, status });
    }
    if (url.includes("/media/sequence/frame_")) {
      diagnostics.sequenceFrames.push({ url, status });
    }
  });
}

/** Drives real wheel events (works WITH Lenis's lerp instead of fighting a
 * raw window.scrollTo, which Lenis would just override on its next rAF
 * tick) until window.scrollY settles within ~2px of targetY. */
async function settledScrollTo(page, targetY, maxWaitMs = 8000) {
  const start = Date.now();
  let stableCount = 0;
  let lastY = -1;
  while (Date.now() - start < maxWaitMs) {
    const cur = await page.evaluate(() => window.scrollY);
    const diff = targetY - cur;
    if (Math.abs(diff) > 2) {
      const delta = Math.max(-500, Math.min(500, diff));
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(70);
      stableCount = 0;
    } else {
      if (Math.abs(cur - lastY) < 0.5) {
        stableCount++;
        if (stableCount >= 4) break;
      } else {
        stableCount = 0;
      }
      await page.waitForTimeout(110);
    }
    lastY = cur;
  }
  return page.evaluate(() => window.scrollY);
}

async function waitForLoaderToFinish(page) {
  const result = { played: false, timedOut: false };
  try {
    await page.waitForFunction(
      () => window.sessionStorage.getItem("brand:loader-played") === "1",
      { timeout: 15000 }
    );
    result.played = true;
  } catch {
    result.timedOut = true;
  }
  // sessionStorage flips at the START of the wipe transition (--dur-med,
  // 0.8s), not when the Loader actually unmounts (onTransitionEnd) — give
  // it room to finish before treating the page as "settled".
  await page.waitForTimeout(1400);
  return result;
}

async function domSectionAudit(page) {
  return page.evaluate(() => {
    function q(sel) {
      return document.querySelector(sel);
    }
    function qa(sel) {
      return Array.from(document.querySelectorAll(sel));
    }
    function textIncludesAny(sel, needle) {
      return qa(sel).some((el) => el.textContent?.includes(needle));
    }
    function rectOf(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    }

    const heroSection = qa("section")[0] ?? null;

    // Section 2 — Hero
    const hero = {
      hasWordmark: textIncludesAny("h1", "Brand"),
      hasEyebrow: textIncludesAny("span", "SS26"),
      hasMoodline: textIncludesAny("p, span", "Heavy. Cropped. Relentless."),
      hasScrollCue: textIncludesAny("span", "Scroll"),
      hasCanvas: !!heroSection?.querySelector("canvas"),
      hasFallbackImg: !!heroSection?.querySelector('img[width="941"]'),
      hasVideo: !!heroSection?.querySelector("video"),
      rect: rectOf(heroSection),
    };

    // Section 3 — SceneUnfold ("Scene 1")
    const unfoldHeadline = qa("h2").find((el) => el.textContent?.trim() === "Unfold");
    const unfoldSection = unfoldHeadline?.closest("section") ?? null;
    const sceneUnfold = {
      found: !!unfoldSection,
      showsLoadingStub: textIncludesAny("span", "Loading"),
      hasCanvas: !!unfoldSection?.querySelector("canvas"),
      rect: rectOf(unfoldSection),
    };

    // Section 4 — SceneRail ("Scene 2")
    const exploreLinks = qa("a").filter((a) => a.textContent?.trim() === "Explore");
    const sceneRail = {
      exploreLinkCount: exploreLinks.length,
      hasCanvasOverlay: exploreLinks.some(
        (a) => a.closest("section")?.querySelector("canvas")
      ),
    };

    // Section 5 — Lookbook (not expected to exist yet)
    const lookbook = {
      found: !!q('[class*="lookbook" i], [id*="lookbook" i]'),
    };

    // Section 6 — Manifesto
    const manifesto = {
      hasLine1: textIncludesAny("p", "NOT DESIGNED TO BLEND IN."),
      hasLine2: textIncludesAny("p", "BUILT TO TAKE UP SPACE."),
      hasMarquee: textIncludesAny("span", "TAKE UP SPACE"),
      hasVideo: !!q("video"),
    };

    // Section 7 — TheDrop
    const theDropHeading = qa("h2").find((el) =>
      ["ONYX", "BONE", "VENOM", "MONO"].includes(el.textContent?.trim() ?? "")
    );
    const theDrop = {
      hasLatestDropEyebrow: textIncludesAny("span", "Latest Drop"),
      featuredName: theDropHeading?.textContent?.trim() ?? null,
      hasAddToCart: qa("button").some((b) => b.textContent?.trim() === "Add to Cart"),
      detailPanelLabels: qa("span").filter((s) =>
        ["Cuff", "Flatlay"].includes(s.textContent?.trim() ?? "")
      ).map((s) => s.textContent?.trim()),
    };

    // Section 8 — ShopGrid
    const shopSection = q("#shop");
    const shopCards = shopSection ? qa("#shop article") : [];
    const shopGrid = {
      found: !!shopSection,
      heading: shopSection?.querySelector("h2")?.textContent?.trim() ?? null,
      cardCount: shopCards.length,
      cardNames: shopCards.map(
        (c) => c.querySelector("h3")?.textContent?.trim() ?? null
      ),
      hasIndexNumbers: qa("#shop [class*='index' i], #shop [data-index]").length > 0,
      // bento = visibly different cell sizes; plain grid = every card the
      // same aspect-[3/4]. Heuristic: collect distinct rounded heights.
      cardHeights: Array.from(
        new Set(shopCards.map((c) => Math.round(c.getBoundingClientRect().height)))
      ),
    };

    // Section 9 — Footer
    const footer = q("footer");
    const footerColumns = footer ? qa("footer > div") : [];
    const footerAudit = {
      found: !!footer,
      hasJoinCult: textIncludesAny("footer button", "Join the Cult"),
      hasCopyright: !!footer && /\d{4}/.test(footer.textContent ?? ""),
      topLevelChildCount: footerColumns.length,
      hasPolicyLinks: qa("footer a").filter((a) =>
        /privacy|terms|shipping|returns|refund/i.test(a.textContent ?? "")
      ).length,
      hasWhatsApp: /whatsapp/i.test(footer?.textContent ?? ""),
    };

    // Global — cursor / cart drawer / capture modal / sticky nav
    const global = {
      cursorCandidate: !!q(
        '[class*="cursor" i]:not(html):not(body), [data-cursor]'
      ),
      cartDrawerMounted: !!q('[role="dialog"][aria-label="Cart"]'),
      captureModalMounted: !!q('[role="dialog"][aria-label="Join the Cult"]'),
      topNavFound: !!q("header"),
      topNavVisibleNow: (() => {
        const header = q("header");
        if (!header) return null;
        const cls = header.className || "";
        return cls.includes("translate-y-0");
      })(),
    };

    return {
      hero,
      sceneUnfold,
      sceneRail,
      lookbook,
      manifesto,
      theDrop,
      shopGrid,
      footer: footerAudit,
      global,
      bodyScrollWidth: document.documentElement.scrollWidth,
      bodyClientWidth: document.documentElement.clientWidth,
      totalSections: qa("section").length,
    };
  });
}

async function fontAudit(page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const faces = Array.from(document.fonts).map(
      (f) => `${f.family} ${f.weight} [${f.status}]`
    );
    const h1 = document.querySelector("h1");
    return {
      faces,
      clashDisplayCheck: document.fonts.check('600 1em "Clash Display"'),
      spaceGroteskCheck: document.fonts.check('400 1em "Space Grotesk"'),
      h1ComputedFontFamily: h1 ? getComputedStyle(h1).fontFamily : null,
    };
  });
}

async function main() {
  const browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
    ],
  });

  const findings = {};

  // ---------------- A. DESKTOP HOMEPAGE ----------------
  console.log("→ Desktop homepage: navigating + capturing loader...");
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktop = await desktopCtx.newPage();
  wireDiagnostics(desktop, "desktop-home");

  await desktop.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30000 });
  await desktop.screenshot({ path: path.join(OUT_DIR, "desktop_loader.png") });
  findings.loader = await waitForLoaderToFinish(desktop);
  await desktop.waitForTimeout(1500); // let preload-gated pins (SceneUnfold) finish setting up

  findings.fonts = await fontAudit(desktop);

  console.log("→ Desktop: stepping scroll in 100vh increments...");
  const viewportH = 900;
  const scrollHeight = await desktop.evaluate(() => document.body.scrollHeight);
  const maxScroll = Math.max(0, scrollHeight - viewportH);
  const desktopScrollShots = [];
  let i = 0;
  while (true) {
    const targetY = Math.min(i * viewportH, maxScroll);
    await settledScrollTo(desktop, targetY);
    const fname = `desktop_${String(i * 100).padStart(4, "0")}vh.png`;
    await desktop.screenshot({ path: path.join(OUT_DIR, fname) });
    desktopScrollShots.push(fname);
    if (targetY >= maxScroll) break;
    i++;
    if (i > 40) break; // safety cap
  }
  findings.desktopScrollShots = desktopScrollShots;
  findings.desktopScrollHeightPx = scrollHeight;

  // DOM structural audit — do it post-scroll (scroll-triggered `once: true`
  // reveals + framer whileInView have now had a chance to fire), then
  // return to top.
  await settledScrollTo(desktop, 0);
  await desktop.waitForTimeout(300);
  findings.domAudit = await domSectionAudit(desktop);

  console.log("→ Desktop: full-page stitched screenshot...");
  try {
    await desktop.screenshot({
      path: path.join(OUT_DIR, "desktop_full.png"),
      fullPage: true,
      timeout: 45000,
    });
  } catch (err) {
    // Common with a very tall page carrying a live WebGL canvas — Chromium's
    // CDP screenshot capture can fail on the resize-to-full-height step.
    // Not fatal: the incremental 100vh-step shots above already cover the
    // whole page end to end.
    findings.desktopFullPageScreenshotFailed = String(err).split("\n")[0];
    console.log("  (skipped — full-page capture failed, see findings; incremental shots still cover the whole page)");
  }

  // ---------------- C. INTERACTION STATES ----------------
  console.log("→ Interaction states: hover, add-to-cart, capture modal...");
  try {
    const shopSectionHandle = await desktop.$("#shop");
    if (shopSectionHandle) {
      await shopSectionHandle.scrollIntoViewIfNeeded();
      await desktop.waitForTimeout(600); // let the reveal + crossfade settle
    }
    const firstCardMedia = await desktop.$("#shop article > div");
    if (firstCardMedia) {
      await firstCardMedia.hover();
      await desktop.waitForTimeout(500); // --dur-fast crossfade
      await desktop.screenshot({ path: path.join(OUT_DIR, "card_hover.png") });
    } else {
      findings.cardHoverSkipped = true;
    }
  } catch (err) {
    findings.cardHoverError = String(err).split("\n")[0];
  }

  try {
    const addToCartBtn = await desktop.$("#shop article button:not([disabled])");
    if (addToCartBtn) {
      await addToCartBtn.click();
      await desktop.waitForTimeout(700); // framer panel slide-in
      await desktop.screenshot({ path: path.join(OUT_DIR, "cart_drawer.png") });
      const closeBtn = await desktop.$('[aria-label="Close cart"]');
      if (closeBtn) {
        await closeBtn.click();
        await desktop.waitForTimeout(500);
      }
    } else {
      findings.cartDrawerSkipped = true;
    }
  } catch (err) {
    findings.cartDrawerError = String(err).split("\n")[0];
  }

  try {
    const footerHandle = await desktop.$("footer");
    if (footerHandle) {
      await footerHandle.scrollIntoViewIfNeeded();
      await desktop.waitForTimeout(300);
      const joinBtn = await desktop.$("footer button");
      if (joinBtn) {
        await joinBtn.click();
        await desktop.waitForTimeout(700);
        await desktop.screenshot({ path: path.join(OUT_DIR, "modal.png") });
        const closeModalBtn = await desktop.$('[aria-label="Close"]');
        if (closeModalBtn) {
          await closeModalBtn.click();
          await desktop.waitForTimeout(500);
        }
      } else {
        findings.captureModalSkipped = true;
      }
    }
  } catch (err) {
    findings.captureModalError = String(err).split("\n")[0];
  }

  await desktopCtx.close();

  // ---------------- B. MOBILE HOMEPAGE ----------------
  console.log("→ Mobile homepage: navigating + capturing...");
  try {
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await mobileCtx.newPage();
    wireDiagnostics(mobile, "mobile-home");

    await mobile.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30000 });
    await mobile.screenshot({ path: path.join(OUT_DIR, "mobile_loader.png") });
    await waitForLoaderToFinish(mobile);
    await mobile.waitForTimeout(1500);

    const mobileViewportH = 844;
    const mobileScrollHeight = await mobile.evaluate(() => document.body.scrollHeight);
    const mobileMaxScroll = Math.max(0, mobileScrollHeight - mobileViewportH);
    const mobileScrollShots = [];
    let maxScrollWidthSeen = 0;
    let mi = 0;
    while (true) {
      const targetY = Math.min(mi * mobileViewportH, mobileMaxScroll);
      await settledScrollTo(mobile, targetY);
      const widthCheck = await mobile.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      maxScrollWidthSeen = Math.max(maxScrollWidthSeen, widthCheck.scrollWidth);
      const fname = `mobile_${String(mi * 100).padStart(4, "0")}vh.png`;
      await mobile.screenshot({ path: path.join(OUT_DIR, fname) });
      mobileScrollShots.push(fname);
      if (targetY >= mobileMaxScroll) break;
      mi++;
      if (mi > 40) break;
    }
    findings.mobileScrollShots = mobileScrollShots;
    findings.mobileScrollHeightPx = mobileScrollHeight;
    findings.mobileHorizontalOverflow =
      maxScrollWidthSeen > 390 ? maxScrollWidthSeen : null;

    await mobileCtx.close();
  } catch (err) {
    findings.mobilePhaseError = String(err).split("\n")[0];
    console.log("  (mobile phase error, continuing):", findings.mobilePhaseError);
  }

  // ---------------- D. PDP ----------------
  console.log("→ PDP: venom-hoodie + onyx-hoodie...");
  try {
    const pdpCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const pdp = await pdpCtx.newPage();
    wireDiagnostics(pdp, "pdp");

    for (const slug of ["venom-hoodie", "onyx-hoodie"]) {
      try {
        const res = await pdp.goto(`${BASE_URL}/products/${slug}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        findings[`pdp_${slug}_status`] = res?.status() ?? null;
        await pdp.waitForTimeout(1000);
        await pdp.screenshot({
          path: path.join(OUT_DIR, `pdp_${slug.split("-")[0]}.png`),
          fullPage: true,
          timeout: 45000,
        });
      } catch (err) {
        findings[`pdp_${slug}_error`] = String(err).split("\n")[0];
      }
    }
    await pdpCtx.close();
  } catch (err) {
    findings.pdpPhaseError = String(err).split("\n")[0];
  }

  await browser.close();

  fs.writeFileSync(
    path.join(__dirname, "raw-findings.json"),
    JSON.stringify({ findings, diagnostics }, null, 2)
  );
  console.log("\nDone. Raw findings written to audit/raw-findings.json");
  console.log(`Console messages: ${diagnostics.consoleMessages.length}`);
  console.log(`Page errors: ${diagnostics.pageErrors.length}`);
  console.log(`Failed requests: ${diagnostics.failedRequests.length}`);
  console.log(`HTTP 4xx/5xx responses: ${diagnostics.http4xx5xx.length}`);
}

main().catch((err) => {
  console.error("Audit script failed:", err);
  try {
    fs.writeFileSync(
      path.join(__dirname, "raw-findings.json"),
      JSON.stringify({ fatalError: String(err), diagnostics }, null, 2)
    );
  } catch {
    // best-effort
  }
  process.exit(1);
});
