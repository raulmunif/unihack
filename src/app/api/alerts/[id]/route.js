import { NextResponse } from 'next/server';
import { getAlertById, updateAlert, deactivateAlert } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const alert = await getAlertById(params.id);
    
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const data = await request.json();
    const alert = await updateAlert(params.id, data);
    
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const alert = await deactivateAlert(params.id);
    
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error deactivating alert:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate alert' },
      { status: 500 }
    );
  }
}