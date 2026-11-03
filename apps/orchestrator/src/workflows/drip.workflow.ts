import { proxyActivities, sleep } from '@temporalio/workflow';
import { DripActivity } from '@gitroom/orchestrator/activities/drip.activity';

const { sendTelegramDripMessageActivity } = proxyActivities<DripActivity>({
  startToCloseTimeout: '5 minute',
  taskQueue: 'main',
  retry: {
    initialInterval: '10 seconds',
    maximumInterval: '1 hour',
    backoffCoefficient: 2,
    maximumAttempts: 10,
  }
});

interface DripSequenceItemInfo {
  id: string;
  day: number;
  content: string;
  media: string | null;
}

export interface DripSubscriberSequenceWorkflowInput {
  subscriberId: string;
  chatId: string;
  sequenceId: string;
  items: DripSequenceItemInfo[];
}

export async function dripSubscriberSequenceWorkflow(input: DripSubscriberSequenceWorkflowInput): Promise<void> {
  const { subscriberId, chatId, sequenceId, items } = input;

  const sortedItems = [...items].sort((a, b) => a.day - b.day);

  let currentDay = 0;

  for (const item of sortedItems) {
    const daysToWait = item.day - currentDay;
    if (daysToWait > 0) {
      await sleep(`${daysToWait} days`);
      currentDay = item.day;
    }

    try {
      await sendTelegramDripMessageActivity(
        chatId,
        item.content,
        item.media,
        subscriberId,
        item.id
      );
    } catch (error) {
      console.error(`Failed to send drip item ${item.id} to subscriber ${subscriberId}`, error);
    }
  }
}
