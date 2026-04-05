import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  ip_address: process.env.IP_ADDRESS,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  frontend_url: process.env.FRONTEND_URL,

  // Project branding configuration
  app: {
    name: process.env.APP_NAME || 'Educoin Backend',
    tagline: process.env.APP_TAGLINE || 'Enterprise API',
    version: process.env.APP_VERSION || '1.0.0',
  },

  // Banner configuration
  banner: {
    enabled: process.env.BANNER_ENABLED !== 'false', // Default true
    style: (process.env.BANNER_STYLE || 'double') as
      | 'single'
      | 'double'
      | 'bold'
      | 'rounded',
    asciiFont: process.env.BANNER_ASCII_FONT || 'ANSI Shadow',
    showSystemInfo: process.env.BANNER_SHOW_SYSTEM_INFO !== 'false', // Default true
  },

  // Startup summary configuration
  startupSummary: {
    enabled: process.env.STARTUP_SUMMARY_ENABLED !== 'false', // Default true
    style: (process.env.STARTUP_SUMMARY_STYLE || 'compact') as
      | 'compact'
      | 'progress'
      | 'minimal',
    showTimestamp: process.env.STARTUP_SUMMARY_TIMESTAMP !== 'false', // Default true
    colors: process.env.STARTUP_SUMMARY_COLORS !== 'false', // Default true
  },

  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    jwt_expire_in: process.env.JWT_EXPIRE_IN,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_refresh_expire_in: process.env.JWT_REFRESH_EXPIRE_IN,
  },
  email: {
    from: process.env.EMAIL_FROM,
    user: process.env.EMAIL_USER,
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    pass: process.env.EMAIL_PASS,
  },
  super_admin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
  google_redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  firebase_api_key_base64: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
  firebase_web_push_credentials: process.env.FIREBASE_WEB_PUSH_CREDENTIALS,

  // 🆕 NEW: Tracing capture configuration
  tracing: {
    capture: {
      enabled: process.env.TRACE_CAPTURE_ARGS !== 'false', // Default true
      args: process.env.TRACE_CAPTURE_ARGS !== 'false',
      returns: process.env.TRACE_CAPTURE_RETURNS !== 'false',
      maxDepth: parseInt(process.env.TRACE_CAPTURE_MAX_DEPTH || '5'),
      maxArrayItems: parseInt(process.env.TRACE_CAPTURE_MAX_ARRAY_ITEMS || '10'),
      maxStringLength: parseInt(
        process.env.TRACE_CAPTURE_MAX_STRING_LENGTH || '500'
      ),
      maxSizeKB: parseInt(process.env.TRACE_CAPTURE_MAX_SIZE_KB || '5'),
      maskPII: process.env.TRACE_CAPTURE_MASK_PII !== 'false', // Default true
    },

    // 🆕 NEW: Performance monitoring configuration
    performance: {
      enabled: process.env.TRACE_PERF_ENABLED !== 'false', // Default true
      captureMemory: process.env.TRACE_PERF_MEMORY !== 'false',
      captureCPU: process.env.TRACE_PERF_CPU !== 'false',
      captureEventLoop: process.env.TRACE_PERF_EVENT_LOOP !== 'false',
      eventLoopSampleInterval: parseInt(
        process.env.TRACE_PERF_SAMPLE_INTERVAL || '50'
      ), // ms

      // Display options
      showProgressBars: process.env.TRACE_PERF_SHOW_BARS !== 'false',
      showStatusText: process.env.TRACE_PERF_SHOW_STATUS !== 'false',
      showDetailedBreakdown: process.env.TRACE_PERF_DETAILED !== 'false',

      // Custom thresholds (optional - sensible defaults)
      thresholds: {
        memory: {
          healthy: parseInt(process.env.TRACE_PERF_MEM_HEALTHY || '50'), // MB - Normal operations (bcrypt, moderate queries)
          moderate: parseInt(process.env.TRACE_PERF_MEM_MODERATE || '100'), // MB - Heavy operations (file processing)
          high: parseInt(process.env.TRACE_PERF_MEM_HIGH || '200'), // MB - Very heavy (batch, large files)
        },
        cpu: {
          efficient: parseInt(process.env.TRACE_PERF_CPU_EFFICIENT || '50'), // % - Simple operations
          moderate: parseInt(process.env.TRACE_PERF_CPU_MODERATE || '150'), // % - Thread pool use (bcrypt, JWT, crypto)
          intensive: parseInt(process.env.TRACE_PERF_CPU_INTENSIVE || '300'), // % - Heavy crypto, compression
        },
        eventLoop: {
          excellent: parseInt(process.env.TRACE_PERF_LOOP_EXCELLENT || '5'), // ms
          good: parseInt(process.env.TRACE_PERF_LOOP_GOOD || '15'),
          delayed: parseInt(process.env.TRACE_PERF_LOOP_DELAYED || '30'),
        },
      },
    },
  },
};
