/**
 * Command Pattern: Encapsulates a sale action as an object, enabling
 * execution, undo, and state tracking (saleId) for the operation.
*/

export interface SalePayload {
  item: any;
  employeeId: string;
  branchId: string;
  baseUrl: string;
}

// Command Interface: declares execute/undo methods that all concrete commands implement
interface Command {
  execute(): Promise<any>;
  undo(): Promise<void>;
  getSaleId(): string | null;
}

// Concrete Command: implements the Command interface for a specific sale operation
export class SaleCommand implements Command {
  // Stores the saleId after execution for undo operations
  private saleId: string | null = null;

  // Constructor captures all necessary context (payload) to execute/undo later
  constructor(private payload: SalePayload) {}

  // Execute: performs the sale action and stores result state
  async execute(): Promise<any> {
    // API call to create sale
    const res = await fetch(`${this.payload.baseUrl}/sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: this.payload.item.id,
        employeeId: this.payload.employeeId,
        branchId: this.payload.branchId,
        productName: this.payload.item.product_name,
        isGrilled: this.payload.item.is_grilled
      })
    });
    
    if (!res.ok) throw new Error("Sale execution failed");
    const data = await res.json();
    this.saleId = data.id; // Capture saleId for future undo
    return data;
  }

  // Undo: reverses the execute operation using stored saleId
  async undo(): Promise<void> {
    if (!this.saleId) throw new Error("No sale ID to undo"); 
    const res = await fetch(`${this.payload.baseUrl}/undo/${this.saleId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: this.payload.item.id,
        branchId: this.payload.branchId,
        isGrilled: this.payload.item.is_grilled
      })
    });
    if (!res.ok) throw new Error(`Undo failed for sale ${this.saleId}`);
  }
  // Getter exposes saleId without exposing internal state
  getSaleId() { return this.saleId; }
}

// Invoker: maintains command history and triggers execution/undo
const commandHistory: Command[] = [];

// Invoker method: creates, executes, and stores command in history
export async function executeSale(payload: SalePayload) {
  // Client creates concrete command with payload
  const command = new SaleCommand(payload);
  
  // Invoker calls execute() on command
  const result = await command.execute();

  // Command only added to history if execute succeeded
  commandHistory.push(command);
  return result;
}

// Invoker method: retrieves command from history and calls undo()
export async function undoLastSale(saleId?: string) {
  if (saleId) {
    // Linear search through history to find matching sale
    const index = commandHistory.findIndex(c => c.getSaleId() === saleId);
    if (index !== -1) {
      const [command] = commandHistory.splice(index, 1);
      await command.undo();
      return true;
    }
  } else {
    // Standard stack pop if no ID is provided (LIFO)
    const command = commandHistory.pop();
    if (command) {
      await command.undo();
      return true;
    }
  }
  return false;
}