import express from 'express';
import { supabase } from '../index';

const router = express.Router();

// Get shipment by tracking code
router.get('/:trackingCode', async (req, res) => {
  try {
    const { trackingCode } = req.params;
    
    // Get shipment data from Supabase
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_code', trackingCode)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // Get shipment items
    const { data: items, error: itemsError } = await supabase
      .from('shipment_items')
      .select('*')
      .eq('shipment_id', shipment.id);
    
    if (itemsError) {
      throw itemsError;
    }
    
    // Return combined data
    res.status(200).json({
      ...shipment,
      items: items || []
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

// Get all shipments (for admin)
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
    
    // Get all shipments
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

export default router;