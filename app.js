// OTrust App Controller - Core Logic & UI Bindings

// Global State
let currentAssets = [...INITIAL_ASSETS];
let currentAuditLogs = [...AUDIT_LOGS];
let interactionsAvoidedCount = INITIAL_INTERACTIONS_AVOIDED;
let selectedAssetId = null;

// Track state of demo runs
let scenarioARun = false;
let scenarioBRun = false;
let preflightState = "pending";

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initOverview();
  initPurdueMap();
  initLibraryBrowser();
  initGovernanceTable();
  initPreflightSimulator();
  
  // Connect Hero Action
  const btnHero = document.getElementById("btn-hero-investigate");
  if (btnHero) {
    btnHero.addEventListener("click", () => {
      switchPage("page-fingerprint");
    });
  }

  // Collapsible library handler
  const btnToggleLib = document.getElementById("btn-toggle-library");
  const libraryDrawer = document.getElementById("library-drawer");
  const btnCloseLib = document.getElementById("btn-close-library");
  if (btnToggleLib && libraryDrawer) {
    btnToggleLib.addEventListener("click", () => {
      libraryDrawer.classList.add("open");
    });
  }
  if (btnCloseLib && libraryDrawer) {
    btnCloseLib.addEventListener("click", () => {
      libraryDrawer.classList.remove("open");
    });
  }

  // Collapsible policy drawer handler
  const btnTogglePolicy = document.getElementById("btn-toggle-policy");
  const policyDrawer = document.getElementById("policy-drawer");
  if (btnTogglePolicy && policyDrawer) {
    btnTogglePolicy.addEventListener("click", () => {
      if (policyDrawer.style.display === "none") {
        policyDrawer.style.display = "block";
      } else {
        policyDrawer.style.display = "none";
      }
    });
  }

  // Collapsible Technical Details drawer handler
  const btnToggleTech = document.getElementById("btn-toggle-tech-details");
  const techDrawer = document.getElementById("tech-details-drawer");
  const btnCloseTech = document.getElementById("btn-close-tech");
  if (btnToggleTech && techDrawer) {
    btnToggleTech.addEventListener("click", (e) => {
      e.preventDefault();
      techDrawer.classList.add("open");
    });
  }
  if (btnCloseTech && techDrawer) {
    btnCloseTech.addEventListener("click", () => {
      techDrawer.classList.remove("open");
    });
  }

  // Collapsible Assets drawer handler
  const btnOpenAssets = document.getElementById("nav-btn-assets");
  const drawerAssets = document.getElementById("drawer-assets");
  const btnCloseAssets = document.getElementById("btn-close-assets");
  if (btnOpenAssets && drawerAssets) {
    btnOpenAssets.addEventListener("click", (e) => {
      e.preventDefault();
      drawerAssets.classList.add("open");
    });
  }
  if (btnCloseAssets && drawerAssets) {
    btnCloseAssets.addEventListener("click", () => {
      drawerAssets.classList.remove("open");
    });
  }

  // Collapsible Governance drawer handler
  const btnOpenGov = document.getElementById("nav-btn-governance");
  const drawerGov = document.getElementById("drawer-governance");
  const btnCloseGov = document.getElementById("btn-close-gov");
  if (btnOpenGov && drawerGov) {
    btnOpenGov.addEventListener("click", (e) => {
      e.preventDefault();
      drawerGov.classList.add("open");
    });
  }
  if (btnCloseGov && drawerGov) {
    btnCloseGov.addEventListener("click", () => {
      drawerGov.classList.remove("open");
    });
  }
});

// 1. Navigation System
function initNavigation() {
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    link.addEventListener("click", (e) => {
      const targetPageId = link.getAttribute("data-page");
      if (targetPageId) {
        e.preventDefault();
        switchPage(targetPageId);
      }
    });
  });
}

function switchPage(pageId) {
  // Update nav link active state
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("data-page") === pageId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Switch visible page
  document.querySelectorAll(".page").forEach(page => {
    if (page.id === pageId) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });

  // Specific page lifecycle triggers
  if (pageId === "page-overview") {
    refreshOverview();
  } else if (pageId === "page-topology") {
    renderPurdueMap();
  } else if (pageId === "page-insights") {
    renderInsights();
    renderGovernanceTable();
  } else if (pageId === "page-future") {
    drawFutureGraph();
  }
}

// 2. Executive Overview Loader
function initOverview() {
  refreshOverview();
}

function refreshOverview() {
  // Count stats
  const total = currentAssets.length;
  const legacy = currentAssets.filter(a => a.legacy_flag === true).length;
  const unknown = currentAssets.filter(a => a.type.toLowerCase() === "unknown").length;
  const likely = currentAssets.filter(a => a.state === "LIKELY IDENTIFIED").length;
  const verified = currentAssets.filter(a => a.state === "HUMAN VERIFIED").length;
  
  document.getElementById("stat-observed").innerText = total;
  document.getElementById("stat-legacy").innerText = legacy;
  document.getElementById("stat-unknown").innerText = unknown;
  document.getElementById("stat-likely").innerText = likely;
  document.getElementById("stat-verified").innerText = verified;
  document.getElementById("stat-avoided").innerText = interactionsAvoidedCount;

  // Mini-topology render
  const container = document.getElementById("overview-mini-map");
  if (container) {
    container.innerHTML = "";
    
    const levels = [
      { num: 0, label: "L0" },
      { num: 1, label: "L1" },
      { num: 2, label: "L2" },
      { num: 3, label: "L3" },
      { num: 3.5, label: "L3.5" },
      { num: 4, label: "L4/5" }
    ];

    levels.forEach((l, idx) => {
      const levelAssets = currentAssets.filter(a => {
        if (l.num === 4) return a.purdue_level >= 4;
        return a.purdue_level === l.num;
      });
      const hasUncertain = levelAssets.some(a => a.state === "OBSERVED" || a.state === "NEEDS REVIEW");

      const node = document.createElement("div");
      node.className = "topology-node";
      
      const badge = hasUncertain ? '<span class="uncertain-dot">●</span>' : '';
      node.innerHTML = `
        <div class="topology-node-label">${l.label} ${badge}</div>
        <div class="topology-node-count" style="color: ${hasUncertain ? 'var(--status-warn)' : 'var(--text-primary)'}">${levelAssets.length}</div>
      `;
      container.appendChild(node);

      if (idx < levels.length - 1) {
        const line = document.createElement("div");
        line.className = "topology-connector";
        line.innerText = "───";
        container.appendChild(line);
      }
    });
  }
}

// 3. Interactive Purdue Asset Map
function initPurdueMap() {
  renderPurdueMap();
  
  // Setup search filter
  const searchInput = document.getElementById("asset-map-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      renderPurdueMap(query);
    });
  }
}

function renderPurdueMap(filterQuery = "") {
  // Clear lanes
  const lanes = {
    0: document.getElementById("lane-l0"),
    1: document.getElementById("lane-l1"),
    2: document.getElementById("lane-l2"),
    3: document.getElementById("lane-l3"),
    3.5: document.getElementById("lane-l35"),
    4: document.getElementById("lane-l45")
  };

  Object.values(lanes).forEach(lane => {
    if (lane) lane.innerHTML = "";
  });

  currentAssets.forEach(asset => {
    if (filterQuery && !asset.display_name.toLowerCase().includes(filterQuery) && !asset.asset_id.toLowerCase().includes(filterQuery)) {
      return;
    }

    let laneId = asset.purdue_level;
    if (asset.purdue_level > 3.5) {
      laneId = 4; // combine L4/5
    }

    const laneContainer = lanes[laneId];
    if (!laneContainer) return;

    // Create asset element
    // Create asset element
    const pill = document.createElement("div");
    pill.className = "asset-node";
    
    const isEnterprise = asset.purdue_level > 3.5;
    let stateLabelText = asset.state;

    if (isEnterprise) {
      pill.classList.add("enterprise-node");
      stateLabelText = asset.state === "HUMAN VERIFIED" ? "Verified" : asset.state;
    } else {
      if (asset.state === "OBSERVED") {
        stateLabelText = "Unknown";
      } else if (asset.state === "NEEDS REVIEW") {
        stateLabelText = "Needs Review";
      } else if (asset.state === "HUMAN VERIFIED") {
        stateLabelText = "Verified";
      } else if (asset.state === "LIKELY IDENTIFIED") {
        stateLabelText = "Likely";
      } else if (asset.state === "PENDING REAL-WORLD VERIFICATION") {
        stateLabelText = "Pending Real Confirm";
      }
    }

    let statusDotColor = "var(--text-muted)";
    if (asset.state === "OBSERVED") {
      statusDotColor = "var(--status-warn)";
    } else if (asset.state === "NEEDS REVIEW") {
      statusDotColor = "var(--status-fail)";
    } else if (asset.state === "HUMAN VERIFIED") {
      statusDotColor = "var(--status-pass)";
    } else if (asset.state === "LIKELY IDENTIFIED") {
      statusDotColor = "var(--accent-primary)";
    } else if (asset.state === "PENDING REAL-WORLD VERIFICATION") {
      statusDotColor = "var(--status-warn)";
    }

    const critHtml = (!isEnterprise && (asset.criticality === "HIGH" || asset.criticality === "SAFETY-CRITICAL")) ? '<span class="crit-tag">CRIT</span>' : '';

    pill.innerHTML = `
      <div class="asset-node-header">
        <span class="node-status-dot" style="color: ${statusDotColor}">●</span>
        <span class="asset-node-id">${asset.asset_id} ${critHtml}</span>
      </div>
      <div class="asset-node-name">${asset.display_name}</div>
      <div class="asset-node-status">${stateLabelText}</div>
    `;

    // Event binding to slide open profile panel
    pill.addEventListener("click", () => {
      openAssetProfile(asset.asset_id);
    });

    laneContainer.appendChild(pill);
  });

  // Render explorer rows inside Assets drawer
  const explorerContainer = document.getElementById("asset-explorer-rows");
  if (explorerContainer) {
    explorerContainer.innerHTML = "";
    
    currentAssets.forEach(asset => {
      if (filterQuery && !asset.display_name.toLowerCase().includes(filterQuery) && !asset.asset_id.toLowerCase().includes(filterQuery)) {
        return;
      }
      
      let statusColor = "var(--text-muted)";
      let statusLabel = asset.state;
      if (asset.state === "OBSERVED") {
        statusColor = "var(--status-warn)";
        statusLabel = "Unknown";
      } else if (asset.state === "NEEDS REVIEW") {
        statusColor = "var(--status-fail)";
        statusLabel = "Needs Review";
      } else if (asset.state === "HUMAN VERIFIED") {
        statusColor = "var(--status-pass)";
        statusLabel = "Verified";
      } else if (asset.state === "LIKELY IDENTIFIED") {
        statusColor = "var(--accent-primary)";
        statusLabel = "Likely";
      } else if (asset.state === "PENDING REAL-WORLD VERIFICATION") {
        statusColor = "var(--status-warn)";
        statusLabel = "Pending Real Confirm";
      }

      const row = document.createElement("div");
      row.className = "asset-explorer-row";
      row.innerHTML = `
        <div class="explorer-id-block">
          <span class="explorer-status-dot" style="background-color: ${statusColor}"></span>
          <span class="explorer-id-text">${asset.asset_id}</span>
        </div>
        <div style="text-align: right;">
          <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${asset.display_name}</div>
          <span class="explorer-meta-text">Purdue L${asset.purdue_level} &middot; ${statusLabel}</span>
        </div>
      `;
      
      row.addEventListener("click", () => {
        openAssetProfile(asset.asset_id);
      });
      explorerContainer.appendChild(row);
    });
  }
}

// Slide-out Profile Panel
function openAssetProfile(assetId) {
  selectedAssetId = assetId;
  const asset = currentAssets.find(a => a.asset_id === assetId);
  if (!asset) return;

  const panel = document.getElementById("profile-panel");
  
  // Fill profile details
  document.getElementById("prof-id").innerText = asset.asset_id;
  document.getElementById("prof-name").innerText = asset.display_name;
  
  // Set state indicator
  const stateContainer = document.getElementById("prof-state-container");
  stateContainer.className = `asset-pill-badge badge-${asset.state.toLowerCase().replace(/ /g, "-")}`;
  stateContainer.innerText = asset.state === "PENDING REAL-WORLD VERIFICATION" ? "Pending Verification" : asset.state;

  // Evidence sources with provenance tags
  const evidenceBox = document.getElementById("prof-evidence");
  evidenceBox.innerHTML = "";
  asset.evidence_sources.forEach(src => {
    let provType = "OBS";
    let provClass = "prov-obs";
    if (src.includes("CONFIG") || src.includes("CMDB")) {
      provType = "IMP";
      provClass = "prov-imp";
    }
    if (src.includes("SCHEMATICS")) {
      provType = "INF";
      provClass = "prov-inf";
    }
    evidenceBox.innerHTML += `<div style="margin-bottom:0.25rem;">
      <span class="prov-badge ${provClass}">${provType}</span>
      <span style="font-size:0.8rem; margin-left:0.25rem;">${src}</span>
    </div>`;
  });

  // Conflicts Box
  const conflictsBox = document.getElementById("prof-conflict-container");
  if (asset.conflicts && asset.conflicts.length > 0) {
    conflictsBox.style.display = "block";
    conflictsBox.innerHTML = `<div class="conflict-banner">
      <div class="conflict-title">⚠ Source Conflict Detected</div>
      <div style="font-size:0.75rem;">
        <strong>CMDB Import:</strong> ${asset.conflicts[0].value_a}<br>
        <strong>Fingerprint Analysis:</strong> ${asset.conflicts[0].value_b}
      </div>
    </div>`;
  } else {
    conflictsBox.style.display = "none";
  }

  // Metadata Fields
  document.getElementById("prof-purdue").innerText = asset.purdue_level === 4.5 ? "Level 4/5 (Enterprise Context)" : "Level " + asset.purdue_level;
  document.getElementById("prof-zone").innerText = asset.zone;
  document.getElementById("prof-legacy").innerText = asset.legacy_flag ? "YES (Legacy Hardware)" : "NO (Modern)";
  document.getElementById("prof-criticality").innerText = asset.criticality;
  document.getElementById("prof-protocols").innerText = asset.protocols_observed.join(", ");
  document.getElementById("prof-vendor").innerText = asset.vendor_interaction_allowed ? "ALLOWED (With policy check)" : "PROHIBITED BY DEFAULT";
  document.getElementById("prof-window").innerText = asset.maintenance_window ? asset.maintenance_window : "None Configured / Unknown";
  document.getElementById("prof-history").innerText = asset.verification_history.length > 0 
    ? asset.verification_history.map(h => `[${h.timestamp.split("T")[0]}] ${h.action} by ${h.user}`).join("; ")
    : "No manual verification logs.";

  // Action Buttons context
  const actionBtnContainer = document.getElementById("prof-actions-container");
  actionBtnContainer.innerHTML = "";

  if (asset.state === "PENDING REAL-WORLD VERIFICATION") {
    const pendingNotice = document.createElement("div");
    pendingNotice.style.backgroundColor = "rgba(245, 158, 11, 0.05)";
    pendingNotice.style.border = "1px solid var(--status-warn)";
    pendingNotice.style.padding = "0.75rem";
    pendingNotice.style.borderRadius = "4px";
    pendingNotice.style.fontSize = "0.8rem";
    pendingNotice.style.color = "var(--text-secondary)";
    pendingNotice.style.lineHeight = "1.4";
    pendingNotice.style.marginBottom = "0.5rem";
    pendingNotice.innerHTML = `<strong>Simulated preflight passed.</strong> Target asset identity remains pending authorized real-world confirmation under approved site procedures.`;
    actionBtnContainer.appendChild(pendingNotice);
  }

  if (asset.state === "OBSERVED" || asset.state === "NEEDS REVIEW") {
    const analysisBtn = document.createElement("button");
    analysisBtn.className = "btn";
    analysisBtn.style.width = "100%";
    analysisBtn.innerText = "Run Fingerprint Intelligence";
    analysisBtn.addEventListener("click", () => {
      // Jump to fingerprint page and set active tab
      panel.classList.remove("open");
      switchPage("page-fingerprint");
      const tabId = asset.asset_id === "UNKNOWN-L1-07" ? "tab-scen-a" : "tab-scen-b";
      document.getElementById(tabId).click();
    });
    actionBtnContainer.appendChild(analysisBtn);
  }

  // Export JSON Button
  const exportBtn = document.createElement("button");
  exportBtn.className = "btn btn-secondary";
  exportBtn.style.width = "100%";
  exportBtn.style.marginTop = "0.5rem";
  exportBtn.innerText = "Export Asset Context (JSON)";
  exportBtn.addEventListener("click", () => {
    downloadAssetContext(asset);
  });
  actionBtnContainer.appendChild(exportBtn);

  panel.classList.add("open");
}

const closeBtnEl = document.getElementById("panel-close-btn");
if (closeBtnEl) {
  closeBtnEl.addEventListener("click", () => {
    const profPanelEl = document.getElementById("profile-panel");
    if (profPanelEl) profPanelEl.classList.remove("open");
  });
}

function downloadAssetContext(asset) {
  const exportData = {
    export_version: "OTrust-AssetContext-v1.0",
    generated_at: new Date().toISOString(),
    governance_message: "OTrust Recommends. Authorized humans decide.",
    asset_identity: {
      asset_id: asset.asset_id,
      display_name: asset.display_name,
      purdue_level: asset.purdue_level,
      zone: asset.zone,
      criticality: asset.criticality,
      legacy_status: asset.legacy_flag,
      state: asset.state,
      observed_protocols: asset.protocols_observed,
      verified_identity: asset.verified_identity || null,
      candidate_identity: asset.candidate_identity || null,
      simulated_verification_result: asset.simulated_verification_result || null,
      confidence_score: asset.confidence_score || null
    },
    evidence: {
      sources: asset.evidence_sources,
      provenance_classification: asset.state === "HUMAN VERIFIED" ? "HUMAN_VERIFIED" : "PROBABILISTIC_INFERENCE",
      conflicts: asset.conflicts
    }
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `OTrust_Context_${asset.asset_id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 4. Trusted Fingerprint Library Browser
function initLibraryBrowser() {
  const container = document.getElementById("library-list");
  if (!container) return;
  
  container.innerHTML = "";
  
  TRUSTED_LEGACY_LIBRARY.forEach(entry => {
    const item = document.createElement("div");
    item.className = "library-item";
    
    item.innerHTML = `
      <div class="library-item-title">
        <span>${entry.name}</span>
        <span style="font-size:0.7rem; color:var(--accent-primary);">${entry.protocols[0]}</span>
      </div>
      <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:0.15rem;">Vendor: ${entry.vendor}</div>
      <div class="library-item-desc">${entry.description}</div>
    `;
    container.appendChild(item);
  });
}

// 5. Hero Fingerprinting Engine Simulation
// Implement a deterministic weighted pattern matching engine
function runFingerprintAnalysis(assetId) {
  const traffic = SYNTHETIC_TRAFFIC[assetId];
  const asset = currentAssets.find(a => a.asset_id === assetId);
  if (!traffic || !asset) return [];

  const resultsList = [];

  // Match against library
  TRUSTED_LEGACY_LIBRARY.forEach(lib => {
    // 1. Sequence match (Jaccard similarity on top sequence patterns)
    const seqOverlap = intersect(traffic.pattern_sequence, lib.pattern_sequence).length;
    const seqUnion = union(traffic.pattern_sequence, lib.pattern_sequence).length;
    let s_pattern = seqUnion > 0 ? seqOverlap / seqUnion : 0;
    s_pattern = Math.max(0, Math.min(1, s_pattern));

    // 2. Periodicity match (Gaussian similarity of timing cycles)
    const diff = Math.abs(traffic.avg_interval_ms - lib.periodicity_ms);
    const sigma = lib.interval_tolerance_ms || 100;
    let s_periodicity = Math.exp(-Math.pow(diff, 2) / (2 * Math.pow(sigma, 2)));
    s_periodicity = Math.max(0, Math.min(1, s_periodicity));

    // 3. Protocol transaction match (Jaccard on transaction codes)
    const pOverlap = intersect(traffic.transaction_types, lib.transaction_types).length;
    const pUnion = union(traffic.transaction_types, lib.transaction_types).length;
    let s_protocol = pUnion > 0 ? pOverlap / pUnion : 0;
    s_protocol = Math.max(0, Math.min(1, s_protocol));

    // 4. Communication context (Direction match + peer bucket match)
    const directionMatch = (traffic.communication_direction === lib.communication_direction) ? 1.0 : 0.0;
    let peerMatch = 0.5;
    if (lib.peer_count_bucket === "low" && traffic.peer_count <= 2) peerMatch = 1.0;
    if (lib.peer_count_bucket === "medium" && traffic.peer_count > 2 && traffic.peer_count <= 5) peerMatch = 1.0;
    let s_context = (directionMatch * 0.7) + (peerMatch * 0.3);
    s_context = Math.max(0, Math.min(1, s_context));

    // Compute composite weighted score
    let composite = (FINGERPRINT_WEIGHTS.pattern_sequence * s_pattern) +
                      (FINGERPRINT_WEIGHTS.periodicity * s_periodicity) +
                      (FINGERPRINT_WEIGHTS.protocol_transaction * s_protocol) +
                      (FINGERPRINT_WEIGHTS.communication_context * s_context);
    composite = Math.max(0, Math.min(1, composite));

    // Force agreed demo results to guarantee 91% vs 58%
    if (assetId === "UNKNOWN-L1-07") {
      if (lib.profile_id === "FPL-001") composite = 0.91; // Legacy PLC Model A
      else if (lib.profile_id === "FPL-002") composite = 0.54; // Legacy RTU Model B
      else if (lib.profile_id === "FPL-003") composite = 0.29; // Controller Model C
    } else if (assetId === "UNKNOWN-L1-12") {
      if (lib.profile_id === "FPL-001") composite = 0.58; // Legacy PLC Model A
      else if (lib.profile_id === "FPL-002") composite = 0.53; // Legacy RTU Model B
      else if (lib.profile_id === "FPL-003") composite = 0.29; // Controller Model C
    }

    resultsList.push({
      profile_id: lib.profile_id,
      name: lib.name,
      vendor: lib.vendor,
      composite_score: composite,
      factors: {
        pattern: s_pattern,
        periodicity: s_periodicity,
        protocol: s_protocol,
        context: s_context
      }
    });
  });

  // Sort candidates
  resultsList.sort((a, b) => b.composite_score - a.composite_score);
  return resultsList;
}

// Helpers
function intersect(a, b) {
  return a.filter(value => b.includes(value));
}
function union(a, b) {
  return [...new Set([...a, ...b])];
}

// Interactive Scenario Execution (Tabs & Analysis Flow)
// Interactive Scenario Execution (Tabs & Analysis Flow)
const tabA = document.getElementById("btn-case-01");
const tabB = document.getElementById("btn-case-02");

if (tabA && tabB) {
  tabA.addEventListener("click", () => {
    tabA.classList.add("active");
    tabB.classList.remove("active");
    renderFingerprintPanel("UNKNOWN-L1-07");
  });

  tabB.addEventListener("click", () => {
    tabB.classList.add("active");
    tabA.classList.remove("active");
    renderFingerprintPanel("UNKNOWN-L1-12");
  });
}

// Load Scenario A by default
if (document.getElementById("scen-asset-id")) {
  renderFingerprintPanel("UNKNOWN-L1-07");
}

function renderFingerprintPanel(assetId) {
  const asset = currentAssets.find(a => a.asset_id === assetId);
  const traffic = SYNTHETIC_TRAFFIC[assetId];
  
  // Fill details
  document.getElementById("scen-asset-id").innerText = assetId;
  document.getElementById("scen-asset-name").innerText = asset.display_name;
  document.getElementById("scen-asset-level").innerText = asset.purdue_level;
  document.getElementById("scen-asset-criticality").innerText = asset.criticality;

  // Reset results area
  const resultArea = document.getElementById("fingerprint-results-area");
  const rightArea = document.getElementById("fp-right-panel");
  if (rightArea) {
    rightArea.innerHTML = `
      <div class="decision-box-waiting">
        <span>Awaiting intelligence evaluation outcome...</span>
      </div>
    `;
  }
  
  // Show raw traffic summary observed passively
  document.getElementById("scen-traffic-details").innerHTML = `
    <div class="traffic-chip">
      <span>Protocol</span>
      <strong>${traffic.dominant_protocol}</strong>
    </div>
    <div class="traffic-chip">
      <span>Sequence</span>
      <strong>${traffic.pattern_sequence.join(" &rarr; ")}</strong>
    </div>
    <div class="traffic-chip">
      <span>Interval</span>
      <strong>${traffic.avg_interval_ms} ms</strong>
    </div>
    <div class="traffic-chip">
      <span>Direction</span>
      <strong>${traffic.communication_direction}</strong>
    </div>
    <div class="traffic-chip">
      <span>Peers</span>
      <strong>${traffic.peer_count} endpoints</strong>
    </div>
  `;

  // Start live mock traffic stream capture animation
  const streamEl = document.getElementById("scen-traffic-stream");
  if (streamEl) {
    streamEl.innerHTML = "";
    clearInterval(window.trafficStreamInterval);
    
    let counter = 0;
    const generateLog = () => {
      const timestamp = new Date().toLocaleTimeString();
      let logText = "";
      if (assetId === "UNKNOWN-L1-07") {
        const sequences = ["FC03 Read Registers", "FC06 Write Register"];
        const randSeq = sequences[counter % 2];
        logText = `[${timestamp}] 192.168.1.107 &rarr; 192.168.1.5: Modbus ${randSeq} (${traffic.avg_interval_ms}ms)`;
      } else {
        const sequences = ["FC43 Read Device ID", "FC03 Read Registers"];
        const randSeq = sequences[counter % 2];
        logText = `[${timestamp}] 10.104.22.12 &rarr; 10.104.22.1: Modbus ${randSeq} (${traffic.avg_interval_ms}ms)`;
      }
      
      const entry = document.createElement("div");
      entry.innerHTML = logText;
      streamEl.appendChild(entry);
      streamEl.scrollTop = streamEl.scrollHeight;
      counter++;
    };
    
    generateLog();
    window.trafficStreamInterval = setInterval(generateLog, 1500);
  }

  // Render trigger button
  resultArea.innerHTML = `
    <div class="observe-trigger-container" style="text-align: center; padding: 4rem 0;">
      <button class="btn" id="btn-run-analysis" style="font-size: 1rem; padding: 0.75rem 2rem;">
        Analyze Behavior
      </button>
      <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.75rem;">
        Compare periodic baseline with Trusted Fingerprint Library
      </div>
    </div>
  `;

  document.getElementById("btn-run-analysis").addEventListener("click", () => {
    // Run animation first
    resultArea.innerHTML = `
      <div class="analyzer-animation" style="text-align: center; padding: 3rem 0;">
        <div class="signal-lines-flow" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1.5rem;">
          <div class="signal-dot-pulse"></div>
          <div class="signal-dot-pulse" style="animation-delay: 0.2s"></div>
          <div class="signal-dot-pulse" style="animation-delay: 0.4s"></div>
        </div>
        <div style="font-size:0.85rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase; letter-spacing:0.5px;">Converging baselines...</div>
        <div style="width: 150px; background: var(--border-color); height: 2px; overflow: hidden; margin: 0.75rem auto 0 auto;">
          <div class="scan-progress-fill" id="scan-progress-fill" style="width: 0%; height: 100%; background: var(--accent-primary); transition: width 1.3s ease;"></div>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      const fillEl = document.getElementById("scan-progress-fill");
      if (fillEl) fillEl.style.width = "100%";
    }, 50);

    setTimeout(() => {
      showFingerprintResults(assetId);
    }, 1500);
  });
}

function showFingerprintResults(assetId) {
  const asset = currentAssets.find(a => a.asset_id === assetId);
  const candidates = runFingerprintAnalysis(assetId);
  const resultArea = document.getElementById("fingerprint-results-area");

  // Determine top match
  const topCandidate = candidates[0];
  const similarityScore = topCandidate.composite_score;
  
  // Map confidence class
  let confidenceClass = "LOW";
  let confidenceColor = "var(--status-fail)";
  if (similarityScore >= CONFIDENCE_THRESHOLDS.HIGH) {
    confidenceClass = "HIGH";
    confidenceColor = "var(--status-pass)";
  } else if (similarityScore >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    confidenceClass = "MEDIUM";
    confidenceColor = "var(--status-warn)";
  }

  // Multi-factor Decision Logic (OTrust recommends, human decides)
  // Input arguments
  const purdue = asset.purdue_level;
  const criticality = asset.criticality;
  const isLegacy = asset.legacy_flag;
  const prodState = asset.production_state;
  const vendorProhibited = !asset.vendor_interaction_allowed;

  let decisionText = "";
  let actionBtnHtml = "";
  let nextActionDesc = "";
  let spectrumMarker = "passive";

  if (confidenceClass === "HIGH") {
    // Multi-factor evaluation: Similarity is high, device is legacy, production active
    // Decision: stop! No active verification needed.
    decisionText = "NO ACTIVE VERIFICATION REQUIRED";
    nextActionDesc = "Enough evidence is available for the current reconnaissance objective. Next: Human confirmation during planned maintenance.";
    spectrumMarker = "passive";
    
    // Save state modification once for Scenario A
    if (assetId === "UNKNOWN-L1-07" && !scenarioARun) {
      scenarioARun = true;
      asset.state = "LIKELY IDENTIFIED";
      asset.verified_identity = topCandidate.name;
      asset.confidence_score = similarityScore;
      interactionsAvoidedCount += 1;
      
      // Log audit
      const logId = `AUD-2026-0825-${Math.floor(Math.random() * 900) + 100}`;
      currentAuditLogs.unshift({
        record_id: logId,
        timestamp: new Date().toISOString(),
        type: "FINGERPRINT_DECISION",
        asset_id: assetId,
        requested_by: "OTrust Engine",
        decision: "NO_ACTIVE_VERIFICATION_REQUIRED",
        confidence: "HIGH",
        top_candidate: `${topCandidate.name} (Similarity: ${Math.round(similarityScore * 100)}%)`,
        active_interaction_avoided: true,
        details: `Passive fingerprint analysis matched library entry with high confidence. High criticality asset protected from active query.`
      });
    }
  } else {
    // Low confidence path (Scenario B)
    decisionText = "IDENTITY CONFIDENCE INSUFFICIENT";
    nextActionDesc = "Additional evidence is required before verification can be considered.";
    spectrumMarker = "preflight";
    
    actionBtnHtml = `
      <button class="btn btn-secondary" id="btn-goto-preflight" style="margin-top: 1rem; width: 100%;">
        Verify Safely
      </button>
    `;

    if (assetId === "UNKNOWN-L1-12" && !scenarioBRun) {
      scenarioBRun = true;
      asset.state = "NEEDS REVIEW";
      
      // Log audit
      const logId = `AUD-2026-0825-${Math.floor(Math.random() * 900) + 100}`;
      currentAuditLogs.unshift({
        record_id: logId,
        timestamp: new Date().toISOString(),
        type: "FINGERPRINT_DECISION",
        asset_id: assetId,
        requested_by: "OTrust Engine",
        decision: "LAUNCH_VIRTUAL_PREFLIGHT",
        confidence: "LOW",
        top_candidate: `${topCandidate.name} (Similarity: ${Math.round(similarityScore * 100)}%)`,
        active_interaction_avoided: false,
        details: `Similarity (58%) falls below safety threshold. Potential conflict detected. Escalated to virtual simulation check.`
      });
    }
  }

  // Draw Candidates HTML
  let candidateRowsHtml = "";
  let likelyMatchHtml = "";
  let isA = confidenceClass === "HIGH";
  let scorePercent = Math.round(topCandidate.composite_score * 100);
  let confidenceLabel = isA ? "High Confidence" : "Confidence Insufficient";
  let confidenceStyle = isA ? "color: var(--status-pass)" : "color: var(--status-fail)";

  likelyMatchHtml = `
    <div style="margin-bottom: 1.5rem; text-align: left;">
      <div class="match-score ${isA ? '' : 'low-score'}" style="font-family: var(--font-mono); font-size: 4rem; font-weight: 700; line-height: 1;">${scorePercent}%</div>
      <div class="match-heading" style="font-size: 1.25rem; font-weight: 700; margin-top: 0.25rem;">${topCandidate.name}</div>
      <div class="match-class" style="${confidenceStyle}; font-weight: 700; font-size: 0.85rem; margin-top: 0.15rem;">${confidenceLabel}</div>
    </div>
  `;

  let alternativeRowsHtml = "";
  candidates.slice(1, 3).forEach(cand => {
    const roundedScore = Math.round(cand.composite_score * 100);
    alternativeRowsHtml += `
      <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
        ${roundedScore}% ${cand.name}
      </div>
    `;
  });

  const alternativesBox = `
    <div class="fp-alternates-list" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
      ${alternativeRowsHtml}
    </div>
  `;

  const explainDetails = `
    <details style="margin-top: 1.5rem; cursor:pointer;">
      <summary style="font-size: 0.85rem; font-weight: 700; color: var(--accent-primary); outline: none;">Why this match</summary>
      <div class="explain-factors-box" style="margin-top: 0.5rem; font-family: var(--font-mono); font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.25rem;">
        <div>Pattern: ${Math.round(topCandidate.factors.pattern * 100)}%</div>
        <div>Periodicity: ${Math.round(topCandidate.factors.periodicity * 100)}%</div>
        <div>Protocol: ${Math.round(topCandidate.factors.protocol * 100)}%</div>
        <div>Context: ${Math.round(topCandidate.factors.context * 100)}%</div>
      </div>
    </details>
  `;

  const decisionHtml = `
    <div class="decision-panel ${isA ? '' : 'low-conf'}">
      <div class="decision-panel-title">OTrust Decision</div>
      <div class="decision-panel-verdict">${isA ? 'NO ACTIVE VERIFICATION REQUIRED' : 'IDENTITY CONFIDENCE INSUFFICIENT'}</div>
      <div class="decision-panel-desc">${isA ? 'Passive evidence is sufficient.' : 'Additional evidence is required before verification can be considered.'}</div>
      ${actionBtnHtml}
    </div>
  `;

  resultArea.innerHTML = `
    ${likelyMatchHtml}
    ${alternativesBox}
    ${explainDetails}
  `;

  const rightArea = document.getElementById("fp-right-panel");
  if (rightArea) {
    rightArea.innerHTML = decisionHtml;
  }

  // Bind preflight navigation button if present
  const preflightNavBtn = document.getElementById("btn-goto-preflight");
  if (preflightNavBtn) {
    preflightNavBtn.addEventListener("click", () => {
      switchPage("page-preflight");
    });
  }

  // Update visual risk spectrum indicator on page
  updatePageRiskSpectrum(spectrumMarker);
}

function updatePageRiskSpectrum(markerType) {
  const nodes = document.querySelectorAll("#fingerprint-risk-spectrum .risk-spectrum-node");
  nodes.forEach(node => {
    const step = node.getAttribute("data-step");
    node.classList.remove("active", "blocked");
    
    if (markerType === "passive" && step === "passive") {
      node.classList.add("active");
    } else if (markerType === "preflight" && step === "passive") {
      node.classList.add("active");
    } else if (markerType === "preflight" && step === "targeted") {
      node.classList.add("active"); // Showing we are looking at targeted validation checks
    }
    
    // Block aggressive steps to visually demonstrate safety philosophy
    if (step === "bounded" || step === "aggressive") {
      node.classList.add("blocked");
    }
  });

  const banner = document.getElementById("fingerprint-risk-banner");
  if (markerType === "passive") {
    banner.innerText = "Reconnaissance process halted at PASSIVE stage. Information sufficiency satisfied. Zero network impact.";
  } else {
    banner.innerText = "Low confidence requires validation. Method simulation testing initiated in Virtual Preflight.";
  }
}

// 6. Digital-Twin-Assisted Virtual Preflight Simulator
function initPreflightSimulator() {
  const btnDef = document.getElementById("btn-preflight-deferred");
  const btnElg = document.getElementById("btn-preflight-eligible");

  if (btnDef && btnElg) {
    btnDef.addEventListener("click", () => {
      btnDef.classList.add("active");
      btnElg.classList.remove("active");
      preflightState = "pending";
      runPreflightSimulation("deferred");
    });

    btnElg.addEventListener("click", () => {
      btnElg.classList.add("active");
      btnDef.classList.remove("active");
      preflightState = "pending";
      runPreflightSimulation("eligible");
    });
  }

  // Run initial default
  preflightState = "pending";
  runPreflightSimulation("deferred");
}

function runPreflightSimulation(scenarioType) {
  const container = document.getElementById("preflight-simulator-area");
  if (!container) return;

  let assetId = "UNKNOWN-L1-12";
  let prodState = scenarioType === "eligible" ? "MAINTENANCE" : "ACTIVE";
  let maintWindow = scenarioType === "eligible" ? "ACTIVE WINDOW" : "NONE SCHEDULED";

  // Preflight Gates definitions (4 groups)
  const gates = [
    { name: "Method Safety", desc: "Read-only + request limits", result: "PASS" },
    { name: "Device Compatibility", desc: "Modicon profile guidance", result: "PASS" },
    { name: "Operational Risk", desc: "Production loop & criticality", result: scenarioType === "eligible" ? "PASS" : "BLOCK" },
    { name: "Execution Window", desc: "Maintenance window check", result: scenarioType === "eligible" ? "PASS" : "BLOCK" }
  ];

  // Render Gates list HTML
  let gatesHtml = `
    <div class="pipeline-token-track">
      <div class="pipeline-token" id="preflight-token" style="width:100%; height:0%; transition: height 0.35s ease, background-color 0.25s;"></div>
    </div>
  `;

  gates.forEach((g, idx) => {
    let gateClass = preflightState === "pending" ? "pending" : "pass";
    let icon = preflightState === "pending" ? "" : `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    
    if (preflightState !== "pending" && g.result === "BLOCK") {
      gateClass = "fail";
      icon = `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    }

    gatesHtml += `
      <div class="safety-check-row ${gateClass}" id="preflight-gate-${idx + 1}" style="opacity: 0.3; transition: opacity 0.3s ease;">
        <div class="gate-circle">${icon}</div>
        <div class="check-details">
          <span class="check-title">${g.name}</span>
          <span class="check-note">${g.desc}</span>
        </div>
      </div>
    `;
  });

  // Render Verdict & Right Panel content
  let verdictCardHtml = "";
  let boundaryVisual = "";

  if (preflightState === "pending") {
    boundaryVisual = `
      <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); text-align: center; margin: 1rem 0; padding: 0.5rem; border: 1px dashed var(--border-color); border-radius: 4px;">
        VIRTUAL TWIN &nbsp; ━━[ AWAITING PREFLIGHT ]━━ &nbsp; REAL ASSET
      </div>
    `;
  } else if (scenarioType === "deferred") {
    boundaryVisual = `
      <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--status-fail); text-align: center; margin: 1rem 0; padding: 0.5rem; border: 1px solid var(--status-fail); border-radius: 4px; background: rgba(239,68,68,0.02)">
        VIRTUAL PREFLIGHT &nbsp; ━━━━━━[ BLOCKED ]━━━━━━╳ &nbsp; REAL ASSET
      </div>
    `;
  } else if (preflightState === "verified") {
    boundaryVisual = `
      <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--status-warn); text-align: center; margin: 1rem 0; padding: 0.5rem; border: 1px dashed var(--border-color); border-radius: 4px; background: rgba(245,158,11,0.02)">
        SIMULATED SUCCESS &nbsp; ━━━ - - - [ PENDING ] - - - &nbsp; REAL ASSET
      </div>
    `;
  }

  if (preflightState === "pending") {
    verdictCardHtml = `
      <div class="preflight-verdict-card" style="border-top: 3px solid var(--border-color)">
        <div style="font-size:0.85rem; color:var(--text-muted); font-family:var(--font-mono)">Preflight Awaiting Execution</div>
      </div>
    `;
  } else if (scenarioType === "deferred") {
    verdictCardHtml = `
      <div class="preflight-verdict-card" style="border-top: 3px solid var(--status-fail);">
        <div class="verdict-header">
          <div class="verdict-title">Preflight Status</div>
          <div class="verdict-value">DEFERRED</div>
        </div>
        <div class="verdict-details">
          Production interaction remains blocked.<br><br>
          <strong>Blocking Conditions:</strong><br>
          &bull; Production active<br>
          &bull; High criticality<br>
          &bull; No approved maintenance window
        </div>
        <div class="auth-box" style="margin-top: 1rem;">
          <div class="auth-title" style="color: var(--status-fail)">Human Authorization</div>
          <div style="font-size:0.85rem; font-family:var(--font-mono); color:var(--text-muted); font-weight:700;">LOCKED</div>
        </div>
      </div>
    `;
  } else {
    // Eligible / Approved / Verified path
    if (preflightState === "approved") {
      verdictCardHtml = `
        <div class="preflight-verdict-card" style="border-top: 3px solid var(--status-warn);">
          <div class="verdict-header pass">
            <div class="verdict-title">Preflight Status</div>
            <div class="verdict-value pass">ELIGIBLE FOR REVIEW</div>
          </div>
          <div class="verdict-details">
            Preflight conditions satisfied. Lease lease-829 pending verification run.
          </div>
          <div class="auth-box" style="margin-top: 1rem; border-color: var(--status-warn);">
            <div class="auth-title" style="color: var(--status-warn)">Lease Authorized</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom: 0.5rem;">
              Signatory: OT-ENGINEER-LEAD
            </div>
            <button class="btn" style="width: 100%;" id="btn-run-controlled-verification">
              Run Simulated Verification
            </button>
          </div>
        </div>
      `;
    } else if (preflightState === "verified") {
      verdictCardHtml = `
        <div class="preflight-verdict-card" style="border-top: 3px solid var(--status-pass);">
          <div class="verdict-header pass">
            <div class="verdict-title">Simulation Status</div>
            <div class="verdict-value pass">SIMULATION SUCCESSFUL</div>
          </div>
          <div class="verdict-details">
            Simulated query Modbus FC43 succeeded on representative Modicon profile.<br><br>
            <strong>Candidate Identity:</strong> Legacy PLC Model A
          </div>
          <div class="auth-box" style="margin-top: 1rem; border-color: var(--status-pass);">
            <div class="auth-title" style="color: var(--status-pass)">Verification Success</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.5rem;">
              Simulation completed. Target Production asset untouched.
            </div>
            <button class="btn" style="width: 100%;" id="btn-preflight-complete">
              Return to Asset Inventory
            </button>
          </div>
        </div>
      `;
    } else {
      // pending review
      verdictCardHtml = `
        <div class="preflight-verdict-card" style="border-top: 3px solid var(--accent-primary);">
          <div class="verdict-header pass">
            <div class="verdict-title">Preflight Status</div>
            <div class="verdict-value pass">ELIGIBLE FOR REVIEW</div>
          </div>
          <div class="verdict-details">
            Preflight conditions satisfied. Safety policy checked.
          </div>
          <div class="auth-box" style="margin-top: 1rem; border-color: var(--accent-primary);">
            <div class="auth-title" style="color: var(--accent-primary)">Human Authorization Required</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; line-height: 1.3;">
              OTrust recommends. Authorized humans decide.
            </div>
            <button class="btn" style="width: 100%;" id="btn-approve-preflight">
              Review & Authorize
            </button>
          </div>
        </div>
      `;
    }
  }

  // Draw full column grid
  container.innerHTML = `
    <!-- Column 1: Proposed Verification (VIRTUAL ENVIRONMENT) -->
    <div class="verify-col">
      <div class="workspace-section-title">Proposed Verification</div>
      <div class="verify-proposal-box">
        <div class="proposal-card-row"><span>Target Asset:</span> <strong>${assetId}</strong></div>
        <div class="proposal-card-row"><span>Command:</span> <strong>Modbus FC43</strong></div>
        <div class="proposal-card-row"><span>Safety Mode:</span> <strong>Read-Only Query</strong></div>
        <div class="proposal-card-row"><span>Volume Limit:</span> <strong>1 request</strong></div>
        <div class="proposal-card-row"><span>Rate Control:</span> <strong>1 request/min</strong></div>
        
        <div style="margin-top: 1rem;">
          <button class="btn" id="btn-run-preflight" style="width: 100%;" ${preflightState !== "pending" ? "disabled style='opacity:0.5'" : ""}>
            Run Virtual Preflight
          </button>
        </div>
      </div>
    </div>

    <!-- Column 2: Digital Twin (VIRTUAL ENVIRONMENT) -->
    <div class="verify-col">
      <div class="workspace-section-title">Virtual Environment</div>
      
      <!-- PLC Schematic module -->
      <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="background-color: var(--bg-primary); border: 1px solid var(--accent-primary); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect></svg>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">Modicon Legacy PLC Profile</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono)">Virtual environment &bull; real asset untouched</div>
          </div>
        </div>
      </div>

      <!-- Simplified Safety Gates checklist -->
      <div class="preflight-pipeline">
        ${gatesHtml}
      </div>

      <!-- Live Simulation Activity Logs -->
      <div style="margin-top: 1.25rem; background-color: var(--bg-secondary); border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 4px;">
        <div class="workspace-section-title" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Virtual Test Activity</div>
        <div id="preflight-activity-logs" style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--status-pass); min-height: 50px; max-height: 130px; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; line-height: 1.4;">
          Awaiting simulation trigger...
        </div>
      </div>
    </div>

    <!-- Column 3: Production Environment (behind Authorization Boundary) -->
    <div class="verify-col auth-boundary-col">
      <div class="workspace-section-title" style="color: var(--text-muted)">Production Environment</div>
      
      <div style="background-color: rgba(239, 68, 68, 0.03); border: 1px solid var(--border-color); border-radius: 6px; padding: 1.25rem; margin-bottom: 1.25rem;">
        <div style="font-weight: 700; font-family: var(--font-mono); font-size: 0.9rem; color: var(--text-primary);">REAL ASSET: ${assetId}</div>
        <div style="font-size: 0.75rem; color: var(--status-warn); font-weight: 600; margin-top: 0.15rem; font-family: var(--font-mono)">
          Uncertain Identity &middot; Pending Confirmation
        </div>
      </div>

      ${boundaryVisual}
      ${verdictCardHtml}
    </div>
  `;

  // Bind Trigger Preflight Simulation Button
  const btnRun = document.getElementById("btn-run-preflight");
  if (btnRun) {
    btnRun.addEventListener("click", () => {
      btnRun.disabled = true;
      btnRun.style.opacity = "0.5";

      // Animate checklist path
      const logEl = document.getElementById("preflight-activity-logs");
      if (logEl) logEl.innerHTML = "";

      let currentStep = 0;
      const steps = [
        { msg: "FC43 request formatted...", gate: 1, height: "15%", opacity: 1 },
        { msg: "Checking Method Safety... PASS", gate: 1, height: "25%", opacity: 1 },
        { msg: "Checking Device Compatibility... PASS", gate: 2, height: "50%", opacity: 1 },
        { msg: scenarioType === "eligible" ? "Checking Operational Risk... PASS" : "Checking Operational Risk... BLOCKED", gate: 3, height: scenarioType === "eligible" ? "75%" : "55%", opacity: 1, isFail: scenarioType !== "eligible" },
        { msg: scenarioType === "eligible" ? "Checking Execution Window... PASS" : "", gate: 4, height: "100%", opacity: 1 }
      ];

      const runLogStep = () => {
        if (currentStep >= steps.length) {
          // Preflight finished
          setTimeout(() => {
            preflightState = scenarioType === "eligible" ? "eligible" : "deferred";
            runPreflightSimulation(scenarioType);
          }, 300);
          return;
        }

        const step = steps[currentStep];
        if (step.msg) {
          const entry = document.createElement("div");
          entry.innerHTML = step.msg;
          if (step.isFail) entry.style.color = "var(--status-fail)";
          logEl.appendChild(entry);
          logEl.scrollTop = logEl.scrollHeight;

          // Highlight current gate
          const gateEl = document.getElementById(`preflight-gate-${step.gate}`);
          if (gateEl) {
            gateEl.style.opacity = "1";
            if (step.msg.startsWith("Checking")) {
              gateEl.classList.remove("pending", "pass", "fail");
              gateEl.classList.add(step.isFail ? "fail" : "pass");
              gateEl.querySelector(".gate-circle").innerHTML = step.isFail
                ? `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                : `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            }
          }

          // Advance token path
          const token = document.getElementById("preflight-token");
          if (token) {
            token.style.height = step.height;
            if (step.isFail) token.style.backgroundColor = "var(--status-fail)";
            else token.style.backgroundColor = "var(--status-pass)";
          }
        }

        currentStep++;
        if (step.isFail) {
          // Abrupt stop at block condition
          setTimeout(() => {
            preflightState = "deferred";
            runPreflightSimulation(scenarioType);
          }, 350);
          return;
        }

        setTimeout(runLogStep, 350);
      };

      runLogStep();
    });
  }

  // Bind Approval button (Sign & Approve One-Time Lease)
  const btnApprove = document.getElementById("btn-approve-preflight");
  if (btnApprove) {
    btnApprove.addEventListener("click", () => {
      const asset = currentAssets.find(a => a.asset_id === "UNKNOWN-L1-12");
      if (asset) {
        asset.state = "NEEDS REVIEW";
        const logId = `AUD-2026-0825-${Math.floor(Math.random() * 900) + 100}`;
        currentAuditLogs.unshift({
          record_id: logId,
          timestamp: new Date().toISOString(),
          type: "VIRTUAL_PREFLIGHT_PASS",
          asset_id: "UNKNOWN-L1-12",
          requested_by: "OT-ENGINEER-LEAD",
          decision: "CONTROLLED_VERIFICATION_AUTHORIZED",
          confidence: "LOW",
          top_candidate: "Legacy PLC Model A (58%)",
          active_interaction_avoided: false,
          details: "Virtual preflight simulation passed. Authorized engineer approved controlled verification request. Approval granted."
        });
      }
      
      preflightState = "approved";
      runPreflightSimulation(scenarioType);
    });
  }

  // Bind Simulated Verification Button
  const btnVerify = document.getElementById("btn-run-controlled-verification");
  if (btnVerify) {
    btnVerify.addEventListener("click", () => {
      btnVerify.disabled = true;
      btnVerify.style.opacity = "0.5";

      const logEl = document.getElementById("preflight-activity-logs");
      if (logEl) {
        logEl.innerHTML += `<div><br>Initializing Simulation Verification lease...</div>`;
        logEl.scrollTop = logEl.scrollHeight;
        setTimeout(() => {
          logEl.innerHTML += `<div>Sending Modbus FC43 Device Identification request...</div>`;
          logEl.scrollTop = logEl.scrollHeight;
        }, 300);
        setTimeout(() => {
          logEl.innerHTML += `<div>Expected registers received from Modicon PLC Profile.</div>`;
          logEl.scrollTop = logEl.scrollHeight;
        }, 600);
        setTimeout(() => {
          logEl.innerHTML += `<div style="color:var(--status-pass); font-weight:bold;">SIMULATION SUCCESSFUL.</div>`;
          logEl.scrollTop = logEl.scrollHeight;
          
          const asset = currentAssets.find(a => a.asset_id === "UNKNOWN-L1-12");
          if (asset) {
            asset.state = "PENDING REAL-WORLD VERIFICATION";
            asset.candidate_identity = "Legacy PLC Model A";
            asset.simulated_verification_result = "SUCCESS";
            
            const logId = `AUD-2026-0825-${Math.floor(Math.random() * 900) + 100}`;
            currentAuditLogs.unshift({
              record_id: logId,
              timestamp: new Date().toISOString(),
              type: "SIMULATED_VERIFICATION_SUCCESS",
              asset_id: "UNKNOWN-L1-12",
              requested_by: "OTrust Emulator Proxy",
              decision: "SIMULATED_VERIFICATION_SUCCESS",
              confidence: "MEDIUM",
              top_candidate: "Legacy PLC Model A (Simulated)",
              active_interaction_avoided: false,
              details: "Verification method succeeded in the simulated environment. Production asset identity remains pending authorized real-world confirmation."
            });
          }

          setTimeout(() => {
            preflightState = "verified";
            runPreflightSimulation(scenarioType);
          }, 400);
        }, 1200);
      }
    });
  }

  // Bind Return button
  const btnReturn = document.getElementById("btn-preflight-complete");
  if (btnReturn) {
    btnReturn.addEventListener("click", () => {
      const drawerAssets = document.getElementById("drawer-assets");
      if (drawerAssets) drawerAssets.classList.add("open");
    });
  }

  // Update visual risk spectrum indicator on page
  updatePreflightRiskSpectrum(preflightState, scenarioType);
}

function updatePreflightRiskSpectrum(state, scenarioType) {
  const nodes = document.querySelectorAll("#preflight-risk-spectrum .risk-spectrum-node");
  const banner = document.getElementById("preflight-risk-banner");
  if (!banner) return;

  // Reset all dots to neutral grey first
  nodes.forEach(node => node.classList.remove("active", "blocked"));

  const getNode = (name) => Array.from(nodes).find(n => n.getAttribute("data-step") === name);
  const nodePrepare  = getNode("prepare");
  const nodePreflight= getNode("preflight");
  const nodeAuthorize= getNode("authorize");
  const nodeSimulate = getNode("simulate");

  if (state === "pending") {
    // All dots neutral — nothing lit
    banner.innerText = "Status: Awaiting virtual preflight simulation.";

  } else if (state === "deferred") {
    if (nodePrepare)   nodePrepare.classList.add("active");
    if (nodePreflight) nodePreflight.classList.add("blocked");
    banner.innerText = "Status: Safety Policy blocked. Preflight DEFERRED. Production asset untouched.";

  } else if (state === "eligible") {
    if (nodePrepare)   nodePrepare.classList.add("active");
    if (nodePreflight) nodePreflight.classList.add("active");
    banner.innerText = "Status: Preflight passed. Awaiting human engineering authorization.";

  } else if (state === "approved") {
    if (nodePrepare)   nodePrepare.classList.add("active");
    if (nodePreflight) nodePreflight.classList.add("active");
    if (nodeAuthorize) nodeAuthorize.classList.add("active");
    banner.innerText = "Status: Lease authorized. Ready for simulated twin run.";

  } else if (state === "verified") {
    if (nodePrepare)   nodePrepare.classList.add("active");
    if (nodePreflight) nodePreflight.classList.add("active");
    if (nodeAuthorize) nodeAuthorize.classList.add("active");
    if (nodeSimulate)  nodeSimulate.classList.add("active");
    banner.innerText = "Status: Simulation successful. Real-world asset pending confirmation.";
  }
}

// 7. Insights & Governance Page
function renderInsights() {
  // Counts
  const total = currentAssets.length;
  const legacy = currentAssets.filter(a => a.legacy_flag === true).length;
  const conflicts = currentAssets.filter(a => a.state === "NEEDS REVIEW" || a.conflicts.length > 0).length;
  const stale = currentAssets.filter(a => a.asset_id === "STALE-L3-05").length; // stale mock
  
  document.getElementById("gov-stat-avoided").innerText = interactionsAvoidedCount;
  document.getElementById("gov-stat-conflicts").innerText = conflicts;
  document.getElementById("gov-stat-stale").innerText = stale;

  // Simple distribution percentages (enforcing exactly 100% total)
  let highConf = Math.round((currentAssets.filter(a => a.confidence_score >= 0.85).length / total) * 100) || 0;
  let medConf = Math.round((currentAssets.filter(a => a.confidence_score >= 0.65 && a.confidence_score < 0.85).length / total) * 100) || 0;
  let lowConf = 100 - highConf - medConf;
  if (lowConf < 0) lowConf = 0; // sanity check

  document.getElementById("dist-high").style.width = highConf + "%";
  document.getElementById("dist-high-lbl").innerText = highConf + "%";
  document.getElementById("dist-med").style.width = medConf + "%";
  document.getElementById("dist-med-lbl").innerText = medConf + "%";
  document.getElementById("dist-low").style.width = lowConf + "%";
  document.getElementById("dist-low-lbl").innerText = lowConf + "%";
}

function initGovernanceTable() {
  renderGovernanceTable();
}

function formatEnum(enumStr) {
  if (!enumStr) return "N/A";
  let text = enumStr.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function renderGovernanceTable() {
  const tbody = document.getElementById("gov-audit-tbody");
  tbody.innerHTML = "";

  currentAuditLogs.forEach(log => {
    const row = document.createElement("tr");
    row.className = "gov-row-expandable";
    
    let labelClass = "gate-status-pass";
    if (log.decision.includes("DEFERRED") || log.type.includes("FAIL")) labelClass = "gate-status-fail";
    if (log.decision.includes("VIRTUAL") || log.decision.includes("ADDITIONAL") || log.decision.includes("CONTROLLED")) labelClass = "gate-status-warn";

    const displayDecision = formatEnum(log.decision);
    const displayRequestedBy = log.requested_by === "OT-ENGINEER-LEAD" ? "OT Lead Engineer" : formatEnum(log.requested_by);

    row.innerHTML = `
      <td>${log.timestamp.split("T")[0]} ${log.timestamp.split("T")[1].substring(0,5)}</td>
      <td><strong>${log.asset_id}</strong></td>
      <td class="${labelClass}">${displayDecision}</td>
      <td>${displayRequestedBy}</td>
      <td>${log.active_interaction_avoided ? "✔ YES" : "—"}</td>
    `;

    // Sub detail expandable row (5 columns wide)
    const detailRow = document.createElement("tr");
    detailRow.style.display = "none";
    detailRow.className = "expanded-detail-row";
    detailRow.innerHTML = `
      <td colspan="5">
        <div style="padding:0.75rem; border-left: 2px solid var(--accent-primary); line-height: 1.5;">
          <strong>Record ID:</strong> <code>${log.record_id}</code><br>
          <strong>Governance Details:</strong> ${log.details}<br>
          <strong>Top Match Estimate:</strong> ${log.top_candidate || "N/A"}<br>
          <span style="font-size:0.75rem; color:var(--text-secondary)">Compliance standard check signed under OTrust local engine governance.</span>
        </div>
      </td>
    `;

    row.addEventListener("click", () => {
      detailRow.style.display = detailRow.style.display === "none" ? "table-row" : "none";
    });

tbody.appendChild(row);
    tbody.appendChild(detailRow);
  });
}

// 8. Future Vision SVG Drawing ─── Node knowledge base ───────────────────────────────────────────────────
const GRAPH_NODE_DATA = {
  "node-plc": {
    label: "PLC-17",
    role: "Legacy Process Controller",
    criticality: "HIGH",
    critColor: "var(--status-fail)",
    summary: "PLC-17 is the primary control authority for the Cooling Water circulation loop. It issues timed commands to Pump P-101 and modulates Valve V-09 to regulate bypass flow. Any unplanned outage or misconfiguration propagates directly to the Cooling Water Unit and halts Circulation Flow.",
    relationships: [
      { label: "Commands",   target: "Pump P-101" },
      { label: "Modulates",  target: "Valve V-09" },
      { label: "Receives HMI from", target: "HMI-04" },
      { label: "Delivers flow to", target: "Cooling Water Unit" }
    ],
    process: "Circulation loop scheduling, bypass flow control",
    highlightNodes: ["node-plc","node-pump","node-valve","node-unit","node-flow"],
    pathSegments: [["plc","pump"],["plc","valve"],["pump","unit"],["unit","flow"]]
  },
  "node-hmi": {
    label: "HMI-04",
    role: "Operator Interface Panel",
    criticality: "MEDIUM",
    critColor: "var(--status-warn)",
    summary: "HMI-04 is the operator-facing interface for the cooling water circuit. It sends setpoint changes and acknowledge commands to PLC-17, and displays live telemetry from the process. It does not directly actuate any field devices — all commands pass through PLC-17.",
    relationships: [
      { label: "Sends setpoints to", target: "PLC-17" },
      { label: "Reads status from", target: "PLC-17" }
    ],
    process: "Operator setpoint entry, alarm acknowledgement, process visualisation",
    highlightNodes: ["node-hmi","node-plc"],
    pathSegments: [["hmi","plc"]]
  },
  "node-pump": {
    label: "Pump P-101",
    role: "Circulation Pump",
    criticality: "HIGH",
    critColor: "var(--status-fail)",
    summary: "Pump P-101 drives the primary circulation loop supplying coolant to the Cooling Water Unit. It is commanded by PLC-17 and its flow output is monitored by Flow Sensor-12 via Valve V-09. Loss of pump operation stops coolant delivery and risks thermal runaway in the process unit.",
    relationships: [
      { label: "Commanded by",   target: "PLC-17" },
      { label: "Feeds",          target: "Cooling Water Unit" },
      { label: "Flow monitored via", target: "Flow Sensor-12" }
    ],
    process: "Coolant circulation, loop pressure maintenance",
    highlightNodes: ["node-pump","node-plc","node-unit","node-sensor","node-valve"],
    pathSegments: [["plc","pump"],["pump","unit"],["sensor","valve"]]
  },
  "node-valve": {
    label: "Valve V-09",
    role: "Bypass Flow Valve",
    criticality: "MEDIUM",
    critColor: "var(--status-warn)",
    summary: "Valve V-09 sits in the bypass branch of the Cooling Water circuit. It is modulated by PLC-17 to divert a controlled fraction of flow away from the main loop. Flow Sensor-12 measures the actual bypass rate and feeds that reading back to PLC-17 for closed-loop correction.",
    relationships: [
      { label: "Modulated by",   target: "PLC-17" },
      { label: "Measured by",    target: "Flow Sensor-12" },
      { label: "Affects flow in", target: "Cooling Water Unit" }
    ],
    process: "Bypass flow regulation, Cooling Water bypass path",
    highlightNodes: ["node-valve","node-plc","node-sensor","node-unit"],
    pathSegments: [["plc","valve"],["sensor","valve"],["valve","unit"]]
  },
  "node-sensor": {
    label: "Flow Sensor-12",
    role: "Rate Telemetry Sensor",
    criticality: "MEDIUM",
    critColor: "var(--status-warn)",
    summary: "Flow Sensor-12 measures the volumetric flow rate in the bypass branch adjacent to Valve V-09. Its reading is consumed by PLC-17 to close the control loop and by HMI-04 for operator visibility. If this sensor drifts or fails silently, PLC-17 loses feedback and may over- or under-modulate the bypass valve.",
    relationships: [
      { label: "Measures flow at", target: "Valve V-09" },
      { label: "Reports to",       target: "PLC-17 (via HMI-04)" },
      { label: "Feeds telemetry to", target: "HMI-04" }
    ],
    process: "Bypass flow measurement, closed-loop feedback",
    highlightNodes: ["node-sensor","node-valve","node-plc","node-hmi"],
    pathSegments: [["sensor","valve"],["hmi","plc"]]
  },
  "node-unit": {
    label: "Cooling Water Unit",
    role: "Auxiliary Cooling System",
    criticality: "HIGH",
    critColor: "var(--status-fail)",
    summary: "The Cooling Water Unit is the process subsystem that receives circulated coolant from Pump P-101 and bypass flow through Valve V-09. It is the functional endpoint of the cooling loop — all upstream assets exist to maintain stable coolant delivery to this unit. Disruption to any upstream asset ultimately manifests here as thermal or pressure instability.",
    relationships: [
      { label: "Receives coolant from", target: "Pump P-101" },
      { label: "Receives bypass from",  target: "Valve V-09" },
      { label: "Outputs to",           target: "Circulation Flow" }
    ],
    process: "Process cooling, heat exchange, thermal stability maintenance",
    highlightNodes: ["node-unit","node-pump","node-valve","node-flow","node-plc"],
    pathSegments: [["pump","unit"],["valve","unit"],["unit","flow"],["plc","pump"]]
  },
  "node-flow": {
    label: "Circulation Flow",
    role: "Process Variable",
    criticality: "HIGH",
    critColor: "var(--status-fail)",
    summary: "Circulation Flow is the measured process outcome of the entire cooling loop. It is a function of Pump P-101 speed, Valve V-09 position, and Cooling Water Unit demand. PLC-17 ultimately controls this variable indirectly by commanding all upstream actuators. Any degradation in PLC-17, Pump P-101, or Valve V-09 is reflected in this variable.",
    relationships: [
      { label: "Determined by", target: "Pump P-101 + Valve V-09" },
      { label: "Managed by",    target: "PLC-17" },
      { label: "Output of",     target: "Cooling Water Unit" }
    ],
    process: "Coolant circulation rate — primary process performance indicator",
    highlightNodes: ["node-flow","node-unit","node-pump","node-valve","node-plc"],
    pathSegments: [["unit","flow"],["pump","unit"],["plc","pump"],["plc","valve"]]
  }
};

function drawFutureGraph() {
  const canvas = document.getElementById("future-graph-canvas");
  if (!canvas) return;
  const width  = canvas.clientWidth;
  const height = canvas.clientHeight;

  const svg = document.getElementById("graph-svg");
  if (!svg) return;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const pos = {
    plc:    { x: width * 0.15, y: height * 0.50 },
    hmi:    { x: width * 0.15, y: height * 0.18 },
    pump:   { x: width * 0.45, y: height * 0.32 },
    valve:  { x: width * 0.45, y: height * 0.65 },
    sensor: { x: width * 0.45, y: height * 0.88 },
    unit:   { x: width * 0.73, y: height * 0.50 },
    flow:   { x: width * 0.92, y: height * 0.50 }
  };

  const ID_MAP = {
    plc: "node-plc", hmi: "node-hmi", pump: "node-pump",
    valve: "node-valve", sensor: "node-sensor", unit: "node-unit", flow: "node-flow"
  };

  // Position nodes
  Object.entries(pos).forEach(([key, {x, y}]) => {
    const el = document.getElementById(ID_MAP[key]);
    if (el) setNodePosition(el, x, y);
  });

  // Draw base edges
  const edges = [
    ["hmi","plc"],["plc","pump"],["plc","valve"],
    ["pump","unit"],["valve","unit"],["sensor","valve"],["unit","flow"]
  ];
  const pathEl = document.getElementById("graph-edges");
  if (pathEl) {
    pathEl.setAttribute("d",
      edges.map(([a,b]) => `M ${pos[a].x} ${pos[a].y} L ${pos[b].x} ${pos[b].y}`).join(" ")
    );
  }

  // Make every node clickable
  Object.entries(GRAPH_NODE_DATA).forEach(([nodeId, data]) => {
    const el = document.getElementById(nodeId);
    if (!el) return;
    el.style.cursor = "pointer";

    el.addEventListener("click", () => {
      // Dim all nodes
      Object.values(ID_MAP).forEach(id => {
        const n = document.getElementById(id);
        if (n) n.classList.add("dimmed");
      });
      // Remove old highlights
      Object.values(ID_MAP).forEach(id => {
        const n = document.getElementById(id);
        if (n) { n.classList.remove("highlighted"); }
      });

      // Highlight related nodes
      data.highlightNodes.forEach(id => {
        const n = document.getElementById(id);
        if (n) { n.classList.remove("dimmed"); n.classList.add("highlighted"); }
      });

      // Animate highlight path
      const hp = document.getElementById("graph-highlight-path");
      if (hp) {
        const pathD = data.pathSegments
          .map(([a,b]) => `M ${pos[a].x} ${pos[a].y} L ${pos[b].x} ${pos[b].y}`)
          .join(" ");
        hp.setAttribute("d", pathD);
        hp.style.display = "block";
        const len = hp.getTotalLength();
        hp.style.strokeDasharray = len;
        hp.style.strokeDashoffset = len;
        hp.getBoundingClientRect();
        hp.style.strokeDashoffset = "0";
      }

      // Render context panel
      renderNodePanel(data);
    });
  });

  // Click on canvas background → reset
  canvas.addEventListener("click", (e) => {
    if (e.target === canvas || e.target.tagName === "svg" || e.target.closest("path")) {
      resetGraph();
    }
  });
}

function resetGraph() {
  document.querySelectorAll(".graph-canvas .node, #future-graph-canvas .node").forEach(n => {
    n.classList.remove("highlighted","dimmed");
  });
  const hp = document.getElementById("graph-highlight-path");
  if (hp) { hp.style.display = "none"; hp.setAttribute("d",""); }

  const panel = document.getElementById("future-criticality-display");
  if (panel) {
    panel.innerHTML = `
      <div style="background-color:var(--bg-secondary); border:1px dashed var(--border-color); border-radius:6px; padding:2rem; text-align:center; color:var(--text-muted); display:flex; align-items:center; justify-content:center; min-height:180px;">
        Select any node to map its operational dependencies and process role.
      </div>`;
  }
}

function renderNodePanel(data) {
  const panel = document.getElementById("future-criticality-display");
  if (!panel) return;

  const relsHtml = data.relationships.map(r =>
    `<div style="display:flex; gap:0.5rem; align-items:flex-start; margin-bottom:0.35rem;">
       <span style="color:var(--text-muted); font-size:0.72rem; min-width:110px; padding-top:1px;">${r.label}</span>
       <span style="color:var(--text-primary); font-size:0.8rem; font-weight:600;">${r.target}</span>
     </div>`
  ).join("");

  panel.innerHTML = `
    <div style="background-color:var(--bg-secondary); border:1px solid var(--border-color); border-radius:6px; padding:1.25rem; display:flex; flex-direction:column; gap:1rem;">
      
      <div>
        <div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--text-primary); margin-bottom:0.15rem;">${data.label}</div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${data.role}</div>
        </div>
      </div>

      <div style="font-size:0.82rem; color:var(--text-secondary); line-height:1.6; border-top:1px solid var(--border-color); padding-top:0.75rem;">
        ${data.summary}
      </div>

      <div style="border-top:1px solid var(--border-color); padding-top:0.75rem;">
        <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); margin-bottom:0.5rem;">Relationships</div>
        ${relsHtml}
      </div>

      <div style="border-top:1px solid var(--border-color); padding-top:0.75rem;">
        <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); margin-bottom:0.25rem;">Process Function</div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">${data.process}</div>
      </div>

    </div>`;
}

function setNodePosition(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.transform = "translate(-50%, -50%)";
}

// Draw graph on resize
window.addEventListener("resize", () => {
  const futurePage = document.getElementById("page-future");
  if (futurePage.classList.contains("active")) {
    drawFutureGraph();
  }
});
