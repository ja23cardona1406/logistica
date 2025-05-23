import express from 'express';
import { supabase } from '../index';

const router = express.Router();

// Get all processes
router.get('/', async (req, res) => {
  try {
    const { data: processes, error } = await supabase
      .from('processes')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(processes);
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({ error: 'Failed to fetch processes' });
  }
});

// Get a specific process with steps
router.get('/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    
    // Get process data
    const { data: process, error } = await supabase
      .from('processes')
      .select('*')
      .eq('id', processId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Get process steps
    const { data: steps, error: stepsError } = await supabase
      .from('process_steps')
      .select('*')
      .eq('process_id', processId)
      .order('order', { ascending: true });
    
    if (stepsError) {
      throw stepsError;
    }
    
    // Return combined data
    res.status(200).json({
      ...process,
      steps: steps || []
    });
  } catch (error) {
    console.error('Error fetching process:', error);
    res.status(500).json({ error: 'Failed to fetch process' });
  }
});

// Start a new process execution
router.post('/start', async (req, res) => {
  try {
    const { shipment_id } = req.body;
    const user_id = req.body.user.id;
    
    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user_id)
      .eq('active', true)
      .single();
    
    if (sessionError) {
      return res.status(400).json({ error: 'No active session found' });
    }
    
    // Get shipment data
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipment_id)
      .single();
    
    if (shipmentError || !shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // Get appropriate process for shipment type
    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('*')
      .or(`type.eq.${shipment.type},type.eq.both`)
      .single();
    
    if (processError || !process) {
      return res.status(404).json({ error: 'No suitable process found for this shipment type' });
    }
    
    // Create process execution
    const { data: processExecution, error: executionError } = await supabase
      .from('process_executions')
      .insert({
        process_id: process.id,
        shipment_id,
        user_id,
        session_id: session.id,
        status: 'in_progress',
        current_step: 1,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (executionError) {
      throw executionError;
    }
    
    // Get process steps
    const { data: steps, error: stepsError } = await supabase
      .from('process_steps')
      .select('*')
      .eq('process_id', process.id)
      .order('order', { ascending: true });
    
    if (stepsError) {
      throw stepsError;
    }
    
    // Create step executions for each step
    const stepExecutions = steps.map(step => ({
      process_execution_id: processExecution.id,
      step_id: step.id,
      status: 'pending'
    }));
    
    const { error: stepExecutionError } = await supabase
      .from('process_step_executions')
      .insert(stepExecutions);
    
    if (stepExecutionError) {
      throw stepExecutionError;
    }
    
    // Update shipment status
    const { error: shipmentUpdateError } = await supabase
      .from('shipments')
      .update({ status: 'in_progress' })
      .eq('id', shipment_id);
    
    if (shipmentUpdateError) {
      throw shipmentUpdateError;
    }
    
    res.status(201).json(processExecution);
  } catch (error) {
    console.error('Error starting process:', error);
    res.status(500).json({ error: 'Failed to start process' });
  }
});

// Get process execution by ID
router.get('/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const { data: execution, error } = await supabase
      .from('process_executions')
      .select('*')
      .eq('id', executionId)
      .single();
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(execution);
  } catch (error) {
    console.error('Error fetching process execution:', error);
    res.status(500).json({ error: 'Failed to fetch process execution' });
  }
});

// Get step executions for a process execution
router.get('/execution/:executionId/steps', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const { data: stepExecutions, error } = await supabase
      .from('process_step_executions')
      .select('*')
      .eq('process_execution_id', executionId);
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(stepExecutions);
  } catch (error) {
    console.error('Error fetching step executions:', error);
    res.status(500).json({ error: 'Failed to fetch step executions' });
  }
});

// Complete a step in a process execution
router.post('/execution/:executionId/complete-step', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { step_id } = req.body;
    const user_id = req.body.user.id;
    
    // Get current process execution
    const { data: execution, error: executionError } = await supabase
      .from('process_executions')
      .select('*')
      .eq('id', executionId)
      .single();
    
    if (executionError || !execution) {
      return res.status(404).json({ error: 'Process execution not found' });
    }
    
    // Update step execution
    const { error: stepUpdateError } = await supabase
      .from('process_step_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('process_execution_id', executionId)
      .eq('step_id', step_id);
    
    if (stepUpdateError) {
      throw stepUpdateError;
    }
    
    // Get process information to check if this is the last step
    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('*, process_steps(*))')
      .eq('id', execution.process_id)
      .single();
    
    if (processError) {
      throw processError;
    }
    
    // Check if this was the last step
    const isLastStep = execution.current_step === process.process_steps.length;
    
    if (isLastStep) {
      // Complete the process
      const { error: completeError } = await supabase
        .from('process_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);
      
      if (completeError) {
        throw completeError;
      }
      
      // Update shipment status
      const { error: shipmentUpdateError } = await supabase
        .from('shipments')
        .update({ status: 'completed' })
        .eq('id', execution.shipment_id);
      
      if (shipmentUpdateError) {
        throw shipmentUpdateError;
      }
    } else {
      // Move to next step
      const { error: nextStepError } = await supabase
        .from('process_executions')
        .update({
          current_step: execution.current_step + 1
        })
        .eq('id', executionId);
      
      if (nextStepError) {
        throw nextStepError;
      }
    }
    
    res.status(200).json({ success: true, completed: isLastStep });
  } catch (error) {
    console.error('Error completing step:', error);
    res.status(500).json({ error: 'Failed to complete step' });
  }
});

// Report an error in a process execution step
router.post('/execution/:executionId/report-error', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { step_id, error_description } = req.body;
    const user_id = req.body.user.id;
    
    // Get current process execution
    const { data: execution, error: executionError } = await supabase
      .from('process_executions')
      .select('*')
      .eq('id', executionId)
      .single();
    
    if (executionError || !execution) {
      return res.status(404).json({ error: 'Process execution not found' });
    }
    
    // Update step execution to error status
    const { data: stepExecution, error: stepUpdateError } = await supabase
      .from('process_step_executions')
      .update({
        status: 'error',
        error_description
      })
      .eq('process_execution_id', executionId)
      .eq('step_id', step_id)
      .select()
      .single();
    
    if (stepUpdateError) {
      throw stepUpdateError;
    }
    
    // Update process execution status
    const { error: processUpdateError } = await supabase
      .from('process_executions')
      .update({
        status: 'error'
      })
      .eq('id', executionId);
    
    if (processUpdateError) {
      throw processUpdateError;
    }
    
    // Create alert for administrators
    const { data: step, error: stepError } = await supabase
      .from('process_steps')
      .select('title')
      .eq('id', step_id)
      .single();
    
    if (stepError) {
      throw stepError;
    }
    
    // Create alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        process_execution_id: executionId,
        step_execution_id: stepExecution.id,
        user_id,
        type: 'error',
        message: `Error en paso "${step.title}": ${error_description}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (alertError) {
      throw alertError;
    }
    
    res.status(200).json({ success: true, alert });
  } catch (error) {
    console.error('Error reporting problem:', error);
    res.status(500).json({ error: 'Failed to report problem' });
  }
});

// Get active processes for a user
router.get('/user/:userId/active', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: executions, error } = await supabase
      .from('process_executions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['in_progress', 'error'])
      .order('started_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(executions);
  } catch (error) {
    console.error('Error fetching active processes:', error);
    res.status(500).json({ error: 'Failed to fetch active processes' });
  }
});

// Get recent processes (for admin dashboard)
router.get('/recent', async (req, res) => {
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
    
    const { data: executions, error } = await supabase
      .from('process_executions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    res.status(200).json(executions);
  } catch (error) {
    console.error('Error fetching recent processes:', error);
    res.status(500).json({ error: 'Failed to fetch recent processes' });
  }
});

export default router;