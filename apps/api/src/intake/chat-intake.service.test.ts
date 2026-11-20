import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChannelsService } from '../channels/channels.service.js';
import { ChatIntakeService, RECEIVED_REPLY } from './chat-intake.service.js';
import type { IntakeService } from './intake.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

describe('ChatIntakeService', () => {
  const channels = { onMessage: vi.fn(), send: vi.fn() };
  const intake = { receiveMessage: vi.fn() };
  const service = new ChatIntakeService(
    channels as unknown as ChannelsService,
    intake as unknown as IntakeService,
  );
  const recorded = { residentId: 'resident-1', messageId: 'msg-1' };

  afterEach(() => vi.clearAllMocks());

  it('handles every resident message', async () => {
    intake.receiveMessage.mockResolvedValue({
      reportId: 'report-1',
      created: false,
    });
    service.onModuleInit();
    const [handler] = channels.onMessage.mock.calls[0]!;
    await handler({ adapter: { name: 'messenger' } }, {}, recorded);
    expect(intake.receiveMessage).toHaveBeenCalledWith({
      ...recorded,
      channel: 'messenger',
    });
  });

  it('acknowledges a new report', async () => {
    intake.receiveMessage.mockResolvedValue({
      reportId: 'report-1',
      created: true,
    });
    await service.handle('messenger', recorded);
    expect(channels.send).toHaveBeenCalledWith(
      'resident-1',
      'messenger',
      RECEIVED_REPLY,
      { reportId: 'report-1' },
    );
  });

  it('stays quiet on follow-up messages', async () => {
    intake.receiveMessage.mockResolvedValue({
      reportId: 'report-1',
      created: false,
    });
    await service.handle('messenger', recorded);
    expect(channels.send).not.toHaveBeenCalled();
  });
});
