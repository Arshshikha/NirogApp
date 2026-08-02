import { Router } from 'express';
import { getProviders, createProviderService, toggleProviderService, updateProviderProfile } from '../controllers/provider.controller';

const router = Router();

router.get('/', getProviders);
router.post('/:providerProfileId/services', createProviderService);
router.put('/services/:id/toggle', toggleProviderService);
router.put('/:providerProfileId/profile', updateProviderProfile);

export default router;
