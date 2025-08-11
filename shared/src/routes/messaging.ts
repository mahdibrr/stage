import { Router, Response } from 'express';
import { MessagingModel } from '../models/Messaging';
import { AuthenticatedRequest } from '../middleware/auth';
const router = Router();
router.get('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversations = await MessagingModel.getUserConversations(req.user!.userId);
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
});
router.get('/conversations/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await MessagingModel.getConversationMessages(req.params.id, page, limit);
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    });
  }
});
router.post('/conversations/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, type = 'text', metadata } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }
    const message = await MessagingModel.sendMessage(req.params.id, req.user!.userId, {
      content,
      type,
      metadata
    });
    if (!message) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});
router.post('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { participants, type = 'direct', name } = req.body;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Participants are required'
      });
    }
    const conversation = await MessagingModel.createConversation(req.user!.userId, participants, {
      type,
      name
    });
    if (!conversation) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create conversation'
      });
    }
    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    });
  }
});
router.put('/conversations/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }
    const success = await MessagingModel.markMessageAsRead(messageId, req.user!.userId);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to mark message as read'
      });
    }
    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read'
    });
  }
});
router.get('/online-users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const onlineUsers = await MessagingModel.getOnlineUsers();
    res.json({
      success: true,
      data: onlineUsers
    });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get online users'
    });
  }
});
export { router as messagingRoutes };
