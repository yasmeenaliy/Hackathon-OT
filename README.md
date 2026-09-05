# OTrust

> **Passive OT Asset Discovery Through Fingerprint Similarity and Simulation Test Validation**

OTrust is an operational technology (OT) cybersecurity prototype developed during the **Operational Technology Cybersecurity Hackathon**. It presents a passive-first methodology for safe asset discovery, identification, and validation in sensitive legacy industrial environments.

---

## Table of Contents

- [Overview](#overview)
- [The Challenge](#the-challenge)
- [Our Approach & Architecture](#our-approach--architecture)
- [Core Capabilities & Workflow](#core-capabilities--workflow)
  - [1. Overview & Telemetry Console](#1-overview--telemetry-console)
  - [2. 01 Observe: Passive Behavioral Fingerprinting](#2-01-observe-passive-behavioral-fingerprinting)
  - [3. 02 Verify: Simulation Test Virtual Preflight](#3-02-verify-simulation-test-virtual-preflight)
  - [4. 03 Understand: Operational Meaning & Dependency Mapping](#4-03-understand-operational-meaning--dependency-mapping)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Synthetic Hackathon Dataset](#synthetic-hackathon-dataset)
- [Important Disclaimer](#important-disclaimer)

---

## Overview

In legacy industrial control systems (ICS) and supervisory control and data acquisition (SCADA) environments, traditional active network scanning (e.g., ping sweeps, port scans) can trigger unexpected PLC halts, communication buffer overflows, or physical process disruption.

**OTrust** eliminates the hazards of blind active scanning by utilizing passive network telemetry, explainable behavioral fingerprinting, and simulation test preflight verification before any bounded active query is ever permitted.

---

## The Challenge

- **Fragile Legacy Controllers**: Sensitive field controllers (PLCs, RTUs, IEDs) cannot withstand conventional IT vulnerability scanners.
- **Incomplete Asset Inventories**: Shadow OT devices and unidentified IP addresses exist without documentation.
- **Safety & Availability Priority**: Uptime and physical safety take precedence over traditional IT security probing.
- **Operational Context Gap**: Knowing an IP address and MAC vendor does not reveal the asset's physical role or process criticality.

---

## Our Approach & Architecture

```
[ Passive SPAN / Tap Telemetry ]
               │
               ▼
[ Behavioral Feature Extraction ]
  • Cyclic periodicity & polling rhythms
  • Protocol function codes (Modbus, S7, DNP3, CIP)
  • Port signatures & payload heuristics
               │
               ▼
[ Explainable Fingerprint Similarity ] ───► Jaccard Match Convergence
               │
       ┌───────┴───────────────────────┐
       ▼                               ▼
[ High Confidence ]            [ Low Confidence / Ambiguous ]
Auto-classified Asset                  │
                                       ▼
                     [ Simulation Test Virtual Preflight ]
                       • Safe simulated probe validation
                       • Maintenance window enforcement
                       • Human-in-the-loop authorization
```

---

## Core Capabilities & Workflow

### 1. Overview & Telemetry Console
- **Interface Monitoring**: Displays real-time SPAN port throughput (`SPAN_PORT_01`, `SPAN_PORT_02`), packet drop statistics, and capture status.
- **Safety Impact Counter**: Tracks **Interactions Avoided** — quantifying how many dangerous active scan packets were prevented.
- **Inventory Telemetry**: High-level breakdown of observed devices, legacy controllers, and pending unidentified assets.

### 2. 01 Observe: Passive Behavioral Fingerprinting
- **Ingress Telemetry Stream**: Live packet frame capture stream displaying raw network interactions.
- **Behavioral Profiling**: Evaluates protocol distribution, packet intervals, and functional operational traits.
- **Jaccard Match Convergence**: Transparent, explainable algorithmic comparison matching observed signatures against known ICS profile libraries.

### 3. 02 Verify: Simulation Test Virtual Preflight
- **Risk Spectrum Engine**: Staged pipeline transitioning from *Prepare* &rarr; *Preflight* &rarr; *Authorize* &rarr; *Simulate*.
- **Site Condition Policy**:
  - **Production Mode**: Restricts any active testing to prevent disruption during active operations.
  - **Maintenance Mode**: Unlocks controlled preflight simulation within authorized maintenance windows.
- **Simulation Test Environment**: Validates response safety in a simulated environment before physical interaction is considered.

### 4. 03 Understand: Operational Meaning & Dependency Mapping
- **Interactive Topology Graph**: Connects controllers (e.g., `PLC-17`), HMIs (`HMI-04`), field actuators (`Pump P-101`, `Valve V-09`), and instrumentation (`Flow Sensor-12`).
- **Process Impact Analysis**: Traces the relationship between cyber assets and physical chemical/cooling loops.

---

## Repository Structure

```text
Hackathon-OT/
├── .gitattributes
├── README.md                  # Project overview, architecture, and documentation
└── OTrust/                    # Interactive web prototype
    ├── index.html             # Single-page application console layout
    ├── styles.css             # Industrial dark-theme console styling & responsive design
    ├── app.js                 # UI controllers, telemetry simulation, and interactive graph
    └── data.js                # Synthetic ICS profiles, device signatures, and topology
```

---

## Quick Start

The OTrust console is a standalone, client-side web application with no external build tools required.

### Option 1: Direct Browser Launch
1. Clone or download the repository:
   ```bash
   git clone https://github.com/yasmeenaliy/Hackathon-OT.git
   ```
2. Navigate to the `OTrust` directory and open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local Static Server
Using Python:
```bash
cd Hackathon-OT/OTrust
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

Using Node.js:
```bash
npx serve Hackathon-OT/OTrust
```

---

## Synthetic Hackathon Dataset

All telemetry, IP addresses, MAC addresses, device identifiers, and network behaviors included in [`OTrust/data.js`](OTrust/data.js) are **synthetic** and designed specifically for demonstration purposes:
- Emulates common industrial protocols: **Modbus TCP**, **Siemens S7comm**, **EtherNet/IP (CIP)**, and **DNP3**.
- Realistic traffic distributions and timing jitters for demonstration.

---

## Important Disclaimer

> [!NOTE]
> This repository contains an operational prototype developed for a hackathon demonstration. Demo data, similarity heuristics, and preflight simulation responses are synthetic and should not be interpreted as certified production-grade safety guarantees or validated OT device claims.

