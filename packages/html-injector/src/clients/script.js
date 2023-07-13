window.__sv__nodes__listeners = [];

Element.prototype._addEventListener = Element.prototype.addEventListener;

Element.prototype.addEventListener = function (name, listener, useCapture) {
  this._addEventListener(name, listener, useCapture);
  if (!this.eventListenerList) this.eventListenerList = {};
  if (!this.eventListenerList[name]) this.eventListenerList[name] = [];
  this.eventListenerList[name].push({ listener, useCapture });
  window.__sv__nodes__listeners.push(this);
};

Element.prototype._removeEventListener = Element.prototype.removeEventListener;

Element.prototype.removeEventListener = function (name, listener, useCapture) {
  this._removeEventListener(name, listener, useCapture);
  if (!this.eventListenerList) this.eventListenerList = {};
  if (!this.eventListenerList[name]) this.eventListenerList[name] = [];
  this.eventListenerList[name] = this.eventListenerList[name].filter(
    (event) => event.listener !== listener || event.useCapture !== useCapture
  );
};
