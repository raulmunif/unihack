// app/api/alerts/[id]/route.js
import { NextResponse } from 'next/server';
import { 
  getAlertById,
  updateAlert,
  deactivateAlert 
} from '@/lib/datastax';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const alert = await getAlertById(id);
    
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert' },
      { status: 500 }
    );
  }
}

// Update an alert
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    const updatedAlert = await updateAlert(id, updateData);
    
    if (!updatedAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ alert: updatedAlert });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// Deactivate an alert
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const result = await deactivateAlert(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Alert deactivated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deactivating alert:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate alert' },
      { status: 500 }
    );
  }
}