import express from 'express';
import { supabase } from '../index';

const router = express.Router();

// Get all alerts (for admin)
router.get('/', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.body.user.id)
      .single();
    
    // Check if user is admin
    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get active (unresolved) alerts (for admin dashboard)
router.get('/active', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.body.user.id)
      .single();
    
    // Check if user is admin
    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

// Resolve an alert
router.put('/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const user_id = req.body.user.id;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();
    
    // Check if user is admin
    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { data: alert, error } = await supabase
      .from('alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user_id
      })
      .eq('id', alertId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

export default router;