export const PROTOCOL_VERSION = 1;
export const PLAYER_ACTIONS = [
  "see_cards",
  "blind",
  "chaal",
  "raise",
  "pack",
  "show",
  "sideshow",
  "sideshow_accept",
  "sideshow_reject",
];
export const ACK_TIMEOUT_MS = 10000;
let sequence = 0;
export const commandId = () =>
  `${Date.now()}-${++sequence}-${Math.random().toString(36).slice(2)}`;
/** Transport-independent ack shape, deadline and listener cleanup for both clients. */
export function requestAck(socket, event, data, timeoutMs = ACK_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Connection unavailable. Reconnect and try again."));
      return;
    }
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.off("disconnect", lost);
      error ? reject(error) : resolve(value);
    };
    const lost = () =>
      finish(
        new Error("Connection lost. Check the table before trying again."),
      );
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            "No confirmation received. Check the table before trying again.",
          ),
        ),
      timeoutMs,
    );
    socket.on("disconnect", lost);
    const ack = (value) => finish(null, value);
    data === undefined
      ? socket.emit(event, ack)
      : socket.emit(event, data, ack);
  });
}
