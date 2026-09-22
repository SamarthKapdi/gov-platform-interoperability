const Redis = require('ioredis');
const EventEmitter = require('events');

class Publisher {
  constructor() {
    this.useRedis = true;
    this.emitter = new EventEmitter();
    this.redisPublisher = null;
    this.redisSubscriber = null;
    this.init();
  }

  init() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.redisPublisher = new Redis(redisUrl, {
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Event Bus] Transport: Fallback (In-Memory)');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 1
    });

    this.redisSubscriber = new Redis(redisUrl, {
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 1
    });

    this.redisPublisher.on('error', (err) => {
      // suppress unhandled error output after fallback
      if (this.useRedis) this.useRedis = false;
    });

    this.redisSubscriber.on('error', (err) => {
      // suppress unhandled error output
    });

    this.redisPublisher.on('connect', () => {
      console.log('[Event Bus] Transport: Redis ACTIVE');
      this.useRedis = true;
    });

    this.redisSubscriber.on('message', (channel, message) => {
      try {
        const payload = JSON.parse(message);
        this.emitter.emit('event', payload);
      } catch (err) {
        console.error('Error parsing redis message', err);
      }
    });

    // Subscribe to all known channels
    const channels = [
      'application.status_changed',
      'document.verified',
      'grievance.updated',
      'consent.granted',
      'consent.revoked',
      'workflow.step_completed'
    ];
    
    this.redisSubscriber.on('connect', () => {
      channels.forEach(ch => this.redisSubscriber.subscribe(ch));
    });
  }

  publish(channel, payload) {
    if (!payload.id) payload.id = require('uuid').v4();
    if (!payload.correlation_id) payload.correlation_id = require('uuid').v4();
    
    if (this.useRedis && this.redisPublisher.status === 'ready') {
      this.redisPublisher.publish(channel, JSON.stringify(payload));
    } else {
      // In-memory fallback
      this.emitter.emit('event', payload);
    }
  }

  subscribe(callback) {
    this.emitter.on('event', callback);
  }
}

module.exports = new Publisher();
