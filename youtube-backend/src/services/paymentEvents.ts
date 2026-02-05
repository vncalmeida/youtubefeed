import { EventEmitter } from 'events';

interface PaymentStatusEvent {
  id: string;
  status: string;
}

class PaymentEvents extends EventEmitter {
  emitStatus(id: string, status: string) {
    this.emit(id, { id, status } as PaymentStatusEvent);
  }

  onStatus(id: string, listener: (e: PaymentStatusEvent) => void) {
    this.on(id, listener);
  }

  offStatus(id: string, listener: (e: PaymentStatusEvent) => void) {
    this.off(id, listener);
  }
}

export const paymentEvents = new PaymentEvents();

