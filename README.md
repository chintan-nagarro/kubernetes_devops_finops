# Multi-Tier Resilient Kubernetes Architecture

## 🔗 Project Delivery Artifacts
* **Code Repository URL:** `https://github.com/chintan-nagarro/kubernetes_devops_finops.git`
* **Docker Hub Target Image:** `chintan2026/node-api:v2`

---

## 1. Requirement Understanding
The objective of this assignment is to architect, containerize, and deploy a highly available, self-healing, and secure multi-tier web application within a managed Kubernetes cluster environment (I've used Killercoda).

The application architecture consists of:
* **Service API Tier (Node.js):** A stateless web microservice configured to handle user operations. This tier demands high availability (4 default replicas), external availability via an Ingress Controller, zero-downtime upgrades via Rolling Updates, and automated demand-driven scaling via a Horizontal Pod Autoscaler (HPA).
* **Database Tier (PostgreSQL 15):** A stateful datastore requiring isolated cluster access (internal only), automated initialization routines (`db/init.sql`), and non-volatile data storage across pod recreation cycles.

### Strict Guardrails Met:
* **Decoupled Networking:** No hardcoded Pod IPs are used; service layers communicate dynamically through Kubernetes ClusterIP Service DNS entries (`postgres-service`).
* **Credential Separation:** Highly sensitive information (database passwords) is separated from manifest source files using native Kubernetes Secrets.
* **Application Governance:** Loose configurations use a centralized ConfigMap (`db-config`) decoupled from the application runtime container image logic.

---

## 2. Assumptions
During architecture design, the following engineering assumptions were made:
* **Cluster Ingress Controller Baseline:** The targeted cluster space includes or permits an active NGINX Ingress Controller listening on standard ports to route path requests mapped via `ingressClassName: nginx`.
* **Stateless Microservice Design:** The Node.js API container tier maintains zero native local session state, allowing any arbitrary traffic balancer to route traffic across active instances safely.
* **Single-Worker Node Limits:** Since testing happens in a localized environment, persistent volumes map to host-level network paths via standard dynamic or local volume provisions while remaining resilient to local pod terminations.

---

## 3. Solution Overview
The blueprint employs a fully decoupled cloud-native topology:

### Config & Secret Management
* `db-secret` holds the base64 encrypted database root password.
* `db-config` (ConfigMap) defines database connection targets (`DB_HOST`, `DB_PORT`, `DB_NAME`).
* `postgres-init` (ConfigMap) encapsulates the raw DDL schema setup script (`init.sql`) dynamically loaded during database bootstrap sequences.

### Database Persistence & Storage
The PostgreSQL deployment relies on a stable `PersistentVolumeClaim` named `postgres-pvc`. It requests dedicated blocks mounted under `/var/lib/postgresql/data`. When the PostgreSQL container or pod terminates, the volume stays intact on the persistent storage plane, achieving strict persistence guarantees.

### Ingress & Routing Structure
The NGINX Ingress rule routes root-level external ingress paths (`/`) over the edge plane down into internal port mappings on `api-service` (Port 80), which then shifts traffic down onto container targeting port structures (Port 3000).

---

## 4. Justification for the Resources Utilized
* **API Requests (`cpu: "100m"`, `memory: "128Mi"`):** Provides a minimal allocation profile to handle base execution processes while saving active hardware budget on idle cluster nodes.
* **API Limits (`cpu: "500m"`, `memory: "256Mi"`):** Establishes hard processing caps. Prevents rogue application logic or unexpected leaks from degrading the performance of neighboring operational containers on the worker instance.
* **HPA Configuration (`minReplicas: 4`, `maxReplicas: 10`, `target: 50%`):** Guarantees that baseline service targets (4 replicas) always satisfy high availability goals. It dynamically bursts system scaling profiles up to 10 nodes during traffic spikes to protect response times.

## 💰 FinOps Engineering Commitments

### 1. Resource Management Metrics
The Service layer operates within strict, right-sized constraints (`requests: cpu: 100m, memory: 128Mi`). This low footprint maximizes pod density per node while ensuring the application maintains enough processing overhead to execute its business logic cleanly.

### 2. Three Cost Optimization Strategies Implemented
1.  **Demand-Driven Autoscaling (HPA):** Mitigates "always-on overprovisioning." The cluster allocates resource budgets elastically based on live usage profiles, maintaining a smaller baseline when traffic is quiet.
2.  **Strict Performance Fencing:** Hard limits prevent runaways from stealing resources from stateful data pods, eliminating costly downtime incidents.
3.  **Storage Spend Segregation:** Avoids broad disk attachment charges by coupling premium volume components exclusively to the stateful tier (`postgres`).