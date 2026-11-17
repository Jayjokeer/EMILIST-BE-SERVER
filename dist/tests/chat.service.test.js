"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = require("mongoose");
const chat_model_1 = __importDefault(require("../src/models/chat.model"));
const message_model_1 = __importDefault(require("../src/models/message.model"));
const chat_services_1 = require("../src/services/chat.services");
const message_service_1 = require("../src/services/message.service");
(0, node_test_1.default)('chat pagination applies safe defaults and limits oversized requests', () => {
    strict_1.default.deepEqual((0, chat_services_1.normalizePagination)(), { page: 1, limit: 20, skip: 0 });
    strict_1.default.deepEqual((0, chat_services_1.normalizePagination)({ page: '3', limit: '25' }), { page: 3, limit: 25, skip: 50 });
    strict_1.default.deepEqual((0, chat_services_1.normalizePagination)({ page: '-2', limit: '500' }), { page: 1, limit: 100, skip: 0 });
});
(0, node_test_1.default)('chat search treats regex characters as literal text', () => {
    const escaped = (0, chat_services_1.escapeSearchPattern)('Jane (Pro)+');
    strict_1.default.equal(escaped, 'Jane \\(Pro\\)\\+');
    strict_1.default.equal(new RegExp(escaped, 'i').test('Jane (Pro)+'), true);
});
(0, node_test_1.default)('chat attachments are classified for frontend rendering', () => {
    strict_1.default.equal((0, message_service_1.getMessageAttachmentType)('image/png'), 'image');
    strict_1.default.equal((0, message_service_1.getMessageAttachmentType)('audio/webm'), 'audio');
    strict_1.default.equal((0, message_service_1.getMessageAttachmentType)('video/webm'), 'audio');
    strict_1.default.equal((0, message_service_1.getMessageAttachmentType)('application/pdf'), 'file');
});
(0, node_test_1.default)('inbox response includes pagination and the global unread count', async () => {
    const originalAggregate = chat_model_1.default.aggregate;
    const originalCountDocuments = message_model_1.default.countDocuments;
    let pipeline = [];
    chat_model_1.default.aggregate = async (value) => {
        pipeline = value;
        return [{ conversations: [{ chatId: new mongoose_1.Types.ObjectId(), unreadCount: 2 }], metadata: [{ total: 8 }] }];
    };
    message_model_1.default.countDocuments = async () => 5;
    try {
        const result = await (0, chat_services_1.getChatsWithLastMessages)(new mongoose_1.Types.ObjectId().toString(), { page: 2, limit: 3 }, 'Jane (Pro)+');
        strict_1.default.equal(result.unreadCount, 5);
        strict_1.default.equal(result.currentPage, 2);
        strict_1.default.equal(result.totalPages, 3);
        strict_1.default.equal(result.totalConversations, 8);
        strict_1.default.equal(result.conversations.length, 1);
        const searchStage = pipeline.find(stage => stage.$match?.$or);
        strict_1.default.equal(searchStage.$match.$or[0]['participant.fullName'].test('Jane (Pro)+'), true);
        const facetStage = pipeline.find(stage => stage.$facet);
        strict_1.default.deepEqual(facetStage.$facet.conversations.slice(0, 2), [{ $skip: 3 }, { $limit: 3 }]);
    }
    finally {
        chat_model_1.default.aggregate = originalAggregate;
        message_model_1.default.countDocuments = originalCountDocuments;
    }
});
(0, node_test_1.default)('marking a chat read only updates unread messages addressed to the user', async () => {
    const originalFindOne = chat_model_1.default.findOne;
    const originalFind = message_model_1.default.find;
    const originalUpdateMany = message_model_1.default.updateMany;
    const userId = new mongoose_1.Types.ObjectId();
    const senderId = new mongoose_1.Types.ObjectId();
    const chatId = new mongoose_1.Types.ObjectId();
    const messageId = new mongoose_1.Types.ObjectId();
    let updateFilter;
    let updateValue;
    chat_model_1.default.findOne = () => ({ lean: async () => ({ _id: chatId, participants: [userId, senderId] }) });
    message_model_1.default.find = () => ({
        select: () => ({ lean: async () => [{ _id: messageId, senderId }] }),
    });
    message_model_1.default.updateMany = async (filter, value) => {
        updateFilter = filter;
        updateValue = value;
        return { modifiedCount: 1 };
    };
    try {
        const result = await (0, chat_services_1.markChatAsRead)(chatId.toString(), userId.toString());
        strict_1.default.equal(result.markedCount, 1);
        strict_1.default.deepEqual(result.messageIds, [messageId.toString()]);
        strict_1.default.equal(result.senderId, senderId.toString());
        strict_1.default.deepEqual(updateFilter._id.$in, [messageId]);
        strict_1.default.ok(updateValue.$set.readAt instanceof Date);
    }
    finally {
        chat_model_1.default.findOne = originalFindOne;
        message_model_1.default.find = originalFind;
        message_model_1.default.updateMany = originalUpdateMany;
    }
});
