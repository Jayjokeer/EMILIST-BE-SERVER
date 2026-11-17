import test from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import Chat from '../src/models/chat.model';
import Message from '../src/models/message.model';
import { escapeSearchPattern, getChatsWithLastMessages, markChatAsRead, normalizePagination } from '../src/services/chat.services';
import { getMessageAttachmentType } from '../src/services/message.service';

test('chat pagination applies safe defaults and limits oversized requests', () => {
  assert.deepEqual(normalizePagination(), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(normalizePagination({ page: '3', limit: '25' }), { page: 3, limit: 25, skip: 50 });
  assert.deepEqual(normalizePagination({ page: '-2', limit: '500' }), { page: 1, limit: 100, skip: 0 });
});

test('chat search treats regex characters as literal text', () => {
  const escaped = escapeSearchPattern('Jane (Pro)+');
  assert.equal(escaped, 'Jane \\(Pro\\)\\+');
  assert.equal(new RegExp(escaped, 'i').test('Jane (Pro)+'), true);
});

test('chat attachments are classified for frontend rendering', () => {
  assert.equal(getMessageAttachmentType('image/png'), 'image');
  assert.equal(getMessageAttachmentType('audio/webm'), 'audio');
  assert.equal(getMessageAttachmentType('video/webm'), 'audio');
  assert.equal(getMessageAttachmentType('application/pdf'), 'file');
});

test('inbox response includes pagination and the global unread count', async () => {
  const originalAggregate = Chat.aggregate;
  const originalCountDocuments = Message.countDocuments;
  let pipeline: any[] = [];

  (Chat as any).aggregate = async (value: any[]) => {
    pipeline = value;
    return [{ conversations: [{ chatId: new Types.ObjectId(), unreadCount: 2 }], metadata: [{ total: 8 }] }];
  };
  (Message as any).countDocuments = async () => 5;

  try {
    const result = await getChatsWithLastMessages(
      new Types.ObjectId().toString(),
      { page: 2, limit: 3 },
      'Jane (Pro)+',
    );

    assert.equal(result.unreadCount, 5);
    assert.equal(result.currentPage, 2);
    assert.equal(result.totalPages, 3);
    assert.equal(result.totalConversations, 8);
    assert.equal(result.conversations.length, 1);

    const searchStage = pipeline.find(stage => stage.$match?.$or);
    assert.equal(searchStage.$match.$or[0]['participant.fullName'].test('Jane (Pro)+'), true);
    const facetStage = pipeline.find(stage => stage.$facet);
    assert.deepEqual(facetStage.$facet.conversations.slice(0, 2), [{ $skip: 3 }, { $limit: 3 }]);
  } finally {
    Chat.aggregate = originalAggregate;
    Message.countDocuments = originalCountDocuments;
  }
});

test('marking a chat read only updates unread messages addressed to the user', async () => {
  const originalFindOne = Chat.findOne;
  const originalFind = Message.find;
  const originalUpdateMany = Message.updateMany;
  const userId = new Types.ObjectId();
  const senderId = new Types.ObjectId();
  const chatId = new Types.ObjectId();
  const messageId = new Types.ObjectId();
  let updateFilter: any;
  let updateValue: any;

  (Chat as any).findOne = () => ({ lean: async () => ({ _id: chatId, participants: [userId, senderId] }) });
  (Message as any).find = () => ({
    select: () => ({ lean: async () => [{ _id: messageId, senderId }] }),
  });
  (Message as any).updateMany = async (filter: any, value: any) => {
    updateFilter = filter;
    updateValue = value;
    return { modifiedCount: 1 };
  };

  try {
    const result = await markChatAsRead(chatId.toString(), userId.toString());
    assert.equal(result.markedCount, 1);
    assert.deepEqual(result.messageIds, [messageId.toString()]);
    assert.equal(result.senderId, senderId.toString());
    assert.deepEqual(updateFilter._id.$in, [messageId]);
    assert.ok(updateValue.$set.readAt instanceof Date);
  } finally {
    Chat.findOne = originalFindOne;
    Message.find = originalFind;
    Message.updateMany = originalUpdateMany;
  }
});
