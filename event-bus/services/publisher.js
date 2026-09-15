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
          console.warn('Redis connection failed, falling back to in-memory event bus.');
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
      this.useRedis = false;
    });

    this.redisPublisher.on('connect', () => {
      console.log('Redis connected successfully.');
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
