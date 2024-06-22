export function changeButtontext() {
  var valuenow = document.getElementById('startAnimationBtn') as HTMLInputElement;

  if (valuenow.value == 'Start') {
    valuenow.value = 'Stop';
  } else {
    valuenow.value = 'Start';
  }
}
