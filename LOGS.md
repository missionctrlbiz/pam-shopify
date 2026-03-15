repurpose-worker Region: us-central1 URL: https://repurpose-worker-1030441621671.us-central1.run.app Scaling: Auto (Min: 0, Max: 10) 
Observability
Revisions
Source
Triggers
Networking
Security
YAML
Metrics
Logs
SLOs
Errors
Logs
Severity
Default
Filter
Severity
Time
Summary
Loading... Scanned up to 3/12/26, 5:15 PM.
2026-03-13 06:28:04.472 WAT

Cloud Run

CreateService

repurpose-worker

psychmasteryadmin@gmail.c…
audit_log, method: "google.cloud.run.v1.Services.CreateService", principal_email: "psychmasteryadmin@gmail.com"
2026-03-13 06:28:10.471 WAT
Starting new instance. Reason: DEPLOYMENT_ROLLOUT - Instance started due to traffic shifting between revisions due to deployment, traffic split adjustment, or deployment health check.
2026-03-13 06:28:12.353 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "repurpose-worker-1" on port 8080.
2026-03-13 06:28:12.356 WAT
[repurpose-worker] Listening on port 8080
2026-03-13 06:28:12.421 WAT

Cloud Run

CreateService

repurpose-worker-00001-8hv
Ready condition status changed to True for Revision repurpose-worker-00001-8hv with message: Deploying revision succeeded in 7.69s.
2026-03-13 06:28:13.702 WAT

Cloud Run

CreateService

repurpose-worker
Ready condition status changed to True for Service repurpose-worker.
2026-03-13 22:25:12.410 WAT


HEAD

403

0 ms

curl 8.18.0
https://repurpose-worker-lsento5exq-uc.a.run.app/
2026-03-14 13:35:00.340 WAT

POST

200

257 B

979 ms

Google-Cloud-Tasks
https://repurpose-worker-lsento5exq-uc.a.run.app/
2026-03-14 13:35:00.384 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 13:35:01.616 WAT
[repurpose-worker] Listening on port 8080
2026-03-14 13:35:01.618 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "repurpose-worker-1" on port 8080.
2026-03-14 13:35:01.648 WAT
[repurpose-worker] Job cmmqb602t0004gokwu5b7rcu3 started — topic: Presenting Chief Complaint
2026-03-14 13:35:01.913 WAT
[repurpose-worker] Job cmmqb602t0004gokwu5b7rcu3 FAILED: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent: [404 Not Found] models/gemini-2.0-flash-thinking-exp-01-21 is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.
2026-03-14 13:35:01.924 WAT
[repurpose-worker] Callback failed: TypeError: fetch failed
2026-03-14 13:35:01.924 WAT
    at node:internal/deps/undici/undici:14902:13
2026-03-14 13:35:01.924 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 13:35:01.924 WAT
    at async postCallback (/app/dist/types.js:5:17)
2026-03-14 13:35:01.924 WAT
    at async /app/dist/index.js:64:9 {
2026-03-14 13:35:01.924 WAT
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:3000
2026-03-14 13:35:01.924 WAT
      at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1611:16) {
2026-03-14 13:35:01.924 WAT
    errno: -111,
2026-03-14 13:35:01.924 WAT
    code: 'ECONNREFUSED',
2026-03-14 13:35:01.924 WAT
    syscall: 'connect',
2026-03-14 13:35:01.924 WAT
    address: '127.0.0.1',
2026-03-14 13:35:01.924 WAT
    port: 3000
2026-03-14 13:35:01.924 WAT
  }
2026-03-14 13:35:01.924 WAT
}
2026-03-14 13:38:11.608 WAT

POST

200

257 B

7 ms

Google-Cloud-Tasks
https://repurpose-worker-lsento5exq-uc.a.run.app/
2026-03-14 13:38:11.632 WAT
[repurpose-worker] Job cmmqba3h9000bgokwals8xrqa started — topic: Presenting Chief Complaint
2026-03-14 13:38:11.711 WAT
[repurpose-worker] Job cmmqba3h9000bgokwals8xrqa FAILED: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent: [404 Not Found] models/gemini-2.0-flash-thinking-exp-01-21 is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.
2026-03-14 13:38:11.717 WAT
[repurpose-worker] Callback failed: TypeError: fetch failed
2026-03-14 13:38:11.717 WAT
    at node:internal/deps/undici/undici:14902:13
2026-03-14 13:38:11.717 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 13:38:11.717 WAT
    at async postCallback (/app/dist/types.js:5:17)
2026-03-14 13:38:11.717 WAT
    at async /app/dist/index.js:64:9 {
2026-03-14 13:38:11.717 WAT
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:3000
2026-03-14 13:38:11.717 WAT
      at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1611:16) {
2026-03-14 13:38:11.717 WAT
    errno: -111,
2026-03-14 13:38:11.717 WAT
    code: 'ECONNREFUSED',
2026-03-14 13:38:11.717 WAT
    syscall: 'connect',
2026-03-14 13:38:11.717 WAT
    address: '127.0.0.1',
2026-03-14 13:38:11.717 WAT
    port: 3000
2026-03-14 13:38:11.717 WAT
  }
2026-03-14 13:38:11.717 WAT
}
2026-03-14 19:18:56.388 WAT

Cloud Run

ReplaceService

repurpose-worker

psychmasteryadmin@gmail.c…
audit_log, method: "google.cloud.run.v1.Services.ReplaceService", principal_email: "psychmasteryadmin@gmail.com"
2026-03-14 19:19:48.478 WAT

Cloud Run

ReplaceService

repurpose-worker

psychmasteryadmin@gmail.c…
audit_log, method: "google.cloud.run.v1.Services.ReplaceService", principal_email: "psychmasteryadmin@gmail.com"
2026-03-14 19:19:54.404 WAT
Starting new instance. Reason: DEPLOYMENT_ROLLOUT - Instance started due to traffic shifting between revisions due to deployment, traffic split adjustment, or deployment health check.
2026-03-14 19:19:56.264 WAT
[repurpose-worker] Listening on port 8080
2026-03-14 19:19:56.277 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "repurpose-worker-1" on port 8080.
2026-03-14 19:19:56.347 WAT

Cloud Run

ReplaceService

repurpose-worker-00002-b8w
Ready condition status changed to True for Revision repurpose-worker-00002-b8w with message: Deploying revision succeeded in 7.62s.
2026-03-14 19:19:57.292 WAT


GET

403

0 ms

Chrome 145.0.0.0
https://repurpose-worker-lsento5exq-uc.a.run.app/
2026-03-14 19:19:57.414 WAT


GET

403

0 ms

Chrome 145.0.0.0
https://repurpose-worker-lsento5exq-uc.a.run.app/favicon.ico
2026-03-14 19:19:57.415 WAT


GET

403

0 ms

Chrome 145.0.0.0
https://repurpose-worker-lsento5exq-uc.a.run.app/
2026-03-14 19:19:57.605 WAT


GET

403

0 ms

Chrome 145.0.0.0
https://repurpose-worker-lsento5exq-uc.a.run.app/favicon.ico
2026-03-14 19:19:57.669 WAT

Cloud Run

ReplaceService

repurpose-worker
Ready condition status changed to True for Service repurpose-worker.
2026-03-14 19:25:45.276 WAT

POST

200

257 B

62 ms

Google-Cloud-Tasks
https://repurpose-worker-1030441621671.us-central1.run.app/
2026-03-14 19:25:45.326 WAT
[repurpose-worker] Job cmmqnp44o0004js0481igemkx started — topic: Symptom Onset & Duration
2026-03-14 19:26:35.676 WAT
[repurpose-worker] Job cmmqnp44o0004js0481igemkx FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 19:26:38.112 WAT

POST

200

257 B

9 ms

Google-Cloud-Tasks
https://repurpose-worker-1030441621671.us-central1.run.app/
2026-03-14 19:26:38.139 WAT
[repurpose-worker] Job cmmqnq8wm000hjs040df21kes started — topic: Mental Status Exam: Thought Process
2026-03-14 19:26:38.385 WAT
[repurpose-worker] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:26:38.385 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 19:26:38.385 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:26:38.385 WAT
    at async /app/dist/index.js:64:9
2026-03-14 19:27:04.077 WAT
[repurpose-worker] Job cmmqnq8wm000hjs040df21kes FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 19:27:07.878 WAT
[repurpose-worker] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:27:07.878 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 19:27:07.878 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:27:07.878 WAT
    at async /app/dist/index.js:64:9
2026-03-14 19:38:43.967 WAT

POST

200

257 B

5 ms

Google-Cloud-Tasks
https://repurpose-worker-1030441621671.us-central1.run.app/
2026-03-14 19:38:43.987 WAT
[repurpose-worker] Job cmmqo5sky0001l204f5sqm48j started — topic: Mental Status Exam: Thought Process
2026-03-14 19:39:25.177 WAT
[repurpose-worker] Job cmmqo5sky0001l204f5sqm48j FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 19:39:29.577 WAT
[repurpose-worker] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:39:29.577 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 19:39:29.577 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:39:29.577 WAT
    at async /app/dist/index.js:64:9
2026-03-14 20:52:13.586 WAT

POST

200

257 B

1.298 s

Google-Cloud-Tasks
https://repurpose-worker-1030441621671.us-central1.run.app/
2026-03-14 20:52:13.621 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 20:52:15.051 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "repurpose-worker-1" on port 8080.
2026-03-14 20:52:15.056 WAT
[repurpose-worker] Listening on port 8080
2026-03-14 20:52:15.136 WAT
[repurpose-worker] Job cmmqqsb040001jm04fl5z6kvo started — topic: Symptom Onset & Duration
2026-03-14 20:53:20.194 WAT
[repurpose-worker] Job cmmqqsb040001jm04fl5z6kvo FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 20:53:44.893 WAT
[repurpose-worker] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 20:53:44.893 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 20:53:44.893 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 20:53:44.893 WAT
    at async /app/dist/index.js:64:9
2026-03-14 21:20:42.235 WAT

POST

200

257 B

1.168 s

Google-Cloud-Tasks
https://repurpose-worker-1030441621671.us-central1.run.app/
2026-03-14 21:20:42.276 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 21:20:43.638 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "repurpose-worker-1" on port 8080.
2026-03-14 21:20:43.641 WAT
[repurpose-worker] Listening on port 8080
2026-03-14 21:20:43.690 WAT
[repurpose-worker] Job cmmqrsxiy0001js04mjkndph5 started — topic: Symptom Onset & Duration
2026-03-14 21:21:45.474 WAT
[repurpose-worker] Job cmmqrsxiy0001js04mjkndph5 FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 21:21:54.974 WAT
[repurpose-worker] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:21:54.974 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 21:21:54.974 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:21:54.974 WAT
    at async /app/dist/index.js:64:9
2026-03-14 21:22:03.177 WAT

POST

200

257 B

10 ms

Google-Cloud-Tasks
https://repurpose-worker-1030441621671.us-central1.run.app/
2026-03-14 21:22:03.202 WAT
[repurpose-worker] Job cmmqruoc3000cjs040169mva0 started — topic: Symptom Onset & Duration
2026-03-14 21:22:13.288 WAT

POST

200

257 B

6 ms

Google-Cloud-Tasks
https://repurpose-worker-1030441621671.us-central1.run.app/
2026-03-14 21:22:13.297 WAT
[repurpose-worker] Job cmmqruw5i000qjs04qu5hyyf5 started — topic: Presenting Chief Complaint
2026-03-14 21:22:17.651 WAT

POST

200

257 B

3 ms

Google-Cloud-Tasks
https://repurpose-worker-1030441621671.us-central1.run.app/
2026-03-14 21:22:17.656 WAT
[repurpose-worker] Job cmmqruzjj000xjs04sippukyv started — topic: Symptom Onset & Duration
2026-03-14 21:22:28.974 WAT
[repurpose-worker] Job cmmqruoc3000cjs040169mva0 FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 21:22:32.974 WAT
[repurpose-worker] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:22:32.974 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 21:22:32.974 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:22:32.974 WAT
    at async /app/dist/index.js:64:9
2026-03-14 21:22:46.274 WAT
[repurpose-worker] Job cmmqruw5i000qjs04qu5hyyf5 FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 21:22:58.774 WAT
[repurpose-worker] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:22:58.774 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 21:22:58.774 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:22:58.774 WAT
    at async /app/dist/index.js:64:9
2026-03-14 21:23:04.874 WAT
[repurpose-worker] Job cmmqruzjj000xjs04sippukyv FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 21:23:08.273 WAT
[repurpose-worker] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:23:08.273 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 21:23:08.274 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:23:08.274 WAT
    at async /app/dist/index.js:64:9





carousel-renderer Region: us-central1 URL: https://carousel-renderer-1030441621671.us-central1.run.app Scaling: Auto (Min: 0, Max: 10) 
Observability
Revisions
Source
Triggers
Networking
Security
YAML
Metrics
Logs
SLOs
Errors
Logs
Severity
Default
Filter
Severity
Time
Summary
Loading... Scanned up to 3/13/26, 12:32 AM.
2026-03-13 06:26:43.338 WAT

Cloud Run

CreateService

carousel-renderer

psychmasteryadmin@gmail.c…
audit_log, method: "google.cloud.run.v1.Services.CreateService", principal_email: "psychmasteryadmin@gmail.com"
2026-03-13 06:27:17.766 WAT
Starting new instance. Reason: DEPLOYMENT_ROLLOUT - Instance started due to traffic shifting between revisions due to deployment, traffic split adjustment, or deployment health check.
2026-03-13 06:27:19.890 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "carousel-renderer-1" on port 8080.
2026-03-13 06:27:19.893 WAT
[carousel-renderer] Listening on port 8080
2026-03-13 06:27:19.961 WAT

Cloud Run

CreateService

carousel-renderer-00001-cq5
Ready condition status changed to True for Revision carousel-renderer-00001-cq5 with message: Deploying revision succeeded in 36.21s.
2026-03-13 06:27:21.251 WAT

Cloud Run

CreateService

carousel-renderer
Ready condition status changed to True for Service carousel-renderer.
2026-03-13 06:28:06.595 WAT


GET

403

0 ms

Chrome 145.0.0.0
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-13 06:28:07.860 WAT


GET

403

0 ms

Chrome 145.0.0.0
https://carousel-renderer-1030441621671.us-central1.run.app/favicon.ico
2026-03-14 13:34:57.074 WAT

POST

200

257 B

1.7 s

Google-Cloud-Tasks
https://carousel-renderer-lsento5exq-uc.a.run.app/
2026-03-14 13:34:57.126 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 13:34:58.912 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "carousel-renderer-1" on port 8080.
2026-03-14 13:34:58.916 WAT
[carousel-renderer] Listening on port 8080
2026-03-14 13:34:59.016 WAT
[carousel-renderer] Job cmmqb5kxr0001gokwt02roohn started — platform: IG, topic: Presenting Chief Complaint
2026-03-14 13:35:30.919 WAT
[carousel-renderer] Job cmmqb5kxr0001gokwt02roohn FAILED: Timed out after 30000 ms while waiting for the WS endpoint URL to appear in stdout!
2026-03-14 13:36:03.115 WAT
[carousel-renderer] Callback failed: TypeError: fetch failed
2026-03-14 13:36:03.115 WAT
    at node:internal/deps/undici/undici:14902:13
2026-03-14 13:36:03.115 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 13:36:03.115 WAT
    at async postCallback (/app/dist/types.js:9:17)
2026-03-14 13:36:03.115 WAT
    at async /app/dist/index.js:66:9 {
2026-03-14 13:36:03.115 WAT
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:3000
2026-03-14 13:36:03.115 WAT
      at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1611:16) {
2026-03-14 13:36:03.115 WAT
    errno: -111,
2026-03-14 13:36:03.115 WAT
    code: 'ECONNREFUSED',
2026-03-14 13:36:03.115 WAT
    syscall: 'connect',
2026-03-14 13:36:03.115 WAT
    address: '127.0.0.1',
2026-03-14 13:36:03.115 WAT
    port: 3000
2026-03-14 13:36:03.115 WAT
  }
2026-03-14 13:36:03.115 WAT
}
2026-03-14 19:10:13.224 WAT

POST

200

257 B

1.567 s

Google-Cloud-Tasks
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-14 19:10:13.259 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 19:10:14.925 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "carousel-renderer-1" on port 8080.
2026-03-14 19:10:14.928 WAT
[carousel-renderer] Listening on port 8080
2026-03-14 19:10:15.045 WAT
[carousel-renderer] Job cmmqn54gf0001js04ns4owjsf started — platform: IG, topic: Presenting Chief Complaint
2026-03-14 19:10:49.693 WAT
[carousel-renderer] Job cmmqn54gf0001js04ns4owjsf FAILED: Timed out after 30000 ms while waiting for the WS endpoint URL to appear in stdout!
2026-03-14 19:12:38.297 WAT
[carousel-renderer] Callback failed: Error: Callback to https://pam-shopify.vercel.app/api/production/render-done failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:12:38.297 WAT
    at postCallback (/app/dist/types.js:16:15)
2026-03-14 19:12:38.297 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:12:38.297 WAT
    at async /app/dist/index.js:66:9
2026-03-14 19:22:36.328 WAT

POST

200

257 B

6 ms

Google-Cloud-Tasks
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-14 19:22:36.350 WAT
[carousel-renderer] Job cmmqnl1rj0001js042llbyodq started — platform: IG, topic: Presenting Chief Complaint
2026-03-14 19:23:07.093 WAT
[carousel-renderer] Job cmmqnl1rj0001js042llbyodq FAILED: Timed out after 30000 ms while waiting for the WS endpoint URL to appear in stdout!
2026-03-14 19:23:19.793 WAT
[carousel-renderer] Callback failed: Error: Callback to https://pam-shopify.vercel.app/api/production/render-done failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:23:19.793 WAT
    at postCallback (/app/dist/types.js:16:15)
2026-03-14 19:23:19.793 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:23:19.793 WAT
    at async /app/dist/index.js:66:9
2026-03-14 19:40:26.515 WAT

POST

200

257 B

1.271 s

Google-Cloud-Tasks
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-14 19:40:26.538 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 19:40:28.024 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "carousel-renderer-1" on port 8080.
2026-03-14 19:40:28.028 WAT
[carousel-renderer] Listening on port 8080
2026-03-14 19:40:28.079 WAT
[carousel-renderer] Job cmmqo8045000cl2046tntclwm started — platform: IG, topic: Presenting Chief Complaint
2026-03-14 19:41:01.869 WAT
[carousel-renderer] Job cmmqo8045000cl2046tntclwm FAILED: Timed out after 30000 ms while waiting for the WS endpoint URL to appear in stdout!
2026-03-14 19:42:49.869 WAT
[carousel-renderer] Callback failed: Error: Callback to https://pam-shopify.vercel.app/api/production/render-done failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:42:49.869 WAT
    at postCallback (/app/dist/types.js:16:15)
2026-03-14 19:42:49.869 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:42:49.870 WAT
    at async /app/dist/index.js:66:9
2026-03-14 20:52:21.099 WAT

POST

200

257 B

1.675 s

Google-Cloud-Tasks
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-14 20:52:21.133 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 20:52:22.918 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "carousel-renderer-1" on port 8080.
2026-03-14 20:52:22.921 WAT
[carousel-renderer] Listening on port 8080
2026-03-14 20:52:23.037 WAT
[carousel-renderer] Job cmmqqsh900008jm04juj6q3iu started — platform: IG, topic: Presenting Chief Complaint
2026-03-14 20:52:59.355 WAT
[carousel-renderer] Job cmmqqsh900008jm04juj6q3iu FAILED: Timed out after 30000 ms while waiting for the WS endpoint URL to appear in stdout!
2026-03-14 20:54:32.555 WAT
[carousel-renderer] Callback failed: Error: Callback to https://pam-shopify.vercel.app/api/production/render-done failed [500]: {"error":"Server misconfiguration"}
2026-03-14 20:54:32.555 WAT
    at postCallback (/app/dist/types.js:16:15)
2026-03-14 20:54:32.555 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 20:54:32.555 WAT
    at async /app/dist/index.js:66:9
2026-03-14 21:19:58.505 WAT

POST

200

257 B

1.359 s

Google-Cloud-Tasks
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-14 21:19:58.546 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 21:19:59.997 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "carousel-renderer-1" on port 8080.
2026-03-14 21:20:00.001 WAT
[carousel-renderer] Listening on port 8080
2026-03-14 21:20:00.105 WAT
[carousel-renderer] Job cmmqrrzmc0001i80411ez6awp started — platform: IG, topic: Presenting Chief Complaint
2026-03-14 21:20:17.635 WAT

POST

200

257 B

7 ms

Google-Cloud-Tasks
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-14 21:20:17.648 WAT
[carousel-renderer] Job cmmqrsewb0004i804obbsuqwl started — platform: IG, topic: Presenting Chief Complaint
2026-03-14 21:20:31.457 WAT
[carousel-renderer] Job cmmqrrzmc0001i80411ez6awp FAILED: Timed out after 30000 ms while waiting for the WS endpoint URL to appear in stdout!
2026-03-14 21:22:06.947 WAT
[carousel-renderer] Job cmmqrsewb0004i804obbsuqwl FAILED: Timed out after 30000 ms while waiting for the WS endpoint URL to appear in stdout!
2026-03-14 21:22:09.811 WAT

POST

200

257 B

59 ms

Google-Cloud-Tasks
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-14 21:22:09.884 WAT
[carousel-renderer] Job cmmqrut9r000njs047xal2po9 started — platform: IG, topic: Presenting Chief Complaint
2026-03-14 21:22:09.954 WAT
[carousel-renderer] Callback failed: TypeError: fetch failed
2026-03-14 21:22:09.954 WAT
    at node:internal/deps/undici/undici:14902:13
2026-03-14 21:22:09.954 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:22:09.954 WAT
    at async postCallback (/app/dist/types.js:9:17)
2026-03-14 21:22:09.954 WAT
    at async /app/dist/index.js:66:9 {
2026-03-14 21:22:09.954 WAT
  [cause]: ConnectTimeoutError: Connect Timeout Error
2026-03-14 21:22:09.954 WAT
      at onConnectTimeout (/app/node_modules/undici/lib/core/connect.js:186:24)
2026-03-14 21:22:09.954 WAT
      at /app/node_modules/undici/lib/core/connect.js:133:46
2026-03-14 21:22:09.954 WAT
      at Immediate._onImmediate (/app/node_modules/undici/lib/core/connect.js:174:9)
2026-03-14 21:22:09.954 WAT
      at process.processImmediate (node:internal/timers:483:21) {
2026-03-14 21:22:09.954 WAT
    code: 'UND_ERR_CONNECT_TIMEOUT'
2026-03-14 21:22:09.954 WAT
  }
2026-03-14 21:22:09.954 WAT
}
2026-03-14 21:22:49.947 WAT
[carousel-renderer] Callback failed: Error: Callback to https://pam-shopify.vercel.app/api/production/render-done failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:22:49.947 WAT
    at postCallback (/app/dist/types.js:16:15)
2026-03-14 21:22:49.947 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:22:49.947 WAT
    at async /app/dist/index.js:66:9
2026-03-14 21:22:56.447 WAT
[carousel-renderer] Job cmmqrut9r000njs047xal2po9 FAILED: Timed out after 30000 ms while waiting for the WS endpoint URL to appear in stdout!
2026-03-14 21:23:08.747 WAT
[carousel-renderer] Callback failed: Error: Callback to https://pam-shopify.vercel.app/api/production/render-done failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:23:08.747 WAT
    at postCallback (/app/dist/types.js:16:15)
2026-03-14 21:23:08.747 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:23:08.747 WAT
    at async /app/dist/index.js:66:9
2026-03-15 17:34:36.995 WAT


GET

403

0 ms

Chrome 145.0.0.0
https://carousel-renderer-1030441621671.us-central1.run.app/
2026-03-15 17:34:38.987 WAT


GET

403

0 ms

Chrome 145.0.0.0
https://carousel-renderer-1030441621671
{
httpRequest: {10}
insertId: "69b6df9f000020c3e07c6dce"
logName: "projects/psych-mastery-production/logs/run.googleapis.com%2Frequests"
receiveTimestamp: "2026-03-15T16:34:39.110346551Z"
resource: {2}
severity: "WARNING"
spanId: "0bbca71dd584b080"
textPayload: "The request was not authenticated. Either allow unauthenticated invocations or set the proper Authorization header. Read more at https://cloud.google.com/run/docs/securing/authenticating Additional troubleshooting documentation can be found at: https://cloud.google.com/run/docs/troubleshooting#unauthorized-client"
timestamp: "2026-03-15T16:34:38.987575Z"
trace: "projects/psych-mastery-production/traces/81ef19f643c4e092e8efee0c384cd861"
}




video-renderer Region: us-central1 URL: https://video-renderer-1030441621671.us-central1.run.app Scaling: Auto (Min: 0, Max: 5) 
Observability
Revisions
Source
Triggers
Networking
Security
YAML
Metrics
Logs
SLOs
Errors
Logs
Severity
Default
Filter
Severity
Time
Summary
Loading... Scanned up to 3/13/26, 2:14 PM.
2026-03-13 06:42:47.066 WAT

Cloud Run

CreateService

video-renderer

psychmasteryadmin@gmail.c…
audit_log, method: "google.cloud.run.v1.Services.CreateService", principal_email: "psychmasteryadmin@gmail.com"
2026-03-13 06:43:12.435 WAT
Starting new instance. Reason: DEPLOYMENT_ROLLOUT - Instance started due to traffic shifting between revisions due to deployment, traffic split adjustment, or deployment health check.
2026-03-13 06:43:15.002 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "video-renderer-1" on port 8080.
2026-03-13 06:43:15.004 WAT
[video-renderer] Listening on port 8080
2026-03-13 06:43:15.058 WAT

Cloud Run

CreateService

video-renderer-00001-p75
Ready condition status changed to True for Revision video-renderer-00001-p75 with message: Deploying revision succeeded in 27.74s.
2026-03-13 06:43:16.385 WAT

Cloud Run

CreateService

video-renderer
Ready condition status changed to True for Service video-renderer.
2026-03-14 19:25:46.269 WAT

POST

200

257 B

1.966 s

Google-Cloud-Tasks
https://video-renderer-1030441621671.us-central1.run.app/
2026-03-14 19:25:46.303 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 19:25:48.507 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "video-renderer-1" on port 8080.
2026-03-14 19:25:48.509 WAT
[video-renderer] Listening on port 8080
2026-03-14 19:25:48.530 WAT
[video-renderer] Job cmmqnp4bn000bjs04rrpvrcmj started — topic: Symptom Onset & Duration
2026-03-14 19:25:48.556 WAT
[video-renderer] Generating audio for job cmmqnp4bn000bjs04rrpvrcmj
2026-03-14 19:26:28.504 WAT
[video-renderer] Job cmmqnp4bn000bjs04rrpvrcmj FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 19:26:35.804 WAT
[video-renderer] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:26:35.804 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 19:26:35.804 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:26:35.804 WAT
    at async /app/dist/index.js:76:9
2026-03-14 19:26:39.079 WAT

POST

200

257 B

4 ms

Google-Cloud-Tasks
https://video-renderer-1030441621671.us-central1.run.app/
2026-03-14 19:26:39.100 WAT
[video-renderer] Job cmmqnq939000ojs0467u3n95o started — topic: Mental Status Exam: Thought Process
2026-03-14 19:26:39.101 WAT
[video-renderer] Generating audio for job cmmqnq939000ojs0467u3n95o
2026-03-14 19:27:14.304 WAT
[video-renderer] Job cmmqnq939000ojs0467u3n95o FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 19:27:16.305 WAT
[video-renderer] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:27:16.305 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 19:27:16.305 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:27:16.305 WAT
    at async /app/dist/index.js:76:9
2026-03-14 19:38:44.947 WAT

POST

200

257 B

27 ms

Google-Cloud-Tasks
https://video-renderer-1030441621671.us-central1.run.app/
2026-03-14 19:38:44.989 WAT
[video-renderer] Job cmmqo5t6k0008l204tbq4rqj7 started — topic: Mental Status Exam: Thought Process
2026-03-14 19:38:44.990 WAT
[video-renderer] Generating audio for job cmmqo5t6k0008l204tbq4rqj7
2026-03-14 19:39:15.404 WAT
[video-renderer] Job cmmqo5t6k0008l204tbq4rqj7 FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 19:39:19.718 WAT
[video-renderer] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 19:39:19.718 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 19:39:19.718 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 19:39:19.718 WAT
    at async /app/dist/index.js:76:9
2026-03-14 20:52:27.002 WAT

POST

200

257 B

1.954 s

Google-Cloud-Tasks
https://video-renderer-1030441621671.us-central1.run.app/
2026-03-14 20:52:27.036 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 20:52:29.281 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "video-renderer-1" on port 8080.
2026-03-14 20:52:29.284 WAT
[video-renderer] Listening on port 8080
2026-03-14 20:52:29.330 WAT
[video-renderer] Job cmmqqsltn000bjm04uq1cdqsa started — topic: Symptom Onset & Duration
2026-03-14 20:52:29.354 WAT
[video-renderer] Generating audio for job cmmqqsltn000bjm04uq1cdqsa
2026-03-14 20:53:17.928 WAT
[video-renderer] Job cmmqqsltn000bjm04uq1cdqsa FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 20:53:27.328 WAT
[video-renderer] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 20:53:27.328 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 20:53:27.328 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 20:53:27.328 WAT
    at async /app/dist/index.js:76:9
2026-03-14 21:21:08.068 WAT

POST

200

257 B

836 ms

Google-Cloud-Tasks
https://video-renderer-1030441621671.us-central1.run.app/
2026-03-14 21:21:08.104 WAT
Starting new instance. Reason: AUTOSCALING - Instance started due to configured scaling factors (e.g. CPU utilization, request throughput, etc.) or no existing capacity for current traffic.
2026-03-14 21:21:09.146 WAT
Default STARTUP TCP probe succeeded after 1 attempt for container "video-renderer-1" on port 8080.
2026-03-14 21:21:09.148 WAT
[video-renderer] Listening on port 8080
2026-03-14 21:21:09.186 WAT
[video-renderer] Job cmmqrthtq0008js04ufg1wvwu started — topic: Symptom Onset & Duration
2026-03-14 21:21:09.192 WAT
[video-renderer] Generating audio for job cmmqrthtq0008js04ufg1wvwu
2026-03-14 21:21:59.775 WAT
[video-renderer] Job cmmqrthtq0008js04ufg1wvwu FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 21:22:07.775 WAT
[video-renderer] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:22:07.775 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 21:22:07.775 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:22:07.775 WAT
    at async /app/dist/index.js:76:9
2026-03-14 21:22:08.815 WAT

POST

200

257 B

3 ms

Google-Cloud-Tasks
https://video-renderer-1030441621671.us-central1.run.app/
2026-03-14 21:22:08.834 WAT
[video-renderer] Job cmmqrusnv000jjs04jov4mtsm started — topic: Symptom Onset & Duration
2026-03-14 21:22:08.835 WAT
[video-renderer] Generating audio for job cmmqrusnv000jjs04jov4mtsm
2026-03-14 21:22:23.569 WAT

POST

200

257 B

5 ms

Google-Cloud-Tasks
https://video-renderer-1030441621671.us-central1.run.app/
2026-03-14 21:22:23.579 WAT
[video-renderer] Job cmmqrv43e0014js04nhvcmh6v started — topic: Symptom Onset & Duration
2026-03-14 21:22:23.580 WAT
[video-renderer] Generating audio for job cmmqrv43e0014js04nhvcmh6v
2026-03-14 21:22:27.075 WAT
[video-renderer] Job cmmqrusnv000jjs04jov4mtsm FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 21:22:32.075 WAT
[video-renderer] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:22:32.075 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 21:22:32.075 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:22:32.075 WAT
    at async /app/dist/index.js:76:9
2026-03-14 21:22:55.909 WAT

POST

200

257 B

8 ms

Google-Cloud-Tasks
https://video-renderer-1030441621671.us-central1.run.app/
2026-03-14 21:22:55.933 WAT
[video-renderer] Job cmmqrv43e0014js04nhvcmh6v FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 21:22:55.937 WAT
[video-renderer] Job cmmqrvt1b0018js04ws1bnoz4 started — topic: Symptom Onset & Duration
2026-03-14 21:22:55.939 WAT
[video-renderer] Generating audio for job cmmqrvt1b0018js04ws1bnoz4
2026-03-14 21:22:56.176 WAT
[video-renderer] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:22:56.176 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 21:22:56.176 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:22:56.176 WAT
    at async /app/dist/index.js:76:9
2026-03-14 21:23:14.375 WAT
[video-renderer] Job cmmqrvt1b0018js04ws1bnoz4 FAILED: Vercel Blob: Cannot use public access on a private store. The store is configured with private access.
2026-03-14 21:23:17.676 WAT
[video-renderer] Callback failed: Error: Callback failed [500]: {"error":"Server misconfiguration"}
2026-03-14 21:23:17.676 WAT
    at postCallback (/app/dist/types.js:12:15)
2026-03-14 21:23:17.676 WAT
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-03-14 21:23:17.676 WAT
    at async /app/dist/index.js:76:9