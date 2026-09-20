import { Keyboard } from 'react-native';

export function runAfterKeyboardHidden(cb: () => void, fallbackMs = 80): void {
  Keyboard.dismiss();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    sub.remove();
    clearTimeout(timer);
    cb();
  };
  const sub = Keyboard.addListener('keyboardDidHide', finish);
  const timer = setTimeout(finish, fallbackMs);
}
