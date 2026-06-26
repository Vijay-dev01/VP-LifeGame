import { Platform } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export function formatDateTimeLabel(iso: string): string {
  return format(new Date(iso), 'MMM d, h:mm a');
}

function mergeDateAndTime(datePart: Date, timePart: Date): Date {
  const merged = new Date(datePart);
  merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return merged;
}

/** Android: native date then time dialogs (avoids dismiss crash from conditional mount). */
export function openAndroidDateTimePicker(
  current: Date,
  onSelect: (date: Date) => void
): void {
  DateTimePickerAndroid.open({
    value: current,
    mode: 'date',
    onChange: (event, selectedDate) => {
      if (event.type !== 'set' || !selectedDate) return;

      DateTimePickerAndroid.open({
        value: mergeDateAndTime(selectedDate, current),
        mode: 'time',
        is24Hour: false,
        onChange: (timeEvent, selectedTime) => {
          if (timeEvent.type !== 'set' || !selectedTime) return;
          onSelect(mergeDateAndTime(selectedDate, selectedTime));
        },
      });
    },
  });
}

export function openDateTimePicker(
  currentIso: string,
  onSelect: (iso: string) => void
): void {
  const current = new Date(currentIso);
  if (Platform.OS === 'android') {
    openAndroidDateTimePicker(current, (date) => onSelect(date.toISOString()));
    return;
  }
  // iOS handled inline in LifeLogForm
}
