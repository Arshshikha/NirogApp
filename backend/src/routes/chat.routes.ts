import { Router } from 'express';
import { getConversations, getMessages, getOrCreateConversation, sendMessage } from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/messages', sendMessage);

export default router;
