import { Accuracy, hasStartedLocationUpdatesAsync, startLocationUpdatesAsync, stopLocationUpdatesAsync } from 'expo-location';
import * as TakManager from 'expo-task-manager'
import { removeStorageLocations, saveStorageLocation } from '../libs/asyncStorage/locationStorage';

export const BACKGROUND_TASK_NAME = 'location-tracking'

TakManager.defineTask(BACKGROUND_TASK_NAME, async ({ data, error }) => {
  try {
    if (error) throw error

    const { coords, timestamp } = data.locations[0];

    const currentLocation = {
      latitude: coords.latitude as number,
      longitude: coords.longitute as number,
      timestamp: timestamp as number
    }

    await saveStorageLocation(currentLocation)
  } catch (error) { 
    stopLocationTask()
  }
})

export async function stopLocationTask() {
  try {
    const hasStarted = await hasStartedLocationUpdatesAsync(BACKGROUND_TASK_NAME)
    if (hasStarted) {
      await stopLocationUpdatesAsync(BACKGROUND_TASK_NAME)
      await removeStorageLocations()
    }
  } catch (error) { }
}

export async function startLocationTask() {
  try {
    const hasStarted = await hasStartedLocationUpdatesAsync(BACKGROUND_TASK_NAME)
    if (hasStarted) await stopLocationTask()
    await startLocationUpdatesAsync(BACKGROUND_TASK_NAME, {
      accuracy: Accuracy.Highest,
      distanceInterval: 1,
      timeInterval: 1000
    })
  } catch (error) {}
}

