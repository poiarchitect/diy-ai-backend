2025-09-18T21:34:39.324Z [error] Image edit error: BadRequestError: 400 Invalid parameter: 'image[].name'. An array parameter without explicit indices cannot have sub-keys. Use the 'key[$index][subkey]=value' format instead.
    at APIError.generate (file:///var/task/node_modules/openai/core/error.mjs:41:20)
    at OpenAI.makeStatusError (file:///var/task/node_modules/openai/client.mjs:160:32)
    at OpenAI.makeRequest (file:///var/task/node_modules/openai/client.mjs:328:30)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.handler (file:///var/task/api/image-edits.js:53:22)
    at async r (/opt/rust/nodejs.js:2:15569)
    at async Server.<anonymous> (/opt/rust/nodejs.js:2:11594)
    at async Server.<anonymous> (/opt/rust/nodejs.js:16:7632) {
  status: 400,
  headers: Headers {
    date: 'Thu, 18 Sep 2025 21:34:39 GMT',
    'content-type': 'application/json',
    'content-length': '282',
    connection: 'keep-alive',
    'openai-version': '2020-10-01',
    'openai-organization': 'user-htlmcco88ikcwle2wzd8oajt',
    'openai-project': 'proj_R6iTAPYGaUIbNIQsZLMceKm4',
    'x-request-id': 'req_d730770046ecfaf3b93b8ccb17d831dc',
    'openai-processing-ms': '6',
    'x-envoy-upstream-service-time': '10',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    'cf-cache-status': 'DYNAMIC',
    'set-cookie': '__cf_bm=9bBefic5TcATzFpbwnwROOvmsGtgyd2yxYkcc_WWzqA-1758231279-1.0.1.1-ckBacTqGujkWKULg8F1Jdw8sT0TZvh.K7HTXXB8eUKdksaqYZLmf8B7YhuUQEUbQnnD73VS0sj7Z.JVSKmZSTumpNnsWJbg9untgtYoY4Nk; path=/; expires=Thu, 18-Sep-25 
22:04:39 GMT; domain=.api.openai.com; HttpOnly; Secure; SameSite=None, _cfuvid=jXk8fsJ6Coot6HWWGaOs88sx3mZWijcTnevMrJAD2sc-1758231279310-0.0.1.1-604800000; path=/; domain=.api.openai.com; HttpOnly; Secure; SameSite=None',
    'x-content-type-options': 'nosniff',
    server: 'cloudflare',
    'cf-ray': '9813f7f76ce90a8f-IAD',
    'alt-svc': 'h3=":443"; ma=86400'
  },
  requestID: 'req_d730770046ecfaf3b93b8ccb17d831dc',
  error: {
    message: "Invalid parameter: 'image[].name'. An array parameter without explicit indices cannot have sub-keys. Use the 'key[$index][subkey]=value' format instead.",
    type: 'invalid_request_error',
    param: 'image',
    code: 'invalid_parameter'
  },
  code: 'invalid_parameter',
  param: 'image',
  type: 'invalid_request_error'
}
