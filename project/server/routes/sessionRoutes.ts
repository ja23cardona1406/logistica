import express from 'express';
import { supabase } from '../index';

const router = express.Router();

// Start a new session
router.post('/start', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    // Check for existing active session
    const { data: existingSession, error: checkError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user_id)
      .eq('active', true)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    if (existingSession) {
      return res.status(400).json({ 
        error: 'User already has an active session',
        session: existingSession
      });
    }
    
    // Create new session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id,
        started_at: new Date().toISOString(),
        active: true
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End a session
router.put('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Update session
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        active: false
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get active session for user
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get active session
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    res.status(200).json(session || null);
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

export default router;