import express from 'express';
import { supabase } from '../index';

const router = express.Router();

// Get all exemplary processes
router.get('/', async (req, res) => {
  try {
    const { data: processes, error } = await supabase
      .from('exemplary_processes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(processes);
  } catch (error) {
    console.error('Error fetching exemplary processes:', error);
    res.status(500).json({ error: 'Failed to fetch exemplary processes' });
  }
});

// Get specific exemplary process
router.get('/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    
    const { data: process, error } = await supabase
      .from('exemplary_processes')
      .select('*')
      .eq('id', processId)
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(process);
  } catch (error) {
    console.error('Error fetching exemplary process:', error);
    res.status(500).json({ error: 'Failed to fetch exemplary process' });
  }
});

// Create a new exemplary process (admin only)
router.post('/', async (req, res) => {
  try {
    const { process_id, title, description, image_url, video_url } = req.body;
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
    
    const { data: exemplaryProcess, error } = await supabase
      .from('exemplary_processes')
      .insert({
        process_id,
        title,
        description,
        image_url,
        video_url,
        created_by: user_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json(exemplaryProcess);
  } catch (error) {
    console.error('Error creating exemplary process:', error);
    res.status(500).json({ error: 'Failed to create exemplary process' });
  }
});

export default router;