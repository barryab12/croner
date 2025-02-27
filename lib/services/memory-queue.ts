import { EventEmitter } from 'events';

type QueueJob = {
  id: string;
  data: any;
  timestamp: number;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  result?: any;
  error?: Error;
};

type JobProcessor = (jobData: any) => Promise<any>;

export class MemoryQueue extends EventEmitter {
  private jobs: Map<string, QueueJob>;
  private processingJobs: Set<string>;
  private processor: JobProcessor | null;
  private concurrency: number;
  private processTimer: NodeJS.Timeout | null;

  constructor(name: string, options: { concurrency?: number } = {}) {
    super();
    this.jobs = new Map();
    this.processingJobs = new Set();
    this.processor = null;
    this.concurrency = options.concurrency || 1;
    this.processTimer = null;
  }

  async add(id: string, data: any): Promise<QueueJob> {
    const job: QueueJob = {
      id,
      data,
      timestamp: Date.now(),
      status: 'waiting'
    };
    
    this.jobs.set(id, job);
    this.emit('added', job);
    this.startProcessing();
    
    return job;
  }

  process(processor: JobProcessor) {
    this.processor = processor;
    this.startProcessing();
  }

  async waitUntilComplete(job: QueueJob): Promise<any> {
    if (job.status === 'completed') {
      return job.result;
    }
    if (job.status === 'failed') {
      throw job.error;
    }
    
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.removeListener('completed', handleComplete);
        this.removeListener('failed', handleFailed);
      };

      const handleComplete = (completedJob: QueueJob) => {
        if (completedJob.id === job.id) {
          cleanup();
          resolve(completedJob.result);
        }
      };

      const handleFailed = (failedJob: QueueJob, error: Error) => {
        if (failedJob.id === job.id) {
          cleanup();
          reject(error);
        }
      };

      this.on('completed', handleComplete);
      this.on('failed', handleFailed);
    });
  }

  private startProcessing() {
    if (!this.processTimer && this.processor) {
      this.processTimer = setInterval(() => this.processNextJobs(), 100);
    }
  }

  private async processNextJobs() {
    if (!this.processor || this.processingJobs.size >= this.concurrency) {
      return;
    }

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'waiting' && !this.processingJobs.has(id)) {
        this.processJob(job);
      }

      if (this.processingJobs.size >= this.concurrency) {
        break;
      }
    }
  }

  private async processJob(job: QueueJob) {
    if (!this.processor) return;

    this.processingJobs.add(job.id);
    job.status = 'active';
    this.emit('active', job);

    try {
      const result = await this.processor(job.data);
      job.status = 'completed';
      job.result = result;
      this.emit('completed', job);
    } catch (error) {
      job.status = 'failed';
      job.error = error as Error;
      this.emit('failed', job, error);
    } finally {
      this.processingJobs.delete(job.id);
    }
  }

  async getJob(id: string): Promise<QueueJob | undefined> {
    return this.jobs.get(id);
  }

  async clean(age: number) {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        if (now - job.timestamp > age) {
          this.jobs.delete(id);
        }
      }
    }
  }

  async close() {
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }
    this.removeAllListeners();
    this.jobs.clear();
    this.processingJobs.clear();
  }
}