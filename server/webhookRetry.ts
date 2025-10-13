import { EventEmitter } from 'events';

interface WebhookEvent {
  id: string;
  userId: string;
  event: string;
  data: any;
  timestamp: Date;
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  error?: string;
  status: 'pending' | 'processing' | 'failed' | 'success';
}

/**
 * Webhook retry manager for handling failed webhook events
 * Implements exponential backoff with jitter
 */
export class WebhookRetryManager extends EventEmitter {
  private queue: Map<string, WebhookEvent> = new Map();
  private processing: Set<string> = new Set();
  private retryTimer: NodeJS.Timeout | null = null;
  
  // Retry configuration
  private readonly MAX_RETRIES = 5;
  private readonly BASE_DELAY = 1000; // 1 second
  private readonly MAX_DELAY = 60000; // 1 minute
  private readonly JITTER_FACTOR = 0.3;
  
  constructor(private processWebhook: (event: WebhookEvent) => Promise<void>) {
    super();
    this.startRetryProcess();
  }
  
  /**
   * Add a webhook event to the retry queue
   */
  async addEvent(
    userId: string,
    event: string,
    data: any,
    error?: string
  ): Promise<string> {
    const id = `webhook_${userId}_${event}_${Date.now()}`;
    
    const webhookEvent: WebhookEvent = {
      id,
      userId,
      event,
      data,
      timestamp: new Date(),
      attempts: 0,
      status: 'pending',
      error,
    };
    
    this.queue.set(id, webhookEvent);
    console.log(`Webhook event queued for retry: ${id}`);
    
    // Immediately attempt to process if not already processing
    this.processNextEvent();
    
    return id;
  }
  
  /**
   * Calculate next retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempts: number): number {
    const exponentialDelay = Math.min(
      this.BASE_DELAY * Math.pow(2, attempts),
      this.MAX_DELAY
    );
    
    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * this.JITTER_FACTOR * Math.random();
    
    return Math.floor(exponentialDelay + jitter);
  }
  
  /**
   * Process the next event in the queue
   */
  private async processNextEvent(): Promise<void> {
    // Find next event to process
    const now = new Date();
    let nextEvent: WebhookEvent | undefined;
    
    this.queue.forEach((event) => {
      if (
        !nextEvent &&
        event.status === 'pending' &&
        !this.processing.has(event.id) &&
        (!event.nextRetry || event.nextRetry <= now)
      ) {
        nextEvent = event;
      }
    });
    
    if (!nextEvent) {
      return;
    }
    
    // Mark as processing
    this.processing.add(nextEvent.id);
    nextEvent.status = 'processing';
    nextEvent.attempts++;
    nextEvent.lastAttempt = new Date();
    
    try {
      console.log(`Processing webhook event ${nextEvent.id} (attempt ${nextEvent.attempts})`);
      
      await this.processWebhook(nextEvent);
      
      // Success!
      nextEvent.status = 'success';
      this.queue.delete(nextEvent.id);
      this.emit('success', nextEvent);
      
      console.log(`Webhook event ${nextEvent.id} processed successfully`);
    } catch (error: any) {
      console.error(`Failed to process webhook event ${nextEvent.id}:`, error);
      
      nextEvent.error = error.message || 'Unknown error';
      
      if (nextEvent.attempts >= this.MAX_RETRIES) {
        // Max retries reached, mark as failed
        nextEvent.status = 'failed';
        this.emit('failed', nextEvent);
        
        // Move to dead letter queue (in production, this would persist to database)
        console.error(`Webhook event ${nextEvent.id} failed after ${nextEvent.attempts} attempts`);
        
        // Keep in queue for manual intervention
        // In production, this would be persisted to a dead letter table
      } else {
        // Schedule retry
        const delay = this.calculateRetryDelay(nextEvent.attempts);
        nextEvent.nextRetry = new Date(Date.now() + delay);
        nextEvent.status = 'pending';
        
        console.log(
          `Webhook event ${nextEvent.id} scheduled for retry in ${delay}ms ` +
          `(attempt ${nextEvent.attempts + 1}/${this.MAX_RETRIES})`
        );
      }
    } finally {
      this.processing.delete(nextEvent.id);
    }
    
    // Process next event
    setImmediate(() => this.processNextEvent());
  }
  
  /**
   * Start the retry process timer
   */
  private startRetryProcess(): void {
    if (this.retryTimer) {
      return;
    }
    
    // Check for events to retry every 5 seconds
    this.retryTimer = setInterval(() => {
      this.processNextEvent();
    }, 5000);
  }
  
  /**
   * Stop the retry process
   */
  stopRetryProcess(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }
  
  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    processing: number;
    failed: number;
    total: number;
  } {
    let pending = 0;
    let processing = 0;
    let failed = 0;
    
    this.queue.forEach((event) => {
      switch (event.status) {
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
        case 'failed':
          failed++;
          break;
      }
    });
    
    return {
      pending,
      processing,
      failed,
      total: this.queue.size,
    };
  }
  
  /**
   * Get events for a specific user
   */
  getUserEvents(userId: string): WebhookEvent[] {
    const events: WebhookEvent[] = [];
    
    this.queue.forEach((event) => {
      if (event.userId === userId) {
        events.push({ ...event });
      }
    });
    
    return events.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  /**
   * Manually retry a specific event
   */
  async retryEvent(eventId: string): Promise<boolean> {
    const event = this.queue.get(eventId);
    
    if (!event || event.status === 'processing') {
      return false;
    }
    
    // Reset for immediate retry
    event.status = 'pending';
    event.nextRetry = new Date();
    event.attempts = Math.max(0, event.attempts - 1); // Give it another chance
    
    console.log(`Manually retrying webhook event ${eventId}`);
    this.processNextEvent();
    
    return true;
  }
  
  /**
   * Clear failed events older than specified hours
   */
  clearOldFailedEvents(hoursOld: number = 24): number {
    const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    let cleared = 0;
    
    const toDelete: string[] = [];
    this.queue.forEach((event, id) => {
      if (
        event.status === 'failed' &&
        event.timestamp < cutoff
      ) {
        toDelete.push(id);
        cleared++;
      }
    });
    
    toDelete.forEach(id => this.queue.delete(id));
    
    if (cleared > 0) {
      console.log(`Cleared ${cleared} old failed webhook events`);
    }
    
    return cleared;
  }
}