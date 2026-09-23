import { R, X, lesson, mcq, numeric, short } from './helpers';
import type { Lesson } from '@/lib/types';

/** SOFTWARE / Networks & APIs - how robots talk to other machines. */
export const API_LESSONS: Lesson[] = [
  lesson({
    id: 'api-01',
    subject: 'apis',
    order: 1,
    title: 'HTTP, Requests and Status Codes',
    difficulty: 'beginner',
    minutes: 40,
    prereqs: ['py-04'],
    description: 'How HTTP works: methods, headers, status codes and the request/response cycle.',
    why: 'A robot fetches maps and models over HTTP, reports telemetry to a dashboard, and is often controlled through a web interface. ROS 2 bridges, camera streams and cloud APIs are all HTTP. Understanding the protocol makes failures legible instead of mysterious.',
    objectives: [
      'Describe the HTTP request/response cycle including methods, headers and body',
      'Interpret status code classes and diagnose the common ones from experience',
      'Make HTTP requests from code with correct timeouts, retries and error handling',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Status codes you will actually meet',
        columns: ['Code', 'Meaning', 'Usual cause and fix'],
        rows: [
          ['200 OK', 'Success', 'Normal'],
          ['201 Created', 'Resource created', 'Normal after POST'],
          ['204 No Content', 'Success, empty body', 'Normal after DELETE or a status update'],
          ['400 Bad Request', 'Malformed request', 'Your payload is wrong - check the body and Content-Type'],
          ['401 Unauthorized', 'Not authenticated', 'Missing, expired or invalid credentials'],
          ['403 Forbidden', 'Authenticated but not permitted', 'Credentials are fine; permissions are not'],
          ['404 Not Found', 'No such resource', 'Wrong URL, or the resource was deleted'],
          ['409 Conflict', 'State conflict', 'Duplicate creation, or a version mismatch'],
          ['422 Unprocessable', 'Valid syntax, invalid semantics', 'Schema validation failed - read the error body'],
          ['429 Too Many Requests', 'Rate limited', 'Back off; respect Retry-After'],
          ['500 Internal Server Error', 'Server-side failure', 'Not your bug; retry with backoff and report'],
          ['502/503/504', 'Gateway / unavailable / timeout', 'Upstream or overload problem; retry with backoff'],
        ],
      },
      {
        kind: 'text',
        heading: 'Timeouts are mandatory, not optional',
        body: [
          'An HTTP request without a timeout can hang forever - a robot waiting on a dead server stops doing everything else. Always set a connect timeout and a read timeout. On an unstable Wi-Fi link, a robot in motion needs short timeouts (1-3 s) and a defined fallback behaviour, because the map fetch failing must not stop obstacle avoidance.',
          'Retries need exponential backoff with jitter. Retrying immediately and repeatedly against an overloaded server makes the outage worse, and identical retry timing across many clients synchronises them into a thundering herd.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Never block a control loop on network I/O',
        body: [
          'Network latency is unbounded and unreliable. Any architecture where a motor command waits on an HTTP response will eventually fail. Separate the concerns: a background task fetches and caches data, and the control loop reads the cache with a timestamp, treating stale data as an explicit error condition rather than blocking.',
        ],
      },
    ],
    resources: [
      R('MDN: HTTP overview', 'docs', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', { author: 'MDN', minutes: 90, note: 'Free and authoritative.' }),
      R('MDN: HTTP response status codes', 'docs', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status', { author: 'MDN', minutes: 45 }),
      R('HTTP requests in Python with urllib/requests', 'docs', 'https://docs.python.org/3/library/urllib.request.html', { author: 'Python Software Foundation', minutes: 40 }),
    ],
    exercises: [
      X('code', 'Write a `fetch_json(url, timeout, retries)` helper that sets connect and read timeouts, retries only on 429/5xx and network errors with exponential backoff plus jitter, respects Retry-After, and raises a typed error otherwise. Test each path with a mock.', 40, { solution: 'Must NOT retry on 4xx other than 429 - those are your bug, and retrying hides it. Jitter should be random within a range so clients do not synchronise. Log each attempt with the status and delay.' }),
      X('question', 'Your robot fetches a map over HTTP at startup, and the fetch fails on a poor Wi-Fi link. Compare three designs: (a) block until it succeeds, (b) fail to start, (c) start with a cached map and update in the background. State the trade-offs and choose one.', 25, { solution: '(a) A robot that never starts on bad Wi-Fi is useless in the field. (b) Safe but brittle - a network blick prevents all operation, and the robot cannot even report why. (c) Best: start from cache, refresh in the background, and treat a stale cache as a degraded mode with explicit limits (for example no exploration beyond the cached area). The cache must have a timestamp and a maximum staleness.' }),
    ],
    questions: [
      mcq(1, 'A 401 response means:', ['The client is not authenticated', 'The client is authenticated but lacks permission', 'The resource does not exist', 'The server failed'], 0, '403 is the permission case. Confusing the two sends you debugging the wrong system.'),
      mcq(1, 'Which status code means the server had an internal failure?', ['500', '400', '404', '429'], 0, '4xx are client errors (your bug); 5xx are server errors (retry with backoff).'),
      mcq(2, 'A request with no timeout can:', ['Hang indefinitely, blocking whatever waits on it', 'Fail after 30 seconds automatically', 'Always succeed eventually', 'Return 408'], 0, 'Always set both a connect and a read timeout. This is the single most common HTTP bug in robot software.'),
      mcq(2, 'Which codes are safe to retry automatically?', ['429 and 5xx, with exponential backoff and jitter', 'All error codes', '400 and 404', '401 and 403'], 0, 'Retrying 4xx other than 429 just repeats a mistake and hides it. Backoff with jitter avoids synchronising clients.'),
      mcq(3, 'Why must a control loop never block on an HTTP request?', [
        'Network latency is unbounded, so a blocked loop misses its deadline and the robot loses control',
        'HTTP is too slow to be useful',
        'It uses too much memory',
        'Blocking is fine if the timeout is short',
      ], 0, 'Fetch in a background task, cache with a timestamp, and treat stale data as an explicit degraded state.'),
      mcq(3, 'A cached map with a timestamp is better than blocking on a fresh fetch because:', [
        'The robot can operate in a degraded mode instead of not operating at all',
        'Caching is always more accurate',
        'It removes the need for error handling',
        'It reduces server load to zero',
      ], 0, 'The cache must still have a maximum staleness and an explicit behaviour when exceeded.'),
      numeric(2, 'How many bytes of body does a 204 No Content response carry?', 0, 'None - by definition. A 204 with a body is a protocol violation and some clients will hang.', { unit: 'bytes' }),
      short(1, 'Which HTTP method is idempotent and typically used to update a resource wholly?', ['PUT'], 'PUT. POST creates and is not idempotent; PATCH applies a partial update.'),
    ],
    skills: ['net-http'],
  }),

  lesson({
    id: 'api-02',
    subject: 'apis',
    order: 2,
    title: 'REST, JSON Schemas and API Design',
    difficulty: 'intermediate',
    minutes: 45,
    prereqs: ['api-01'],
    description: 'Resource-oriented design, JSON payloads, validation, and versioning.',
    why: 'You will both consume APIs (cloud vision, mapping services) and expose them (a robot telemetry endpoint for a dashboard). Designing them well the first time avoids breaking every client when you change something.',
    objectives: [
      'Design resource-oriented endpoints with correct methods and status codes',
      'Validate JSON payloads against a schema and reject invalid input with actionable errors',
      'Version an API and explain how to change it without breaking existing clients',
    ],
    learn: [
      {
        kind: 'text',
        heading: 'Resources, not actions',
        body: [
          'REST models the domain as nouns addressed by URL, with HTTP verbs as the operations: GET /robots, GET /robots/7, POST /robots, PATCH /robots/7, DELETE /robots/7. Avoid verb endpoints like POST /startRobot - they do not compose, cannot be cached and are hard to reason about.',
          'Sub-resources express relationships: GET /robots/7/telemetry or GET /robots/7/joints/3. Keep nesting shallow - two levels is usually the maximum before the URL becomes unwieldy; use a query parameter for filtering instead: GET /telemetry?robot=7&since=...',
        ],
      },
      {
        kind: 'formula',
        heading: 'Status codes for a resource API',
        formula: 'GET 200 or 404      POST 201 + Location header      PATCH 200 or 404      DELETE 204 or 404      validation failure 422 with a field-level error body',
        defines: [
          'Return machine-readable errors: {"error": {"code": "validation_failed", "fields": [{"name": "max_speed", "reason": "must be between 0 and 5"}]}}',
          'Never return 200 with an error message in the body - clients must be able to branch on status alone',
          'Idempotency matters: repeating a DELETE must not fail the second time with 500',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        heading: 'Versioning and compatibility',
        body: [
          'Add fields freely - well-written clients ignore unknown fields. Removing or renaming a field, changing a type, or altering the meaning of a value are all breaking changes. Put the version in the path (/v1/robots) or a header, support the old version until clients have migrated, and document deprecation dates. For a robot fleet you cannot update simultaneously, versioning is not optional - a mixed-version fleet is the normal state.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - a robot telemetry API',
        problem: 'Design the endpoints for reading robot state and commanding it safely over HTTP.',
        solution: [
          'GET /v1/robots/7/state - current pose, battery, mode, fault list (200)',
          'GET /v1/robots/7/telemetry?since=<iso>&limit=1000 - time series, paginated (200)',
          'POST /v1/robots/7/commands - {"type": "goto", "x": 1.2, "y": 0.5, "client_id": "..."} (202 Accepted, returns a command id)',
          'GET /v1/robots/7/commands/42 - status of that command: queued, running, succeeded, rejected (200)',
          'Commands are ACCEPTED not executed synchronously, because motion takes seconds and HTTP must not block. The client polls or subscribes for completion',
          'A client_id makes the command idempotent: a retry after a network timeout does not execute the motion twice',
        ],
        answer: 'State and telemetry as GETs; commands as an accepted-then-polled POST with an idempotency key',
      },
    ],
    resources: [
      R('Microsoft REST API guidelines', 'docs', 'https://github.com/microsoft/api-guidelines', { author: 'Microsoft', minutes: 90, note: 'Free, practical, and representative of professional conventions.' }),
      R('JSON Schema', 'docs', 'https://json-schema.org/learn', { minutes: 60, note: 'Free specification and tutorials for validating payloads.' }),
      R('MDN: HTTP request methods', 'docs', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods', { author: 'MDN', minutes: 30 }),
    ],
    exercises: [
      X('code', 'Design and document (in Markdown, no server needed) a REST API for a small robot fleet: list robots, get one robot, get telemetry, send a command, get command status, and register a fault. For each, specify the method, path, request body, success status and two error cases.', 45, { solution: 'Every endpoint needs at least 404 and one validation or state error specified. If you cannot name the error cases, the design is incomplete - clients will discover them in production instead.' }),
      X('code', 'Write a JSON Schema for a robot command payload requiring type (enum), x, y (numbers, finite, bounded) and client_id (string, non-empty). Validate four payloads: one valid and three each breaking a different constraint, and confirm the error messages name the field.', 35, { solution: 'Bounded numeric ranges are what stop a malformed command from driving the robot into a wall. Validate at the boundary, reject early, and report the field name so the client can fix it.' }),
    ],
    questions: [
      mcq(1, 'Which is the RESTful way to delete robot 7?', ['DELETE /robots/7', 'POST /deleteRobot?id=7', 'GET /robots/7/delete', 'PUT /robots/7 with a deleted flag'], 0, 'Nouns in the path, the verb in the HTTP method. Verb endpoints do not compose or cache.'),
      mcq(1, 'A successful POST that creates a resource should return:', ['201 Created with a Location header pointing to the new resource', '200 OK with an empty body', '204 No Content', '302 Found'], 0, 'The Location header lets the client find the resource without guessing its URL.'),
      mcq(2, 'A command that takes several seconds to execute should return:', ['202 Accepted with an id to poll for status', '200 OK after blocking until complete', '204 No Content', '408 Request Timeout'], 0, 'Blocking an HTTP request on a long operation invites timeouts and makes retries dangerous.'),
      mcq(2, 'An idempotency key on a command endpoint prevents:', ['A retried request from executing the same action twice', 'Unauthorised access', 'Server overload', 'Schema errors'], 0, 'Essential when the client cannot tell a timeout from a failure - which is the normal case on a wireless robot.'),
      mcq(3, 'Which change to an API is NOT breaking?', ['Adding a new optional field to a response', 'Renaming an existing field', 'Changing a field from a number to a string', 'Changing what an existing enum value means'], 0, 'Clients should ignore unknown fields. Everything else breaks existing consumers.'),
      mcq(3, 'Validation failures should return:', ['422 with a field-level error body naming each invalid field', '200 with an error message in the body', '500 with no details', '400 with an empty body'], 0, 'Clients must be able to branch on status alone and then act on the field list.'),
      short(1, 'Which HTTP method applies a partial update to a resource?', ['PATCH'], 'PATCH for partial updates; PUT replaces the whole resource.'),
      numeric(3, 'A telemetry endpoint paginates at 500 records per page. How many pages are needed for 12,340 records?', 25, '12340/500 = 24.68, so 25 pages.', { unit: 'pages' }),
    ],
    skills: ['net-rest', 'net-api-design'],
  }),

  lesson({
    id: 'api-03',
    subject: 'apis',
    order: 3,
    title: 'Streaming, WebSockets and Robot Telemetry',
    difficulty: 'intermediate',
    minutes: 40,
    prereqs: ['api-02'],
    description: 'Server-sent events, WebSockets, MQTT and the transport choices for live robot data.',
    why: 'A live dashboard, remote control and fleet monitoring all need data pushed from robot to client. Polling HTTP wastes bandwidth and adds latency. Choosing the right transport - and handling disconnection properly - is what makes remote operation usable.',
    objectives: [
      'Compare polling, server-sent events, WebSockets and MQTT for robot telemetry',
      'Design a telemetry message set with sensible rates and payload sizes',
      'Handle disconnection, reconnection and stale data explicitly in a live client',
    ],
    learn: [
      {
        kind: 'table',
        heading: 'Transport choices',
        columns: ['Transport', 'Direction', 'Good for', 'Cost'],
        rows: [
          ['HTTP polling', 'client pulls', 'Occasional status, simple infrastructure', 'Latency and wasted requests'],
          ['Server-Sent Events', 'server to client', 'Live telemetry to a browser dashboard', 'One-way only, HTTP-based'],
          ['WebSocket', 'full duplex', 'Remote control plus telemetry', 'Connection management, proxies'],
          ['MQTT', 'publish/subscribe', 'Fleet telemetry over poor links, IoT', 'Needs a broker'],
          ['ROS 2 topics (DDS)', 'publish/subscribe', 'On-robot and LAN communication', 'Not suited to wide-area links'],
        ],
      },
      {
        kind: 'text',
        heading: 'Rate and payload discipline',
        body: [
          'Send different data at different rates. Pose and battery at 2-5 Hz is plenty for a human watching a dashboard; joint positions at 20-50 Hz if you are plotting motion quality; images only on demand or at a heavily reduced rate. A 640x480 JPEG at 30 fps is about 1-2 MB/s, which will saturate a poor Wi-Fi link and starve your command channel.',
          'Include a monotonic sequence number and a device timestamp in every message. The sequence number reveals dropped messages; the timestamp reveals latency and lets the client detect staleness even when messages keep arriving.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        heading: 'Disconnection is a normal state, not an exception',
        body: [
          'A wireless robot WILL lose its link. Design for it: the robot must have a defined behaviour when the command channel goes quiet (stop, hold position, or complete the current motion - chosen deliberately, never "keep doing the last thing"), and the client must grey out or explicitly flag data older than a threshold rather than displaying the last value as if it were current. A dashboard showing a two-minute-old position as live is how a robot gets driven into a wall by a human who trusted it.',
        ],
      },
      {
        kind: 'example',
        heading: 'Worked example - command watchdog',
        problem: 'Design the safety mechanism for a robot driven over a wireless link.',
        solution: [
          'The robot requires a heartbeat command at least every 200 ms',
          'If no valid command arrives within the window, it decelerates to a stop along a safe profile - not an instant stop, which could destabilise a loaded robot',
          'Each command carries a sequence number; out-of-order or duplicated commands are ignored so a delayed packet cannot resurrect an old instruction',
          'The client shows link quality and time since last acknowledgement, and disables the drive controls when the link is stale',
          'On reconnect, the robot does NOT resume the previous command - it waits for a fresh one. Resuming stale intent after a dropout is a classic accident',
        ],
        answer: 'Heartbeat with a 200 ms watchdog, sequence numbers, safe deceleration, and no automatic resumption',
      },
    ],
    resources: [
      R('MDN: Server-sent events', 'docs', 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events', { author: 'MDN', minutes: 40 }),
      R('MDN: WebSocket API', 'docs', 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', { author: 'MDN', minutes: 45 }),
      R('MQTT protocol documentation', 'docs', 'https://mqtt.org/', { minutes: 60, note: 'Free. The standard lightweight publish/subscribe protocol for constrained devices and poor links.' }),
    ],
    exercises: [
      X('code', 'Design a telemetry message schema for a differential-drive robot: message types, fields, rates and approximate payload sizes. Compute the total bandwidth for your design and state whether it fits a 1 Mbit/s link.', 35, { solution: 'Example budget: state (pose, battery, mode, faults) as 120-byte JSON at 5 Hz = 600 B/s; joint/wheel data at 20 Hz = 1.6 kB/s; images excluded. Total under 20 kbit/s - comfortably inside 1 Mbit/s with room for commands. Adding 10 fps JPEG images at 30 kB each would consume 2.4 Mbit/s and exceed the link.' }),
      X('code', 'Implement a client-side staleness detector: given a stream of timestamped messages, flag any field whose age exceeds a per-field threshold, and expose a boolean "link healthy" derived from sequence gaps and age.', 35, { solution: 'Two independent signals: message age (is data fresh?) and sequence gaps (are messages being dropped?). A link can be delivering messages that are all stale, or fresh messages with heavy loss - both are degraded, in different ways, and need different responses.' }),
      X('question', 'A robot is driven over Wi-Fi and the link drops for 3 seconds while it is moving at 1 m/s. Compare the outcomes of three designs: no watchdog, watchdog that stops instantly, and watchdog that decelerates over 500 ms. Which is correct and why?', 20, { solution: 'No watchdog: the robot continues at the last commanded speed indefinitely and travels an unknown distance - unacceptable. Instant stop: safe in position but a 1 m/s^2 or greater deceleration can tip a tall or loaded robot and damage a carried payload. Controlled deceleration over 500 ms: travels about 0.25 m while stopping safely, keeping the robot upright and the load secure. The third is correct; the stopping distance must be part of the safety analysis.' }),
    ],
    questions: [
      mcq(1, 'Which transport gives full-duplex communication between a browser and a robot?', ['WebSocket', 'Server-Sent Events', 'HTTP polling', 'MQTT over TCP from a browser'], 0, 'SSE and polling are one-directional or client-initiated. MQTT needs a broker and is awkward from a browser.'),
      mcq(1, 'MQTT is best suited to:', ['Publish/subscribe telemetry over constrained devices and poor network links', 'High-bandwidth video streaming', 'Synchronous request/response', 'On-robot inter-process communication'], 0, 'It is lightweight and broker-mediated. ROS 2 DDS is the right tool on-robot and on a LAN.'),
      mcq(2, 'Including a sequence number in every telemetry message allows the client to:', ['Detect dropped messages', 'Reduce payload size', 'Encrypt the stream', 'Order images'], 0, 'Gaps reveal loss. Without it, a lossy link looks identical to a slowly changing signal.'),
      mcq(2, 'Sending 640x480 JPEG frames at 30 fps requires roughly:', ['1-2 MB/s, which will saturate a poor Wi-Fi link', '50 kB/s', '10 kB/s', '100 MB/s'], 0, 'Stream video on its own channel at a reduced rate and resolution, or on demand only.'),
      mcq(3, 'A robot under wireless control loses its link. The correct default behaviour is:', [
        'A watchdog-triggered controlled deceleration to a stop, chosen deliberately at design time',
        'Continue executing the last command indefinitely',
        'Stop instantly with maximum deceleration',
        'Reverse for two seconds',
      ], 0, 'Instant full stop can tip a loaded or tall robot. Continuing is unsafe. Decelerate on a safe profile.'),
      mcq(3, 'After a link dropout and reconnection, the robot should:', ['Wait for a fresh command rather than resuming the pre-dropout command', 'Resume exactly where it left off', 'Repeat the last command three times', 'Shut down permanently'], 0, 'Resuming stale intent after the environment may have changed is a classic accident mechanism.'),
      mcq(3, 'A dashboard displaying the last received position without an age indicator is dangerous because:', [
        'The operator may act on data that is minutes old, believing it is live',
        'It uses too much memory',
        'Positions cannot be displayed',
        'It is only a cosmetic issue',
      ], 0, 'Always show data age and grey out or flag anything past its staleness threshold.'),
      numeric(2, 'A 150-byte JSON message sent at 10 Hz uses how many bits per second (excluding protocol overhead)?', 12000, '150 * 8 * 10 = 12,000 bit/s.', { unit: 'bit/s' }),
    ],
    skills: ['net-streaming', 'net-telemetry'],
  }),
];
