export function SpeakTextToSpeech(text, opts) {
  opts = opts || {
    volume: 1,
    rate: 1
  }
  const synth = window.speechSynthesis;
  const zhVoice = synth.getVoices().find(v => v.lang == "zh-CN");
  const utterThis = new SpeechSynthesisUtterance(text);
  utterThis.voice = zhVoice;
  utterThis.volume = opts.volume || 1;
  utterThis.rate = opts.rate || 1;
  synth.speak(utterThis);
}