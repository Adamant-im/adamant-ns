import { spawnRetryNotifyJob } from './retryNotifyJob.js';

export const spawnJobs = () => {
  const retryNotifyJob = spawnRetryNotifyJob();

  retryNotifyJob.start();

  return [
    {
      name: 'RetryNotifyJob',
      task: retryNotifyJob
    }
  ];
};
